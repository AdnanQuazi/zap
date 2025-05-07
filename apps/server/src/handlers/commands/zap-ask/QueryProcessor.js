/**
 * QueryProcessor Class
 * Handles search queries and context retrieval from Slack messages and documents
 */
const planningPrompt = require("../../../prompts/planning-prompt");
const {
  analyzeDocuments,
  summarizeConversation,
  hybridSearch,
} = require("../../../helpers/search-pipeline-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const getQueryEmbedding = require("../../../services/xenovo-embedding-service");

class QueryProcessor {
  constructor(dependencies = {}) {
    this.genAI =
      dependencies.genAI || new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.planningModel = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
    });
    
    // Define conversational patterns
    this.conversationalPatterns = {
      greetings: /^(hi|hello|hey|good morning|good afternoon|good evening|what's up|howdy)/i,
      wellbeing: /^(how are you|how's it going|how do you do|how are things|what's new)/i,
      thanks: /^(thanks|thank you|thx|ty|appreciate it)/i,
      farewell: /^(bye|goodbye|see you|farewell|see ya|later)/i
    };
  }

  /**
   * Check if a query is conversational and doesn't need context
   * @param {string} query - User query text
   * @returns {boolean} - Whether the query is conversational
   */
  _isConversationalQuery(query) {
    if (!query) return false;
    
    // Check against conversational patterns
    return Object.values(this.conversationalPatterns).some(pattern => 
      pattern.test(query.trim().toLowerCase())
    );
  }

  /**
   * Handle simple conversational queries that don't need context
   * @param {string} query - User query text
   * @returns {Object} - Response for conversational query
   */
  _handleConversationalQuery(query) {
    const lowercaseQuery = query.trim().toLowerCase();
    let response = "";

    if (this.conversationalPatterns.greetings.test(lowercaseQuery)) {
      response = "Hello! How can I help you today?";
    } else if (this.conversationalPatterns.wellbeing.test(lowercaseQuery)) {
      response = "I'm doing well, thanks for asking! How can I assist you?";
    } else if (this.conversationalPatterns.thanks.test(lowercaseQuery)) {
      response = "You're welcome! Is there anything else you'd like to know?";
    } else if (this.conversationalPatterns.farewell.test(lowercaseQuery)) {
      response = "Goodbye! Feel free to ask if you need anything else.";
    }

    return {
      data: [{ text: response, type: "conversation" }],
      note: "Conversational response",
      suggestions: "Try asking about specific information in your Slack channels or documents."
    };
  }

  async _processTimestamps(args) {
    const timestampUtils = require("../../../utils/timestamp-utils");
    if(!args.startTs && !args.endTs){
      return args;
    }
    
    const startUnix = timestampUtils.convertToUnixTimestamp(args.startTs);
    const endUnix = timestampUtils.convertToUnixTimestamp(args.endTs);
    const isWithinLast15Days = timestampUtils.isWithinLast15Days(args.endTs);

    return {
      ...args,
      startTs: startUnix,
      endTs: isWithinLast15Days.isValid ? endUnix : isWithinLast15Days.nowUnix,
      tsValid: isWithinLast15Days.isValid,
    };
  }
  
  async _prepareHybridSearchArgs(args) {
    if (!args.queryEmbedding) {
      try {
        let embedding = await getQueryEmbedding(args.broadenedQuery);
        args.queryEmbedding = embedding
      } catch (error) {
        console.error("Error generating query embedding:", error);
      }
    }
    return args;
  }

  /**
   * Process a user query and retrieve relevant context
   * @param {Object} options - Processing options
   * @param {string} options.query - User query text
   * @param {string} options.channelId - Channel ID
   * @param {Object} options.supabase - Supabase client
   * @returns {Promise<Object>} - Search results with context
   */
  async processQuery({ query, channelId, supabase }) {
    try {
      // First check if this is a simple conversational query
      if (this._isConversationalQuery(query)) {
        return this._handleConversationalQuery(query);
      }
      const startTime = Date.now();
      const plan = await this._generateExecutionPlan(query);
      console.log(`[PERF] Execution Plan Generated in ${Date.now() - startTime}ms`);
      let args = { 
        ...plan.execution_plan.primary_function.arguments,
        channelId,
        supabase,
        broadenedQuery: plan.query_analysis.broadened_query,
        tsQuery: plan.query_analysis.postgreSQL_ts_query
      };

      args = await this._processTimestamps(args);

      if (plan.execution_plan.primary_function.name === 'hybridSearch') {
        args = await this._prepareHybridSearchArgs(args);
      }

      const functionStartTime = Date.now();

      const result = await this._executeFunction({
        functionName: plan.execution_plan.primary_function.name,
        args
      });

      console.log(`[PERF] Function ${plan.execution_plan.primary_function.name} executed in ${Date.now() - functionStartTime}ms`);

      if (result.error || (result.data && result.data.length === 0)) {
        if (plan.execution_plan.fallback_functions?.length > 0) {
          const fallbackFunction = plan.execution_plan.fallback_functions[0];
          let fallbackArgs = {
            ...fallbackFunction.arguments,
            channelId,
            supabase,
            broadenedQuery: plan.query_analysis.broadened_query,
            tsQuery: plan.query_analysis.postgreSQL_ts_query
          };

          fallbackArgs = await this._processTimestamps(fallbackArgs);
          
          if (fallbackFunction.name === 'hybridSearch') {
            fallbackArgs = await this._prepareHybridSearchArgs(fallbackArgs);
          }

          return this._executeFunction({
            functionName: fallbackFunction.name,
            args: fallbackArgs
          });
        }
      }

      return result;
    } catch (error) {
      return {
        data: [],
        error: `Failed to process query: ${error.message}`,
        suggestions: "Please try rephrasing your query."
      };
    }
  }

  /**
   * Generate an execution plan for the query using AI
   * @private
   */
  async _generateExecutionPlan(query) {
    try {
      const prompt = planningPrompt(query);
      const result = await this.planningModel.generateContent(prompt);
      const responseText = result.response.text();

      const jsonMatch =
        responseText.match(/```json\n([\s\S]*?)\n```/) ||
        responseText.match(/{[\s\S]*}/);

      const jsonString = jsonMatch
        ? jsonMatch[1] || jsonMatch[0]
        : responseText;
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error generating execution plan switching to default fallback plan:", error);
      // Default fallback plan if generation fails
      return {
        query_analysis: {
          original_query: query,
          corrected_query: query,
          broadened_query: query,
          postgreSQL_ts_query: query.split(" ").join(" & "),
        },
        execution_plan: {
          primary_function: {
            name: "hybridSearch",
            arguments: {
              startTs: null,
              endTs: null,
            },
            confidence: 0.5,
          },
        },
      };
    }
  }

  /**
   * Execute a search function with the given arguments
   * @private
   */
  async _executeFunction({ functionName, args }) {
    const functionMap = {
      analyzeDocuments,
      summarizeConversation,
      hybridSearch,
    };

    if (!functionMap[functionName]) {
      throw new Error(`Unknown function: ${functionName}`);
    }

    return functionMap[functionName](args);
  }
}

module.exports = QueryProcessor;