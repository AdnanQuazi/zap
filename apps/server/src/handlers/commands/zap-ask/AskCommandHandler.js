/**
 * Optimized Ask Command Handler
 * Class-based implementation for handling Slack /ask command with performance optimizations
 */

const appendQueryContext = require("../../../helpers/query-context");
const extractAndParseJson = require("../../../helpers/json-parser");
const shouldTriggerSync = require("../../../helpers/sync-rate-limit");
const {
  checkTeamQuota,
  getUserTimezone,
  generateQuotaLimitMessage,
} = require("../../../helpers/ask-rate-limit");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const NodeCache = require("node-cache"); // You'll need to install this package
const QueryProcessor = require("./QueryProcessor");
const ResponseGenerator = require("./ResponseGenerator");
const SlackMessageSynchronizer = require("./SlackMessageSynchronizer");
const { PROCESSING_MESSAGES } = require("../../../constants/config");
const { isSmartContextEnabled } = require("../../../helpers/db-helpers");

// Response cache that persists across requests
const responseCache = new NodeCache({ stdTTL: 120 }); // Cache expires after 2 min

/**
 * AskCommandHandler - Main class for handling the /ask slash command in Slack
 */
class AskCommandHandler {
  /**
   * Create a new AskCommandHandler instance
   * @param {Object} dependencies - Injected dependencies
   * @param {GoogleGenerativeAI} dependencies.genAI - Google Generative AI client
   */
  constructor(dependencies = {}) {
    // Initialize dependencies
    this.genAI =
      dependencies.genAI || new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Initialize components
    this.queryProcessor = new QueryProcessor({ cache: responseCache, genAI: this.genAI });
    this.synchronizer = new SlackMessageSynchronizer();
    this.responseGenerator = new ResponseGenerator(this.model, {
      cache: responseCache,
    });
  }

  /**
   * Handle the /ask slash command
   * @param {Object} param0 - Slack command event object
   * @param {Object} param0.command - Command data
   * @param {Function} param0.ack - Acknowledge function
   * @param {Function} param0.respond - Response function
   * @param {Object} param0.context - Context object with team and user info
   * @param {Object} param0.client - Slack client
   * @returns {Promise<void>}
   */
  async handleCommand({ command, ack, respond, context, client }) {
    // Step 1: Acknowledge the command immediately
    await ack();
    console.log(context.botNotInChannel)
    if (context.botNotInChannel) {
      await respond({
        text: "Hello! 👋 I'm not currently in this channel. Would you mind sending me an invite? 😊",
      });
      return;
    }
    // Extract command data
    const {
      channel_id: channelId,
      text: queryText,
      team_domain: subdomain,
    } = command;
    const { teamId, userId, botToken, supabase } = context;

    // Track performance metrics
    const startTime = Date.now();

    try {
      // Step 2: Check if this is a cached query
      const cacheKey = `${teamId}:${channelId}:${queryText
        .trim()
        .toLowerCase()}`;
      const cachedResponse = responseCache.get(cacheKey);

      if (cachedResponse) {
        // Send cached response
        await respond({
          text: "Answer to your question",
          blocks: cachedResponse.blocks,
        })
        console.log(
          `[PERF] Cached response delivered in ${Date.now() - startTime}ms`
        );
        return;
      }

      // Step 3: Run initial checks in parallel
      const [smartContextEnabled, quotaCheckResult] = await Promise.all([
        this._checkSmartContextEnabled(supabase, respond, teamId),
        this._checkQuota(client, userId, teamId, channelId),
      ]);

      if (!smartContextEnabled || !quotaCheckResult.hasQuota) return;

      // Step 4: First check if sync is needed
      const syncNeeded = shouldTriggerSync({ channelId });

      // Step 5: If sync is needed, send sync message and perform sync
      if (syncNeeded) {
        await this._sendSyncingMessage(respond);
        await this._syncSlackMessagesIfNeeded(channelId, {
          supabase,
          client,
          botToken,
          teamId,
          channelId,
        });
      }
      // If no sync needed, send processing message
      else {
        await this._sendProcessingMessage(respond);
      }

      // Step 6: Then process query to get relevant context from Slack (after sync if it happened)
      const slackContext = await this.queryProcessor.processQuery({
        query: queryText,
        channelId,
        supabase,
      });

      console.log(
        `[PERF] Context retrieval completed in ${Date.now() - startTime}ms`
      );

      // Step 7: Generate AI response with context
      const aiResponsePromise = this.responseGenerator.generateResponse({
        query: queryText,
        context: slackContext,
        subdomain,
        channelId,
      });

      // Step 8: While AI is generating, prepare response template
      const responseTemplate = this._prepareResponseTemplate(
        queryText,
        slackContext,
        quotaCheckResult.quotaInfo
      );

      // Wait for AI response
      const aiResponseText = await aiResponsePromise;
      console.log(
        `[PERF] AI response generated in ${Date.now() - startTime}ms`
      );

      // Step 9: Parse and prepare the final response
      const { blocks } = await this._prepareResponse({
        aiResponseText,
        responseTemplate,
      });

      // Step 10: Post the final response to the user
      await respond({
        text: "Answer to your question",
        blocks: blocks,
      })

      // Cache the successful response
      responseCache.set(cacheKey, { blocks });

      console.log(`[PERF] Total response time: ${Date.now() - startTime}ms`);
    } catch (error) {
      // Handle errors gracefully
      await this._handleError(error, client, channelId, userId);
      console.log(`[PERF] Error response time: ${Date.now() - startTime}ms`);
    }
  }

