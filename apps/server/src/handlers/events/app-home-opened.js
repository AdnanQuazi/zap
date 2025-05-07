const { isSmartContextEnabled } = require("../../helpers/db-helpers");
const buildHome = require("../../UI/home");


module.exports = async ({ event, client , context }) => {
    const {supabase,teamId} = context;
    try {
      const enabled = await isSmartContextEnabled({supabase , teamId});
      await client.views.publish({ user_id: event.user, view: buildHome(enabled) });
    } catch (err) {
      console.error("Home tab publish error:", err);
    }
  };