const redis = require("../../config/redis");
const { createClient } = require("@supabase/supabase-js");
module.exports = async ({command, ack, respond}) => {
  await ack();
  const { channel_id, team_id, user_id, text: feedback } = command;

  if (!feedback.trim()) {
    return respond({
      text: "⚠️ Please include your feedback after the command.",
    });
  }
  const key = `feedback:${team_id}:${user_id}`;
  try {
    // Set key with NX (only if not exists) and EX = 21,600 seconds (6 hours)
    const set = await redis.set(key, "1", "NX", "EX", 21600);
    if (set === null) {
      return respond({
        text: "⏳ You've already sent feedback in the last 6 hours. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Redis error:", error);
    return respond({
      text: "⚠️ Something went wrong. Please try again later.",
    });
  }
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { error: insertError } = await supabase
    .from("feedback")
    .insert([{ user_id, team_id, channel_id, feedback }]);

  if (insertError) {
    console.error("Supabase insert error:", insertError);
    return respond({
      text: "⚠️ Something went wrong. Please try again later.",
    });
  }

  return respond({
    text: "✅ Thanks for your feedback! We really appreciate it.",
  });
};
