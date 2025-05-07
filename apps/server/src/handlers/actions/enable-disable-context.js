/**
 * Smart Context Toggle Handler
 * 
 * This module handles enabling and disabling the Smart Context feature
 * for a Slack workspace, with admin permissions verification.
 */

// Import helper functions
const checkSmartContextCooldown = require("../../helpers/context-cooldown");
const { setSmartContext } = require("../../helpers/db-helpers");
const isUserAdmin = require("../../helpers/slack-helpers");
const buildHome = require("../../UI/home");

/**
 * Handles requests to toggle the Smart Context feature on or off
 * 
 * @param {Object} params - Function parameters
 * @param {Function} params.ack - Function to acknowledge the request
 * @param {Object} params.body - Request body from Slack
 * @param {Object} params.body.team - Team/workspace information
 * @param {string} params.body.team.id - ID of the Slack workspace
 * @param {Object} params.body.user - User information
 * @param {string} params.body.user.id - ID of the user making the request
 * @param {Object} params.client - Slack Web API client
 * @param {Object} params.context - Application context
 * @param {Object} params.context.supabase - Supabase client instance
 * @param {boolean} params.enableContext - Whether to enable (true) or disable (false) Smart Context
 * @returns {Promise<void>} - Resolves when the operation is complete
 */
module.exports = async function handleSmartContextToggle({ 
  ack, 
  body, 
  client, 
  context, 
  enableContext: shouldEnableContext
}) {
  // Acknowledge the request immediately
  await ack();
  
  // Extract relevant IDs
  const teamId = body.team.id;
  const userId = body.user.id;
  
  // Verify the user has admin permissions
  const hasAdminRights = await isUserAdmin({client, userId: userId});
  if (!hasAdminRights) {
    return client.views.publish({ 
      user_id: userId, 
      view: buildHome(!shouldEnableContext, { 
        error: "❌ Only workspace admins can change Smart Context." 
      }) 
    });
  }
  
  // Check if the workspace is allowed to toggle Smart Context (cooldown period)
  const supabaseClient = context.supabase;
  const cooldownStatus = await checkSmartContextCooldown(supabaseClient);
  
  if (!cooldownStatus.allowed) {
    return client.views.publish({ 
      user_id: userId, 
      view: buildHome(!shouldEnableContext, { 
        error: cooldownStatus.reason 
      }) 
    });
  }
  
  try {
    // Update the Smart Context setting in the database
    await setSmartContext({ 
      teamId: teamId, 
      enabled: shouldEnableContext, 
      supabase: supabaseClient 
    });
    
    // Update the UI to reflect the new state
    await client.views.publish({ 
      user_id: userId, 
      view: buildHome(shouldEnableContext) 
    });
  } catch (error) {
    // Log errors and show a friendly message to the user
    console.error(`Smart Context toggle error (${shouldEnableContext ? 'enable' : 'disable'}):`, error);
    
    await client.views.publish({ 
      user_id: userId, 
      view: buildHome(!shouldEnableContext, { 
        error: "⚠️ Something went wrong. Please try again later." 
      }) 
    });
  }
};