  /**
   * Prepare response template while waiting for AI response
   * @private
   */
  _prepareResponseTemplate(queryText, slackContext, quotaInfo) {
    return {
      queryText,
      contextNote: slackContext.note,
      quotaInfo,
    };
  }

  /**
   * Check if Smart Context is enabled for the team
   * @private
   */
  async _checkSmartContextEnabled(supabase, respond, teamId) {
    const smartContextEnabled = await isSmartContextEnabled({
      supabase,
      teamId,
    });
    if (!smartContextEnabled) {
      await respond({
        response_type: "ephemeral",
        text:
          "⚠️ Please ask an admin to enable *Smart Context* to use this command.",
      });
      return false;
    }
    return true;
  }

  /**
   * Check quota limits for the team
   * @private
   */
  async _checkQuota(client, userId, teamId, channelId) {
    const userTimezone = await getUserTimezone({ client, userId });
    const quotaInfo = await checkTeamQuota({
      teamId,
      maxRequests: 30,
      userTimezone,
    });

    // If quota is exceeded, notify the user and exit
    if (!quotaInfo.hasQuota) {
      const quotaMessage = generateQuotaLimitMessage(quotaInfo);
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: quotaMessage,
      });
      return { hasQuota: false };
    }

    return { hasQuota: true, quotaInfo };
  }

  /**
   * Send a random processing message
   * @private
   */
  async _sendProcessingMessage(respond) {
    const randomProcessingText =
      PROCESSING_MESSAGES[
        Math.floor(Math.random() * PROCESSING_MESSAGES.length)
      ];
    return respond({
      text: randomProcessingText,
    })
  }

  async _sendSyncingMessage(respond) {
    return respond({
      text: "Syncing your Slack messages... 🔄 This might take a moment.",
      // Optional: Use blocks for richer formatting
    });
  }

  /**
   * Conditionally sync Slack messages if needed
   * @private
   */
  async _syncSlackMessagesIfNeeded(channelId, options) {
    try {
      await this.synchronizer.syncMessages(options);
    } catch (syncError) {
      console.warn("[ASK] ⚠️ Slack sync warning:", syncError);
      // Continue even if sync fails
    }
  }

  /**
   * Prepare response for sending to Slack
   * @private
   */
  async _prepareResponse({ aiResponseText, responseTemplate }) {
    // Parse the AI response
    const parsedResponse = await extractAndParseJson(aiResponseText);

    // Append context to the response blocks
    const blocks = appendQueryContext({
      blocks: parsedResponse.blocks,
      query: responseTemplate.queryText,
      contextNote: responseTemplate.contextNote,
      quotaInfo: responseTemplate.quotaInfo,
    });

    return { blocks };
  }

  /**
   * Handle errors gracefully
   * @private
   */
  async _handleError(error, client, channelId, userId) {
    console.error("[ASK] ❌ /ask command error:", error);

    try {
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text:
          "⚠️ Oops! Something went wrong while processing your request. Please try again later.",
      });
    } catch (postError) {
      console.error(
        "[ASK] ❌ Failed to post error message to Slack:",
        postError
      );
    }
  }
}

const handler = new AskCommandHandler();
// Export a function that uses the singleton instance
module.exports = ({ command, ack, respond, context, client }) => {
  return handler.handleCommand({ command, ack, respond, context, client });
};