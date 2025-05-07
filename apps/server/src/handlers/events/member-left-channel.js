const redis = require("../../config/redis");

module.exports = async ({ event, context, logger}) => {
  const { team } = event;
  if (
    event.type === "member_left_channel" &&
    event.user === context.botUserId
  ) {
    logger.info(`Bot left channel ${event.channel}`);

    try {
      await redis.srem(`slack:bot:channels:${team}`, event.channel);
    } catch (err) {
      logger.error(`Member Left Channel Error: ${err}`);
    }
  }
};
