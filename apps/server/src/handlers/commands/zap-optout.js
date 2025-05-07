const { OPT_OUT_MESSAGE } = require("../../constants/config");
const { optOutUser, purgeUserData } = require("../../helpers/db-helpers");

module.exports = async ({ command, ack, respond, context }) => {
  await ack();
  if (context.botNotInChannel) {
    await respond({
      text: "Hello! 👋 I'm not currently in this channel. Would you mind sending me an invite? 😊",
    });
    return;
  }
  const { team_id, user_id, channel_id } = command;
  const supabase = context.supabase;
  try {
    const response = await optOutUser({ supabase, team_id, user_id });
    if (response) {
      await purgeUserData({ supabase, team_id, user_id, channel_id });
      return respond(OPT_OUT_MESSAGE);
    } else {
      return respond({
        text: "⚠️ You are already opted out.",
      });
    }
  } catch (error) {
    console.error("Error opting in user:", error);
    return respond({
      text: "⚠️ Something went wrong while opting in. Please try again later.",
    });
  }
};
