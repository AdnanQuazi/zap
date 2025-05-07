module.exports = async ({ event, say, context, logger }) => {
    const botToken = context.botToken;
    if (!botToken) return logger.error(`No bot token for ${event.team}`);
  
    try {
      await say(`Hey <@${event.user}>, how can I help you today?`);
    } catch (err) {
      logger.error("Mention handler error:", err);
    }
  };