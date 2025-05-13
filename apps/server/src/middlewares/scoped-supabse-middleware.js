const supabaseClient = require("../config/supabase");

module.exports = async ({ context, body, next }) => {
  
  const team_id = body.team?.id || body.team_id || context.teamId || null;
  const channel_id = (body.event && body.event.channel) || body.channel_id || null;
  const user_id = body.user_id || context.userId || null;
  if (team_id) {
    context.supabase = supabaseClient({ team_id, channel_id , user_id });
  }

  // ALWAYS await next(), even if team_id is missing
  await next();
};
