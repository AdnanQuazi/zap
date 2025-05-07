/**
 * ResponseGenerator Class
 * Handles AI response generation with context
 */
const responseGenerationPrompt = require("../../../prompts/response-generation-prompt");

class ResponseGenerator {
  /**
   * Create a new ResponseGenerator instance
   * @param {Object} model - AI model instance
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Generate a response from AI model
   * @param {Object} options - Function parameters 
   * @param {string} options.query - User's query text
   * @param {Object} options.context - Context information from channel
   * @param {string} options.subdomain - Slack workspace subdomain
   * @param {string} options.channelId - Channel ID where query was made
   * @returns {Promise<string>} - Generated response text
   */
  async generateResponse({ query, context, subdomain, channelId }) {
    try {
      // Step 1: Generate prompt with context
      const prompt = this._buildPrompt({
        query,
        context,
        subdomain,
        channelId
      });
      
      // Step 2: Generate response from AI model
      const result = await this._generateContent(prompt);
      return result;
    } catch (error) {
      console.error("[AI] ❌ Error generating response:", error);
      throw new Error("Failed to generate a response from AI.");
    }
  }

  /**
   * Build the prompt for AI response generation
   * @private
   */
  _buildPrompt({ query, context, subdomain, channelId }) {
    return responseGenerationPrompt({
      query,
      context,
      subdomain,
      channelId
    });
  }

  /**
   * Generate content using the AI model
   * @private
   */
  async _generateContent(prompt) {
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}

module.exports = ResponseGenerator;