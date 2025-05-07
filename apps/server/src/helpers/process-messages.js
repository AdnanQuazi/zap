const { getEmbedding, getBatchEmbeddings } = require("../services/embedding-service");

async function processMessages({messages, channelId, teamId}) {
    // Extract all texts for batch processing
    const texts = messages.map(msg => msg.text);
    
    // Get all embeddings in a single batch request
    let allEmbeddings = [];
    try {
        allEmbeddings = await getBatchEmbeddings(texts);
    } catch (error) {
        console.error(`Batch embedding failed:`, error);
        // If batch fails, we'll fallback to individual processing in the map below
    }
    
    return Promise.all(
        messages.map(async (msg, index) => {
            const text = msg.text;
            
            let embedding = [];
            try {
                // Use the batch result if available
                if (allEmbeddings.length > index) {
                    embedding = allEmbeddings[index];
                } else {
                    // Fallback to individual processing if batch failed
                    embedding = await getEmbedding(text);
                }
                
                embedding = Array.isArray(embedding) ? embedding : Object.values(embedding);
            } catch (error) {
                console.error(`Embedding failed for message ${msg.ts}:`, error);
            }

            return {
                ts: msg.ts,
                thread_ts: msg.thread_ts || null,
                type: msg.thread_ts ? "thread" : "message",
                user_id: msg.user,
                text: text,
                channel_id: channelId,
                embedding,
                team_id: teamId
            };
        })
    );
}

module.exports = { processMessages };