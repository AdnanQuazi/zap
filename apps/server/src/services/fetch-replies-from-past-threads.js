/**
 * Extract new replies from previously tracked threads
 * @param {Object} options - Options object
 * @param {Object} options.client - Slack API client
 * @param {string} options.channelId - Slack channel ID
 * @param {Object} options.threadHistory - Thread history tracking object
 * @param {Object} [options.threadHistory.threadTSData={}] - Map of thread timestamps to last reply timestamps
 * @returns {Promise<Object>} - Updated thread data and new replies
 */
async function extractRepliesFromPastThreads({ client, channelId, threadHistory }) {
    const threadTSData = threadHistory?.threadTSData || {};
    console.log(`Checking ${Object.keys(threadTSData).length} active threads...`);

    // Early return if no threads to check
    if (Object.keys(threadTSData).length === 0) {
        return { updatedThreadTSData: {}, newReplies: [] };
    }

    let newReplies = [];
    let updatedThreadTSData = { ...threadTSData };
    
    // Process threads in parallel
    const threadPromises = Object.entries(threadTSData).map(async ([threadTs, lastReplyTs]) => {
        let threadReplies = [];
        let cursor;
        let isInactive = false;

        try {
            do {
                const params = {
                    channel: channelId,
                    ts: threadTs,
                    oldest: lastReplyTs,
                    cursor: cursor,
                };

                const response = await client.conversations.replies(params);

                if (response.ok) {
                    const threadNewReplies = response.messages.filter(
                        message => message.ts > lastReplyTs && message.subtype !== "thread_broadcast"
                    );
                    
                    threadReplies = [...threadReplies, ...threadNewReplies];
                    cursor = response.response_metadata?.next_cursor || null;

                    // Get the main thread message
                    const mainThreadMessage = response.messages[0];

                    // Check if the thread is inactive
                    const hasNewReplies = threadNewReplies.length > 0;
                    const replyCountUnchanged = mainThreadMessage.reply_count === threadTSData[threadTs]?.replyCount;

                    if (!hasNewReplies && replyCountUnchanged) {
                        isInactive = true;
                    }
                } else {
                    console.error(`Error retrieving replies for thread ${threadTs}: ${response.error}`);
                    break;
                }
            } while (cursor);

            return {
                threadTs,
                replies: threadReplies,
                isInactive
            };
        } catch (error) {
            console.error(`Exception processing thread ${threadTs}:`, error);
            return { threadTs, replies: [], isInactive: false };
        }
    });

    const threadResults = await Promise.all(threadPromises);
    
    // Process thread results
    for (const { threadTs, replies, isInactive } of threadResults) {
        // Remove inactive threads from sync state
        if (isInactive) {
            console.log(`Thread ${threadTs} is inactive. Removing from sync.`);
            delete updatedThreadTSData[threadTs];
        } else if (replies.length > 0) {
            // Update with latest reply timestamp
            updatedThreadTSData[threadTs] = replies[replies.length - 1].ts;
            newReplies = [...newReplies, ...replies];
        }
    }

    console.log(`Fetched ${newReplies.length} new replies from existing threads.`);
    return { updatedThreadTSData, newReplies };
}

module.exports = extractRepliesFromPastThreads;