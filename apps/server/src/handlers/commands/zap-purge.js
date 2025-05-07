const { purgeUserData } = require("../../helpers/db-helpers");

module.exports = async ({ command, ack, respond, context }) => {
  await ack();
  if (context.botNotInChannel) {
    await respond({
      text: "Hello! 👋 I'm not currently in this channel. Would you mind sending me an invite? 😊",
    });
    return;
  }
  const { team_id, channel_id, user_id } = command;
  const supabase = context.supabase;

  try {
    const response = await purgeUserData({
      supabase,
      team_id,
      channel_id,
      user_id,
    });
    if (response) {
      return respond({
        text: "🗑️ All your data has been purged successfully.",
      });
    } else {
      return respond({
        text: "⚠️ Something went wrong while purging data. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Error purging data:", error);
    return respond({
      text: "⚠️ Something went wrong while purging data. Please try again later.",
    });
  }
};
