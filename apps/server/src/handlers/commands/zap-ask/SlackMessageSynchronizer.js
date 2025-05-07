/**
 * SlackMessageSynchronizer
 * Class-based implementation for synchronizing Slack messages and files
 */
const { batchStoreMessages } = require("../../../services/batch-store-messages");
const fetchChannelMessages = require("../../../services/fetch-channel-messages");
const fetchRepliesFromPastThreads = require("../../../services/fetch-replies-from-past-threads");
const { getLastSyncState, updateSyncState, getOptedOutUsers } = require("../../../helpers/db-helpers");
const { processMessages } = require("../../../helpers/process-messages");
const FileProcessor = require("./FileProcessor");
const { ALLOWED_FILE_TYPES } = require("../../../constants/config");



class SlackMessageSynchronizer {
  constructor(dependencies = {}) {
    // Track active sync operations per channel to prevent concurrent syncs
    this.syncLocks = new Map();

    // Initialize the file processor
    this.fileProcessor = dependencies.fileProcessor || new FileProcessor();
  }

  /**
   * Main entry: sync Slack messages for a channel
   * @param {Object} params - Function parameters
   * @param {Object} params.supabase - Supabase client
   * @param {Object} params.client - Slack client
   * @param {string} params.channelId - Channel ID to sync
   * @param {string} params.botToken - Slack bot token
   * @param {string} params.teamId - Team ID
   * @returns {Promise<void>}
   */
  async syncMessages({ supabase, client, channelId, botToken, teamId }) {
    this.teamId = teamId;
    // Skip if sync already in progress for this channel
    if (this.syncLocks.get(channelId)) {
      console.log(`[SYNC] Sync already in progress for channel ${channelId}. Skipping...`);
      return;
    }
    
    // Acquire lock
    this.syncLocks.set(channelId, true);

    try {
      console.log(`[SYNC] Starting sync for channel ${channelId}...`);
      
      // Fetch and process data
      const syncData = await this._fetchAndProcessData({ 
        supabase, 
        client, 
        channelId, 
        botToken 
      });
      
      // Skip if no new data
      if (!syncData) {
        console.log(`[SYNC] No new data for channel ${channelId}`);
        return;
      }

      // Store data and update sync state
      await this._storeAndFinalize({ 
        supabase, 
        syncData, 
        channelId, 
        teamId 
      });
      
      console.log(`[SYNC] Sync complete for channel ${channelId}!`);
    } catch (error) {
      console.error(`[SYNC] Error syncing Slack messages for channel ${channelId}:`, error);
    } finally {
      // Release lock
      this.syncLocks.delete(channelId);
    }
  }

  /**
   * Splits messages into text-only and file-containing arrays
   * @private
   * @param {Array} messages - Array of Slack messages
   * @param {Array} optedOutUsers - Array of user IDs who opted out
   * @returns {Object} - Separated messages { textMessages, fileMessages }
   */
  _separateMessages(messages, optedOutUsers = []) {
    const textMessages = [];
    const fileMessages = [];
    
    messages.forEach((msg) => {
      // Skip bot messages and system messages
      if (msg.bot_id) return;
      if (msg.subtype && ["channel_join", "bot_message"].includes(msg.subtype)) return;
      
      // Skip messages from opted-out users
      if (optedOutUsers.includes(msg.user)) return;
      
      // Skip messages where the original sender added a no_entry_sign reaction
      const hasNoEntryFromSender = msg.reactions?.some(
        reaction => reaction.name === 'no_entry_sign' && reaction.users.includes(msg.user)
      );
      if (hasNoEntryFromSender) return;
      
      const hasText = (msg.text?.trim() || "").length > 0;
      const allowedFiles = msg.files?.filter(file => ALLOWED_FILE_TYPES.includes(file.filetype)) || [];
      
      if (hasText) textMessages.push(msg);
      if (allowedFiles.length) fileMessages.push({ ...msg, files: allowedFiles });
    });
    
    return { textMessages, fileMessages };
  }
  /**
   * Fetches new messages and replies, processes them
   * @private
   * @param {Object} params - Function parameters
   * @param {Object} params.supabase - Supabase client
   * @param {Object} params.client - Slack client
   * @param {string} params.channelId - Channel ID to sync
   * @param {string} params.botToken - Slack bot token
   * @returns {Promise<Object|null>} - Processed data or null if no data
   */
  async _fetchAndProcessData({ supabase, client, channelId, botToken }) {
    console.log(`[SYNC] Retrieving last sync state for channel ${channelId}...`);
    const [lastSyncData, optedOutUsers] = await Promise.all([
      getLastSyncState({ supabase }),
      getOptedOutUsers({ supabase, team_id: this.teamId }),
    ]);
    let repliesData, mainMessagesData;
    
    // Fetch messages based on last sync state
    if (Object.keys(lastSyncData.threadTSData).length > 0) {
      console.log(`[SYNC] Fetching both replies and main messages for ${channelId}`);
      
      [repliesData, mainMessagesData] = await Promise.all([
        fetchRepliesFromPastThreads({ 
          client, 
          channelId, 
          threadHistory: lastSyncData
        }),
        fetchChannelMessages({ 
          channelId, 
          limit: 500, 
          oldest: lastSyncData.lastMainTS, 
          client 
        })
      ]);
     
    } else {
      console.log(`[SYNC] Fetching only main messages for ${channelId}`);
      
      mainMessagesData = await fetchChannelMessages({ 
        channelId,  
        limit: 500, 
        oldest: lastSyncData.lastMainTS, 
        client 
      });
      repliesData = { updatedThreadTSData: {}, allNewReplies: [] };
    }

    const { updatedThreadTSData = {}, allNewReplies: newReplies = [] } = repliesData;
    const { messages = [], threads = {} } = mainMessagesData;

    console.log(`[SYNC] Filtering messages...`);
    
    // Separate messages into text and file messages
    const { textMessages: mainTextMessages, fileMessages: mainFileMessages } = this._separateMessages(messages,optedOutUsers);
    const { textMessages: replyTextMessages, fileMessages: replyFileMessages } = this._separateMessages(newReplies,optedOutUsers);

    const allTextMessages = [...mainTextMessages, ...replyTextMessages];
    const allFileMessages = [...mainFileMessages, ...replyFileMessages];

    console.log(`[SYNC] Main Messages: ${mainTextMessages.length} text, ${mainFileMessages.length} files`);
    console.log(`[SYNC] Reply Messages: ${replyTextMessages.length} text, ${replyFileMessages.length} files`);

    // Skip processing if no new messages
    if (!allTextMessages.length && !allFileMessages.length) {
      console.log(`[SYNC] No new messages or files found for channel ${channelId}. Skipping processing.`);
      return null;
    }

    // Process text and file messages
    const processedData = await this._processTextAndFiles({ 
      allTextMessages, 
      allFileMessages, 
      channelId, 
      botToken, 
      supabase 
    });
    
    return { 
      ...processedData, 
      updatedThreadTSData, 
      threads, 
      messages, 
      lastSyncData 
    };
  }

