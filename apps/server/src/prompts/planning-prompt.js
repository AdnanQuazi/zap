/**
 * Enhanced function registry with additional metadata
 */
const ENHANCED_FUNCTION_REGISTRY = {
  summarizeConversation: {
    description: "Summarizes messages in a channel over a specified time range",
    parameters: {
      startTs: "string|null - ISO timestamp",
      endTs: "string|null - ISO timestamp",
      channelId: "string - Slack channel ID",
      includeDocs: "boolean - Whether to include document references",
    },
    constraints: "Time range should be within the last 15 days",
    examples: [
      "Summarize recent discussions in this channel",
      "What was discussed yesterday?",
      "Give me a summary of conversations from last week",
    ],
    fallbacks: ["hybridSearch"],
  },
  analyzeDocuments: {
    description: "Analyzes specific documents in a channel",
    parameters: {
      fileNames: "Array<string> - Names of files to analyze",
      channelId: "string - Slack channel ID",
      startTs: "string|null - ISO timestamp",
      endTs: "string|null - ISO timestamp",
    },
    constraints: "Limited to 2 files at once",
    examples: [
      "What's in the product-roadmap.pdf file?",
      "Analyze the meeting-notes.docx file",
      "What does the marketing-strategy.pptx contain?",
    ],
    fallbacks: ["hybridSearch"],
  },
  hybridSearch: {
    description:
      "Performs semantic and keyword search across messages and documents",
    parameters: {
      broadenedQuery: "string - Expanded search query",
      channelId: "string - Slack channel ID",
      tsQuery: "string - PostgreSQL text search query",
      startTs: "string|null - ISO timestamp",
      endTs: "string|null - ISO timestamp",
      windowSize: "number - Size of message window",
    },
    examples: [
      "Find information about the budget approval process",
      "When did we discuss the new product launch?",
      "Who mentioned issues with the authentication system?",
    ],
    fallbacks: ["summarizeConversation"],
  },
};

const getCurrentDate = () => {
  const now = new Date();
  const isoDate = now.toISOString();
  console.log(`[AI] Current date in ISO format: ${isoDate}`);
  return isoDate;
};

/**
 * Generate a planning prompt that evaluates the best function(s) to use
 * @param {string} query - User query
 * @returns {string} - Planning prompt
 */
function generatePlanningPrompt(query) {
  const functionDescriptions = Object.entries(ENHANCED_FUNCTION_REGISTRY)
    .map(([name, func]) => {
      const params = Object.entries(func.parameters)
        .map(([param, type]) => `${param}: ${type}`)
        .join("\n      ");

      const examples = func.examples.map((ex) => `      - "${ex}"`).join("\n");

      return `
    ${name}:
      Description: ${func.description}
      Parameters:
      ${params}
      Constraints: ${func.constraints || "None"}
      Example queries:
${examples}`;
    })
    .join("\n");

  return `
  You are an intelligent function planner for a Slack AI assistant.

  Input Query: "${query}"
  
  Available functions:
${functionDescriptions}
  
  Your tasks:
  1. Analyze the intent behind the query
  2. Determine if query needs to be corrected or broadened for better results
  3. Select the most appropriate function to handle this query
  4. If query is complex, consider breaking it into multiple function calls
  5. For each function, determine the required arguments and values
  6. If time range is mentioned, parse it relative to the current date , which is ${getCurrentDate()}.
  7. Use null in startTs and endTs if time range is not required  
  8. Convert the broader query into a PostgreSQL tsquery format for search - 

  POSTGRESQL TSQUERY FORMATTING RULES:
  • Basic Words: Use as-is (no quotes)
    Example: error → error
  
  • Multiple Words: Use & between terms (no spaces around operators)
    Example: network issue → network & issue
  
  • Alternatives: Use | between options (no spaces around operators)
    Example: quick speed → quick|speed
  
  • Negation: Use ! and group negated terms in parentheses
    Example: transactions not balance inquiry → transactions & !(balance & inquiry)
  
  • Complex Grouping: Always use () for complex expressions
    Example: (error|failure) & (system|network) & !maintenance
    Example: payment & (visa|mastercard) & !(balance & inquiry)
  
  IMPORTANT SYNTAX RULES:
  - Never use quotes or escape characters (\)
  - No spaces around operators (&, |, !)
  - Group complex expressions in parentheses ()
  - For negation, use !(term) or !(term1 & term2)
  
  NOTE: Prefer | (OR) over & (AND) for better recall

  For each function call, include:
  - Function name
  - Required arguments with appropriate values
  - Confidence score (0-1) indicating how well this function matches the intent
  
  Return a JSON object with the following structure:
  {
    "query_analysis": {
      "original_query": "The original query string",
      "corrected_query": "The corrected query string",
      "broadened_query": "The broadened query string for vector search",
      "postgreSQL_ts_query": "The PostgreSQL ts_query string for keyword search",
      "detected_intents": ["list", "of", "detected", "intents"]
    },
    "execution_plan": {
      "primary_function": {
        "name": "functionName",
        "arguments": {
          "arg1": "value1",
          "arg2": "value2"
        },
        "confidence": 0.95
      },
      "fallback_functions": [
        {
          "name": "fallbackFunction",
          "arguments": {
            "arg1": "value1"
          },
          "confidence": 0.75
        }
      ]
    }
  }
  `;
}

module.exports = generatePlanningPrompt;
