const redis = require("../config/redis");

module.exports = async ({command, next, context }) => {
  console.log("Bot in channel middleware triggered");
  
  // Skip check for direct messages
  if (command.channel_name === "directmessage") {
    await next();
    return;
  }

  const teamId = command.team_id;

  // Check if bot is in the channel using Redis
  const isBotInChannel = await redis.sismember(
    `slack:bot:channels:${teamId}`,
    command.channel_id
  );

  if (isBotInChannel) {
    // Allow command handler to proceed
    await next();
  } else {
    // Don't call next(), but add a flag to the context
    context.botNotInChannel = true;
    await next()
  }
};