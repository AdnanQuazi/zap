// Updated embedding-service.js
const axios = require('axios');

// Configure the embedding service URL and API key
const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL;
const API_KEY = process.env.EMBEDDING_API_KEY;

if (!API_KEY && process.env.NODE_ENV === 'production') {
  console.warn('Warning: EMBEDDING_API_KEY is not set. Authentication will fail.');
}

/**
 * Get embedding for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<Array>} - Embedding array
 */
async function getEmbedding(text) {
  try {
    const response = await axios.post(
      `${EMBEDDING_SERVICE_URL}/embed`, 
      { text }, 
      {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      }
    );
    return response.data.embedding;
  } catch (error) {
    console.error('Embedding service error:', error.message);
    throw error;
  }
}

/**
 * Get embeddings for multiple texts (batch processing)
 * @param {Array<string>} texts - Array of texts to embed
 * @returns {Promise<Array<Array>>} - Array of embedding arrays
 */
async function getBatchEmbeddings(texts) {
  try {
    const response = await axios.post(
      `${EMBEDDING_SERVICE_URL}/embed_batch`, 
      { texts }, 
      {
        timeout: 60000, // 60 seconds timeout for batch processing
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      }
    );
    return response.data.embeddings;
  } catch (error) {
    console.error('Batch embedding service error:', error.message);
    throw error;
  }
}

module.exports = {
  getEmbedding,
  getBatchEmbeddings
};