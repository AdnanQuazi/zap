const structureMessages = require("../helpers/structure-messages");

/**
 * Search for messages using hybrid search (vector + keyword)
 * @param {Object} options - Search options
 * @param {string} options.query - The search query text 
 * @param {Array} options.embedding - Vector embedding of the query
 * @param {string} options.channelId - Channel ID to search in
 * @param {number|null} options.startTs - Start timestamp (null for no limit)
 * @param {number|null} options.endTs - End timestamp (null for no limit)
 * @param {string} options.tsQuery - PostgreSQL text search query
 * @param {number} options.matchCount - Total number of matches to return
 * @param {number} options.matchThreshold - Minimum similarity threshold
 * @param {number} options.rrfK - Reciprocal Rank Fusion k value
 * @param {number} options.vectorWeight - Weight for vector-based matches
 * @param {number} options.keywordWeight - Weight for keyword-based matches
 * @param {Object} options.supabase - Supabase client instance
 * @returns {Promise<Array>} - Matching messages
 */
async function searchMessages({
  query,
  embedding,
  channelId,
  startTs = null,
  endTs = null,
  tsQuery,
  matchCount = 8,
  matchThreshold = 0.3,
  rrfK = 60,
  vectorWeight = 1.0,
  keywordWeight = 1.0,
  supabase
}) {
  try {
    const { data, error } = await supabase.rpc("search_in_slack_messages", {
      search_query_string: tsQuery,
      search_embedding: embedding,
      channel_id: channelId.trim(),
      start_ts: startTs,
      end_ts: endTs,
      match_count: matchCount,
      match_threshold: matchThreshold,  
      rrf_k: rrfK,
      vector_weight: vectorWeight,
      keyword_weight: keywordWeight
    });
    
    if (error) {
      console.error("Error calling search_in_slack_messages:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in searchMessages:", error);
    return [];
  }
}

/**
 * Search within document chunks using hybrid search
 * @param {Object} options - Search options 
 * @param {string} options.query - The search query text
 * @param {Array} options.embedding - Vector embedding of the query
 * @param {string} options.channelId - Channel ID to search in
 * @param {number|null} options.startTs - Start timestamp (null for no limit)
 * @param {number|null} options.endTs - End timestamp (null for no limit)
 * @param {string} options.tsQuery - PostgreSQL text search query
 * @param {number} options.matchCount - Total matches to return
 * @param {number} options.matchThreshold - Minimum similarity threshold
 * @param {number} options.rrfK - Reciprocal Rank Fusion k value
 * @param {number} options.vectorWeight - Weight for vector-based matches
 * @param {number} options.keywordWeight - Weight for keyword-based matches
 * @param {Object} options.supabase - Supabase client instance
 * @returns {Promise<Array>} - Matching document chunks
 */
async function searchDocuments({
  query,
  embedding,
  channelId,
  startTs = null,
  endTs = null,
  tsQuery,
  matchCount = 5,
  matchThreshold = 0.3,
  rrfK = 60,
  vectorWeight = 1.0,
  keywordWeight = 1.0,
  supabase
}) {
  try {
    const { data, error } = await supabase.rpc("search_in_document_chunks", {
      search_query_string: tsQuery,
      search_embedding: embedding,
      channel_id: channelId.trim(),
      start_ts: startTs,
      end_ts: endTs,
      match_count: matchCount,
      match_threshold: matchThreshold,  
      rrf_k: rrfK,
      vector_weight: vectorWeight,
      keyword_weight: keywordWeight
    });

    if (error) {
      console.error("Error calling search_in_document_chunks:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in searchDocuments:", error);
    return [];
  }
}

/**
 * Batch fetch contextual messages for multiple timestamps using SQL directly
 * @param {Object} options - Fetch options
 * @param {Array} options.timestamps - Array of target timestamps
 * @param {string} options.channelId - Channel ID
 * @param {number} options.count - Number of messages to fetch on each side
 * @param {Object} options.supabase - Supabase client instance
 * @returns {Promise<Array>} - Contextual messages
 */
async function batchFetchContextualMessages({
  timestamps,
  channelId,
  count = 5,
  supabase
}) {
  try {
    // Use a SQL function instead of the query builder for complex conditions
    const { data, error } = await supabase.rpc('get_surrounding_messages', {
      p_channel_id: channelId,
      p_timestamps: timestamps,
      p_count: count
    });
    
    if (error) {
      console.error("Error in batch contextual fetch:", error);
      // Fallback to individual fetches if batch fails
      return fallbackIndividualFetches(timestamps, channelId, count, supabase);
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in batch contextual fetch:", error);
    
    // Fallback to individual fetches
    return fallbackIndividualFetches(timestamps, channelId, count, supabase);
  }
}

/**
 * Fallback method using individual fetches when batch fails
 * @param {Array} timestamps - Array of timestamps
 * @param {string} channelId - Channel ID
 * @param {number} count - Number of surrounding messages
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Array>} - Combined contextual messages
 */
async function fallbackIndividualFetches(timestamps, channelId, count, supabase) {
  // Only fetch for the first 5 timestamps to optimize performance
  const limitedTimestamps = timestamps.slice(0, 5);
  
  try {
    // Create individual promises for each timestamp
    const fetchPromises = limitedTimestamps.map(timestamp => 
      fetchSingleContextualMessage(timestamp, channelId, count, supabase)
    );
    
    // Execute promises with a concurrency limit of 2
    const contextualMessagesGroups = [];
    
    // Process promises in batches of 2 to avoid overwhelming the database
    for (let i = 0; i < fetchPromises.length; i += 2) {
      const batchPromises = fetchPromises.slice(i, i + 2);
      const batchResults = await Promise.all(batchPromises);
      contextualMessagesGroups.push(...batchResults);
    }
    
    // Flatten the results
    const results = contextualMessagesGroups.flat();
    
    return results;
  } catch (error) {
    console.error("Error in individual fetches fallback:", error);
    return [];
  }
}

/**
 * Fetch contextual messages for a single timestamp
 * @param {string} timestamp - Target timestamp
 * @param {string} channelId - Channel ID
 * @param {number} count - Number of messages on each side
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Array>} - Surrounding messages
 */
async function fetchSingleContextualMessage(timestamp, channelId, count, supabase) {
  const ts = String(timestamp);
  
  try {
    // Get messages before the target timestamp
    const beforePromise = supabase
      .from("slack_messages")
      .select("ts, text, thread_ts")
      .eq("channel_id", channelId)
      .lt("ts", ts)
      .order("ts", { ascending: false })
      .limit(count);
      
    // Get messages after the target timestamp  
    const afterPromise = supabase
      .from("slack_messages")
      .select("ts, text, thread_ts")
      .eq("channel_id", channelId)
      .gt("ts", ts)
      .order("ts", { ascending: true })
      .limit(count);
    
    // Execute both queries in parallel
    const [beforeMessages, afterMessages] = await Promise.all([beforePromise, afterPromise]);
    
    if (beforeMessages.error) throw beforeMessages.error;
    if (afterMessages.error) throw afterMessages.error;
    
    // Combine and sort chronologically
    return [...(beforeMessages.data || []).reverse(), ...(afterMessages.data || [])];
  } catch (error) {
    console.error(`Error fetching context for timestamp ${ts}:`, error);
    return [];
  }
}

/**
 * Get thread preview for a message
 * @param {Object} options - Options
 * @param {string} options.threadTs - Thread timestamp
 * @param {string} options.channelId - Channel ID
 * @param {number} options.limit - Maximum number of thread messages to fetch
 * @param {Object} options.supabase - Supabase client instance
 * @returns {Promise<Array>} - Thread preview messages
 */
async function getThreadPreview({ 
  threadTs, 
  channelId, 
  limit = 3, 
  supabase 
}) {
  if (!threadTs) return [];
  
  try {
    // Get thread starter message + first few replies
    const { data, error } = await supabase
      .from("slack_messages")
      .select("ts, text, thread_ts")
      .eq("channel_id", channelId)
      .eq("thread_ts", threadTs)
      .order("ts", { ascending: true })
      .limit(limit);
      
    if (error) {
      console.error("Error fetching thread preview:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getThreadPreview:", error);
    return [];
  }
}

/**
 * Perform hybrid search across messages and documents
 * @param {Object} options - Search options
 * @param {string} options.query - Search query text
 * @param {Array} options.queryEmbedding - Vector embedding of query
 * @param {string} options.channelId - Channel ID to search in
 * @param {number|null} options.startTs - Start timestamp
 * @param {number|null} options.endTs - End timestamp
 * @param {number} options.windowSize - Size of message window
 * @param {string} options.tsQuery - PostgreSQL text search query
 * @param {boolean} options.includeThreadPreviews - Whether to include thread previews
 * @param {number} options.threadsPreviewLimit - Max messages per thread preview
 * @param {number} options.contextualFetchLimit - Limit contextual fetching to top N messages
 * @param {Object} options.supabase - Supabase client instance
 * @returns {Promise<Object>} - Structured search results
 */
async function hybridSearch({
  query,
  queryEmbedding,
  channelId,
  startTs = null,
  endTs = null,
  windowSize = 5,
  tsQuery,
  includeThreadPreviews = true,
  threadsPreviewLimit = 3,
  contextualFetchLimit = 5,
  supabase 
}) {
  try {
    // Execute parallel searches
    const [messages, documents] = await Promise.all([
      searchMessages({
        query,
        embedding: queryEmbedding,
        channelId,
        startTs,
        endTs,
        tsQuery,
        supabase
      }),
      searchDocuments({
        query,
        embedding: queryEmbedding,
        channelId,
        startTs,
        endTs,
        tsQuery,
        supabase
      })
    ]);
    
    // Limit to top N messages for contextual fetching
    const topMessages = messages.slice(0, contextualFetchLimit);
    const timestampsToFetch = topMessages.map(msg => msg.ts);
    
    // Use fallback method directly since batch method had issues
    const contextualMessages = await batchFetchContextualMessages({
      timestamps: timestampsToFetch,
      channelId,
      count: windowSize,
      supabase
    });
    
    // Combine with original messages
    const allMessages = [...messages, ...contextualMessages];
    
    // Deduplicate messages by timestamp
    const uniqueMessages = Array.from(
      new Map(allMessages.map(item => [item.ts, item])).values()
    );
    
    // Add thread previews if needed
    let enrichedMessages = uniqueMessages;

    if (includeThreadPreviews) {
      // Find messages that are part of threads
      const threadsToFetch = uniqueMessages
        .filter(msg => msg.thread_ts && msg.thread_ts !== msg.ts)
        .map(msg => msg.thread_ts);
      
      // Deduplicate thread IDs
      const uniqueThreads = [...new Set(threadsToFetch)];
   
      if (uniqueThreads.length > 0) {
        // Fetch thread previews in parallel with a reasonable limit
        const threadLimit = Math.min(uniqueThreads.length, 5); // Limit number of threads
        
        const threadPreviews = await Promise.all(
          uniqueThreads.slice(0, threadLimit).map(threadTs => 
            getThreadPreview({
              threadTs,
              channelId,
              limit: threadsPreviewLimit,
              supabase
            })
          )
        );
        
        // Add thread previews to messages
        const threadMessages = threadPreviews.flat();
        
        // Combine with existing messages and deduplicate again
        enrichedMessages = Array.from(
          new Map([...uniqueMessages, ...threadMessages].map(item => [item.ts, item])).values()
        );
      }
    }
    
    // Combine messages with documents
    const combinedResults = [...enrichedMessages, ...documents];
    
    // Structure the final results
    const result = structureMessages(combinedResults);
    
    return result;
  } catch (error) {
    console.error("Error in hybridSearch:", error);
    return { messages: [], threads: [], documents: [] };
  }
}

module.exports = hybridSearch;