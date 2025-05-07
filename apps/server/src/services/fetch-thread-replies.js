/**
 * Extract replies from threads in a batch of messages
 * @param {Object} options - Options object
 * @param {Array} options.messages - List of message objects
 * @param {Object} options.client - Slack API client
 * @param {string} options.channelId - Slack channel ID
 * @returns {Promise<Array>} - Array of thread reply messages
 */
async function extractThreadReplies({ messages, client, channelId }) {
    // Get unique thread timestamps, excluding broadcasts
    const threadTsList = [...new Set(
        messages
            .filter(message => message.thread_ts && message.subtype !== "thread_broadcast")
            .map(message => message.thread_ts)
    )];
    
    if (threadTsList.length === 0) {
        return [];
    }

    try {
        // Create parallel requests for each thread
        const threadRequests = threadTsList.map(async threadTs => {
            try {
                const response = await client.conversations.replies({ 
                    channel: channelId, 
                    ts: threadTs 
                });
                
                if (response.ok) {
                    // Remove first message (parent) to avoid duplication
                    return response.messages.slice(1);
                }
                
                console.error(`Failed to fetch thread ${threadTs}: ${response.error}`);
                return [];
            } catch (error) {
                console.error(`Exception fetching thread ${threadTs}:`, error);
                return [];
            }
        });

        // Wait for all requests to complete
        const threadResults = await Promise.all(threadRequests);
        const threadMessages = threadResults.flat();
        
        console.log(`Fetched ${threadMessages.length} thread replies across ${threadTsList.length} threads`);
        return threadMessages;
    } catch (error) {
        console.error("Exception in extractThreadReplies:", error);
        return [];
    }
}

module.exports = extractThreadReplies;