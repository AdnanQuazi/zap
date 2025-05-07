function structureMessages(messages) {
  const threads = {};
  const mainMessages = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const ts = msg.ts;
    const thread_ts = msg.thread_ts;
    const source = msg.source || "slack_messages";
    
    // Create a clean message with only the fields we need based on source type
    let cleanedMsg;
    
    if (source === "document_chunks") {
      cleanedMsg = {
        source,
        ts,
        text: msg.text,
        thread_ts: msg.thread_ts || null,
        permalink: msg.permalink || null,
        name: msg.name || null,
        chunk_index: msg.chunk_index
      };
    } else {
      // Default to slack_messages
      cleanedMsg = {
        source,
        ts,
        text: msg.text,
        thread_ts: msg.thread_ts || null
      };
    }
    
    // If it's a reply
    if (thread_ts && thread_ts !== ts) {
      if (!threads[thread_ts]) {
        threads[thread_ts] = [];
      }
      threads[thread_ts].push(cleanedMsg);
    } else {
      // It's a main message
      mainMessages.push(cleanedMsg);
    }
  }

  // Sort main messages
  mainMessages.sort((a, b) => a.ts - b.ts);

  // Attach replies to parents
  for (let i = 0; i < mainMessages.length; i++) {
    const msg = mainMessages[i];
    const replies = threads[msg.ts];
    
    if (replies) {
      replies.sort((a, b) => a.ts - b.ts);
      msg.replies = replies;
    }
  }
  return mainMessages;
}

module.exports = structureMessages;