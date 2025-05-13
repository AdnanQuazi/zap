/**
 * SearchFunctions Class
 * Handles various search operations for messages and documents
 */
const timestampUtils = require('../utils/timestamp-utils');
const structureMessages = require("../helpers/structure-messages");
const hybridSearchPipeline = require("../pipelines/hybrid-search-pipeline");
const { MAX_FILES_TO_PROCESS, DEFAULT_LIMIT, DEFAULT_WINDOW_SIZE } = require('../constants/config');

class SearchFunctions {
  /**
   * Creates a new SearchFunctions instance
   * @param {Object} supabase - Supabase client
   */
  constructor(supabase) {
    this.supabase = supabase;
    this.MAX_FILES_TO_PROCESS = MAX_FILES_TO_PROCESS;
    this.DEFAULT_LIMIT =  DEFAULT_LIMIT; 
    this.DEFAULT_WINDOW_SIZE = DEFAULT_WINDOW_SIZE; 
  }

  /**
   * Builds base Supabase query for documents
   * @param {Array<string>} fileNames - File names to query
   * @param {string} channelId - Channel ID
   * @returns {Object} Base query object
   */
  _buildDocumentBaseQuery(fileNames, channelId) {
    return this.supabase
      .from("documents")
      .select(`
        permalink,
        name,
        channel_id,
        user_id,
        document_chunks (
          text,
          chunk_index,
          created_at
        )
      `)
      .in("name", fileNames)
      .eq("channel_id", channelId);
  }

  /**
   * Builds base Supabase query for messages
   * @param {string} channelId - Channel ID
   * @returns {Object} Base query object
   */
  _buildMessageBaseQuery(channelId) {
    return this.supabase
      .from("slack_messages")
      .select("user_id, thread_ts, ts, text, type")
      .eq("channel_id", channelId)
      .order("ts", { ascending: true });
  }

  /**
   * Analyzes document content from specific files
   * @param {Object} options - Function parameters
   * @param {Array<string>} options.fileNames - Names of files to analyze
   * @param {string} options.channelId - Channel ID
   * @param {string|null} options.startTs - Start timestamp
   * @param {string|null} options.endTs - End timestamp
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeDocuments({
    fileNames,
    channelId,
    startTs = null,
    endTs = null
  }) {
    try {
      const filesToProcess = fileNames.slice(0, this.MAX_FILES_TO_PROCESS);
      const note = fileNames.length > this.MAX_FILES_TO_PROCESS 
        ? "Cannot exceed more than 2 files at once" 
        : null;

      let query = this._buildDocumentBaseQuery(filesToProcess, channelId);
      
      if (startTs !== null) query = query.lte("ts", startTs);
      if (endTs !== null) query = query.gte("ts", endTs);

      const { data, error } = await query;
      if (error) throw error;

      return { 
        data, 
        note, 
        suggestions: "Please ensure that the file name exactly matches the file as uploaded on Slack and that it is associated with the correct channel."
      };
    } catch (error) {
      return {
        data: [],
        error: error.message,
        suggestions: "Please try again with different file names or check channel ID."
      };
    }
  }

  /**
   * Summarizes conversation within a timeframe
   * @param {Object} options - Function parameters
   * @param {string|null} options.startTs - Start timestamp
   * @param {string|null} options.endTs - End timestamp
   * @param {string} options.channelId - Channel ID
   * @param {boolean} options.includeDocs - Whether to include document references
   * @returns {Promise<Object>} Summarization results
   */
  async summarizeConversation({
    startTs = null,
    endTs = null,
    channelId,
    includeDocs = false
  }) {
    try {
      let query = this._buildMessageBaseQuery(channelId);
  
      if (startTs !== null) query = query.gte("ts", startTs);
      if (endTs !== null) {
        query = query.lte("ts", endTs);
      } else {
        query = query.limit(this.DEFAULT_LIMIT);
      }
      
      const { data, error } = await query;
      if (error) throw new Error(`Error fetching messages: ${error.message}`);

      return { 
        data: structureMessages(data), 
        note: "Messages are summarized within a 15-day window.",
        suggestions: "Consider inquiring about topics discussed within this channel."
      };
    } catch (error) {
      return {
        data: [],
        error: error.message,
        suggestions: "Please try a different time range or channel."
      };
    }
  }

  /**
   * Performs hybrid search with optional context
   * @param {Object} options - Function parameters
   * @param {string} options.broadenedQuery - Expanded search query
   * @param {Object} options.queryEmbedding - Query embedding for vector search
   * @param {string} options.channelId - Channel ID
   * @param {string} options.tsQuery - PostgreSQL text search query
   * @param {string|null} options.startTs - Start timestamp
   * @param {string|null} options.endTs - End timestamp
   * @param {number} options.windowSize - Size of message window
   * @returns {Promise<Object>} Search results
   */
  async hybridSearch({
    broadenedQuery,
    queryEmbedding,
    channelId,
    tsQuery,
    startTs = null,
    endTs = null,
    windowSize = this.DEFAULT_WINDOW_SIZE,
    supabase
  }) {
    try {
      // Use injected supabase if available (for backward compatibility)
      const db = supabase || this.supabase;
      
      const data = await hybridSearchPipeline({
        query: broadenedQuery,
        queryEmbedding,
        channelId,
        startTs,
        endTs,
        windowSize,
        tsQuery,
        supabase: db
      });
      
      return {
        data,
        note: null,
        suggestions: "Consider inquiring about topics discussed within this channel."
      };
    } catch (error) {
      return {
        data: [],
        error: error.message,
        suggestions: "Please try refining your search terms or time range."
      };
    }
  }
}

// Create singleton instances of the functions for direct export compatibility
let supabaseInstance = null;

/**
 * Set the supabase instance for the search functions
 * @param {Object} supabase - Supabase client
 */
function setSupabaseInstance(supabase) {
  supabaseInstance = supabase;
}

/**
 * Get the search functions instance
 * @returns {SearchFunctions} Search functions instance
 */
function getSearchFunctions() {
  if (!supabaseInstance) {
    throw new Error("Supabase instance not set. Call setSupabaseInstance first.");
  }
  return new SearchFunctions(supabaseInstance);
}

// Export singleton functions for compatibility with existing code
module.exports = {
  analyzeDocuments: (options) => {
    setSupabaseInstance(options.supabase);
    const { supabase, ...rest } = options;
    return getSearchFunctions().analyzeDocuments(rest);
  },
  
  summarizeConversation: (options) => {
    setSupabaseInstance(options.supabase);
    const { supabase, ...rest } = options;
    return getSearchFunctions().summarizeConversation(rest);
  },
  
  hybridSearch: (options) => {
    setSupabaseInstance(options.supabase);
    const { supabase, ...rest } = options;
    return getSearchFunctions().hybridSearch({...rest, supabase: options.supabase});
  },
  
  // Export utilities for backward compatibility
  isWithinLast15Days: timestampUtils.isWithinLast15Days,
  convertToUnixTimestamp: timestampUtils.convertToUnixTimestamp,
  
  // Export the class directly for new code
  SearchFunctions
};