const extractThreadReplies = require("./fetch-thread-replies");

/**
 * Removes duplicate messages by using unique timestamps
 * @param {Array} messages - List of message objects
 * @returns {Array} - Deduplicated messages
 */
function removeDuplicates(messages) {
  const uniqueMessages = new Map();
  for (const message of messages) {
    uniqueMessages.set(message.ts, message); // Overwrites duplicate ts values
  }
  return Array.from(uniqueMessages.values()); // Convert back to array
}

/**
 * Extract messages from a Slack channel with pagination support
 * @param {Object} options - Options object
 * @param {string} options.channelId - Slack channel ID
 * @param {number} [options.limit=500] - Maximum messages to fetch per request
 * @param {string} [options.oldest="0"] - Fetch messages newer than this timestamp
 * @param {Object} options.client - Slack API client
 * @returns {Promise<Object>} - Object containing all messages and thread info
 */
async function extractMessages({ channelId, limit = 500, oldest = "0", client }) {
  let allMessages = [];
  let cursor;

  try {
    do {
      const params = { 
        channel: channelId, 
        limit 
      };
      
      if (cursor) params.cursor = cursor;
      if (oldest && oldest !== "0") params.oldest = oldest;

      const response = await client.conversations.history(params);
      
      if (response.ok) {
        allMessages = allMessages.concat(response.messages);
        cursor = response.response_metadata?.next_cursor || null;
      } else {
        console.error(`Error retrieving channel history: ${response.error}`);
        break;
      }
    } while (cursor);

    console.log(`Fetched ${allMessages.length} messages for channel ${channelId}`);

    // Early return if no new messages found
    if (allMessages.length === 0) {
      console.log("No new messages found. Skipping further processing.");
      return { messages: [], threads: {} };
    }

    // Fetch thread replies for messages that have thread_ts
    const threadMessages = await extractThreadReplies({
      messages: allMessages,
      client,
      channelId
    });

    // Combine main messages and thread messages
    const dedupedMessages = removeDuplicates([...allMessages, ...threadMessages]);
 
    // Create a map of threads with their timestamps
    const threads = Object.fromEntries(
      dedupedMessages
        .filter(message => message.thread_ts)
        .map(message => [message.thread_ts, message.ts])
    );

    return { 
      messages: dedupedMessages, 
      threads 
    };
  } catch (error) {
    console.error("Exception while extracting channel history:", error);
    throw error;
  }
}

module.exports = extractMessages;