  /**
   * Processes text and file messages
   * @private
   * @param {Object} params - Function parameters
   * @param {Array} params.allTextMessages - Text messages to process
   * @param {Array} params.allFileMessages - File messages to process
   * @param {string} params.channelId - Channel ID
   * @param {string} params.botToken - Slack bot token
   * @param {Object} params.supabase - Supabase client
   * @returns {Promise<Object>} - Processing results
   */
  async _processTextAndFiles({ allTextMessages, allFileMessages, channelId, botToken, supabase }) {
    const promises = [];
    
    // Process text messages if any
    let textPromise = null;
    if (allTextMessages.length) {
      console.log(`[SYNC] Processing ${allTextMessages.length} text messages...`);
      textPromise = processMessages({ 
        messages: allTextMessages, 
        channelId,
        teamId: this.teamId
      });
      promises.push(textPromise);
    }

    // Process file messages if any
    let filePromise = null;
    if (allFileMessages.length) {
      console.log(`[SYNC] Processing ${allFileMessages.length} file messages...`);
      filePromise = this.fileProcessor.processFileMessages({ 
        fileMessages: allFileMessages, 
        slackToken: botToken, 
        channelId, 
        supabase 
      });
      promises.push(filePromise);
    }

    // Wait for all processing to complete
    await Promise.allSettled(promises);
    
    // Retrieve results directly from the specific promises, not by position
    return {
      processedTextMessages: textPromise ? await textPromise : [],
      processedFileMessages: filePromise ? await filePromise : []
    };
  }

  /**
   * Stores processed data and updates sync state
   * @private
   * @param {Object} params - Function parameters
   * @param {Object} params.supabase - Supabase client
   * @param {Object} params.syncData - Processed sync data
   * @param {string} params.channelId - Channel ID
   * @param {string} params.teamId - Team ID
   * @returns {Promise<void>}
   */
  async _storeAndFinalize({ supabase, syncData, channelId, teamId }) {
    const { 
      processedTextMessages, 
      processedFileMessages, 
      updatedThreadTSData, 
      threads, 
      messages, 
      lastSyncData 
    } = syncData;

    // Store processed text messages
    if (processedTextMessages.length) {
      console.log(`[SYNC] Storing ${processedTextMessages.length} text messages...`);
      await batchStoreMessages({ 
        supabase, 
        messages: processedTextMessages 
      });
    }

    // Log file processing results
    if (processedFileMessages.length) {
      console.log(`[SYNC] ${processedFileMessages.length} files processed and stored`);
    }

    // Update sync state with latest timestamp
    const latestMainTS = messages[0]?.ts || lastSyncData.lastMainTS;
    await updateSyncState({
      supabase,
      channelId,
      lastMainTS: latestMainTS,
      threadTSData: { ...updatedThreadTSData, ...threads },
      teamId
    });
  }
}

module.exports = SlackMessageSynchronizer;