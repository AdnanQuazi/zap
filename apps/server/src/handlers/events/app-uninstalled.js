const { deleteInstallation } = require("../../services/installation-services");
module.exports = async ({say, context, logger }) => {
    const teamId = context.teamId;
    if (!teamId) return logger.error("No team id found in event data.");        
    try {
        await deleteInstallation({ teamId });
    } catch (error) {
        console.error("Error deleting installation:", error);
        await say(`❌ Something went wrong while uninstalling the app. Please contact support.`);
    }
  };