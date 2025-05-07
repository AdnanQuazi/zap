const redis = require("../../config/redis");
const { WELCOME_MESSAGE } = require("../../constants/config");

module.exports = async ({ event, context, logger, client }) => {
  const { team } = event;
  if (
    event.type === "member_joined_channel" &&
    event.user === context.botUserId
  ) {
    logger.info(`Bot joined channel ${event.channel}`);

    try {
      await client.chat.postMessage({
        channel: event.channel,
        ...WELCOME_MESSAGE,
      });
      await redis.sadd(`slack:bot:channels:${team}`, event.channel);
    } catch (err) {
      logger.error(`Welcome message error: ${err}`);
    }
  }
};
