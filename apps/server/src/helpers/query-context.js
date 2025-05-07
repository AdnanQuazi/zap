//Only used to append user query and context note to the blocks

function appendQueryContext({ blocks, query, contextNote, quotaInfo }) {
  // Copy existing blocks and add a divider for visual separation
  const updated = [...blocks, { type: "divider" }];

  // Build the footer elements array for the context block
  const footerElements = [
    {
      type: "mrkdwn",
      text: `*You Asked:* ${query}`
    }
  ];

  // Add a note if provided
  if (contextNote) {
    footerElements.push({
      type: "mrkdwn",
      text: `*Note:* ${contextNote}`
    });
  }

  // Append quota information when applicable
  if (quotaInfo && quotaInfo.currentCount > 25) {
    footerElements.push({
      type: "mrkdwn",
      text: `_Your team has used ${quotaInfo.currentCount} of ${quotaInfo.maxRequests} daily AI requests. Quota resets ${quotaInfo.isToday ? 'today' : 'tomorrow'} at ${quotaInfo.resetTime} your time._`
    });
  }

  // Add the context block with all footer elements to the updated blocks
  updated.push({
    type: "context",
    elements: footerElements
  });

  return updated;
}

module.exports = appendQueryContext;
