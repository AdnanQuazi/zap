
async function batchStoreMessages({supabase, messages, batchSize = 500}) {
    console.log(messages)
    try {
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize).map(({ blocks, ...msg }) => msg);

            const { error } = await supabase
                .from("slack_messages")
                .insert(batch, { ignoreDuplicates: true });

            if (error) {
                console.error("Batch insert error:", error);
            }
        }
    } catch (err) {
        console.error("Error in batchStoreMessages:", err);
    }
}

module.exports = { batchStoreMessages };
