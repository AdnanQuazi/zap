/**
 * Slack App Configuration and Initialization
 *
 * This module sets up a Slack app with multi-workspace support,
 * handling installation, authentication, and authorization.
 */

// Load environment variables from .env file
require("dotenv").config();

// Import required Slack SDK components
const { App, ExpressReceiver } = require("@slack/bolt");

// Import installation-related services
const {
  fetchInstallation,
  storeInstallation,
  deleteInstallation,
  getCurrentBotVersion,
} = require("../services/installation-services");
const { SLACK_SCOPES } = require("../constants/config");

/**
 * Create an ExpressReceiver to integrate Bolt with Express
 * This allows us to use Express middleware and routes alongside Slack functionality
 */
const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: "/slack/events", // The endpoint where Slack events will be received
});

/**
 * Initialize Bolt App for multi-workspace installation
 * This configuration supports OAuth installation flow and per-workspace tokens
 */
const slackApplication = new App({
  // Authentication configuration
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: SLACK_SCOPES,
  installationStore: {
    storeInstallation, // Function to store new installations
    fetchInstallation, // Function to retrieve installation data
    deleteInstallation, // Function to remove installation data
  },
  retryConfig: {
    retries: 3, // Maximum number of retries
    factor: 1.5, // Exponential factor (optional, you can keep the default if preferred)
    randomize: true, // Whether to randomize delay (optional)
  },

  /**
   * Authorization callback for retrieving tokens
   * Required for multi-workspace apps to determine which token to use
   *
   * @param {Object} authContext - Authorization context
   * @param {string} authContext.teamId - Slack workspace/team ID
   * @param {string} authContext.enterpriseId - Slack enterprise grid ID (if applicable)
   * @returns {Promise<Object>} - Authorization object containing the bot token
   */
  authorize: async ({ teamId, enterpriseId }) => {
    console.log("Authorization callback initiated with:", {
      teamId,
      enterpriseId,
    });

    let installationData;

    // For enterprise installations, fetch by enterprise ID
    if (enterpriseId !== undefined) {
      installationData = await fetchInstallation({
        isEnterpriseInstall: true,
        enterpriseId,
      });
    }
    // For workspace installations, fetch by team ID
    else if (teamId !== undefined) {
      installationData = await fetchInstallation({ teamId });
    }

    console.log("Retrieved installation data for bot version:", installationData?.bot_version || 'unknown');

    // Validate that we have valid installation data with an access token
    if (!installationData || !installationData.access_token) {
      throw new Error("Failed to retrieve valid installation data");
    }

    // Check if the bot version in the database matches the current version
    const currentVersion = getCurrentBotVersion();
    if (installationData.bot_version !== currentVersion) {
      console.log(`Bot version mismatch. Installed: ${installationData.bot_version}, Current: ${currentVersion}`);
      // You could implement automatic version update logic here if needed
    }

    // Return the bot token for this workspace/enterprise
    return {
      botToken: installationData.access_token,
      botUserId: installationData.bot_user_id,
      botVersion: installationData.bot_version,
    };
  },

  // OAuth installer configuration
  installerOptions: {
    // directInstall: true, // Uncomment to skip the "Add to Slack" page
  },

  // Use the Express receiver created above
  receiver: expressReceiver,
});

// Add a middleware to log bot version with each request
// slackApplication.use(async ({ next }) => {
//   console.log(`Bot Version: ${getCurrentBotVersion()}`);
//   await next();
// });

// Apply globally but it will only affect commands



// Get the Express application instance from the receiver
const expressApplication = expressReceiver.app;

// Export the configured Slack app and Express app
module.exports = {
  slackApp: slackApplication,
  expressApp: expressApplication,
};