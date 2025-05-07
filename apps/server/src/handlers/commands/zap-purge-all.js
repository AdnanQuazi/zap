const { purgeChannelData } = require("../../helpers/db-helpers");
const isUserAdmin = require("../../helpers/slack-helpers");

module.exports = async ({ command, ack, respond, context, client, say }) => {
  await ack();
  if (context.botNotInChannel) {
    await respond({
      text: "Hello! 👋 I'm not currently in this channel. Would you mind sending me an invite? 😊",
    });
    return;
  }
  const { team_id, channel_id, user_id } = command;
  try {
    if ((await isUserAdmin({ client, userId: user_id })) === true) {
      const supabase = context.supabase;
      const response = await purgeChannelData({
        supabase,
        team_id,
        channel_id,
      });
      if (response) {
        return say(
          "🗑️ All messages and documents in this channel have been permanently purged."
        );
      } else {
        return respond({
          text: "⚠️ Something went wrong while purging data. Please try again later.",
        });
      }
    } else {
      return respond({
        text: "⚠️ You are not authorized to perform this action.",
      });
    }
  } catch (error) {
    console.error("Error purging channel data zap-purge-all:", error);
    return respond({
      text: "⚠️ Something went wrong while purging data. Please try again later.",
    });
  }
};
