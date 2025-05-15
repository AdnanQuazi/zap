const redis = require("../config/redis");

module.exports = async ({ command, next, context, client, event }) => {
  console.log("Bot-in-channel middleware triggered");

  // Allow DM commands through immediately
  if (command.channel_name === "directmessage") {
    context.botNotInChannel = false;
    return next();
  }

  const teamKey = `slack:bot:channels:${command.team_id}`;
  const channelId = event.channel;

  // 1️⃣ Check our Redis cache first
  const cached = await redis.sismember(teamKey, channelId);
  if (cached) {
    context.botNotInChannel = false;
    return next();
  }

  // 2️⃣ Fallback to Slack API
  try {
    const { channel } = await client.conversations.info({
      channel: channelId, // fixed typo (was “cahnnel” & using event.channel)
    });

    if (channel.is_member) {
      // cache it so we don’t hit the API next time
      await redis.sadd(teamKey, channelId);
      context.botNotInChannel = false;
    } else {
      context.botNotInChannel = true;
    }
  } catch (err) {
    // e.g. missing scope or not_in_channel
    console.error("conversations.info error:", err.data?.error || err.message);
    context.botNotInChannel = true;
  }

  return next();
};
