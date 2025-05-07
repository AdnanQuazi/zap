/**
 * Database Helper Functions
 * 
 * Provides utility functions for interacting with the Supabase database
 * for fetching and updating application state
 */

const redis = require("../config/redis");


/**
 * Check if Smart Context feature is enabled for a team with Redis caching
 * 
 * @param {Object} params - Function parameters
 * @param {Object} params.supabase - Supabase client instance
 * @param {string} [params.teamId] - Team ID for cache key
 * @returns {Promise<boolean>} - Whether Smart Context is enabled
 */
async function isSmartContextEnabled({ supabase, teamId = 'default' }) {
  try {
    // Try to get from Redis cache first
    const cacheKey = `smart_context:${teamId}`;
    const cachedValue = await redis.get(cacheKey);
    
    // If we have a cached value, return it
    if (cachedValue !== null) {
      console.log("[DB] Using cached Smart Context status");
      return cachedValue === 'true';
    }
    
    // If not in cache, fetch from database
    const { data, error } = await supabase
      .from("installations")
      .select("enable_smart_context")
      .single();
      
    if (error) {
      console.error("[DB] Error fetching Smart Context status:", error);
      throw error;
    }
    
    const isEnabled = data?.enable_smart_context ?? false;
    
    // Store in Redis cache with 6-hour expiry (21600 seconds)
    await redis.set(cacheKey, isEnabled.toString(), 'EX', 21600);
    console.log(`[DB] Cached Smart Context status for ${teamId} for 6 hours`);
    
    return isEnabled;
  } catch (err) {
    console.error("[DB] ⚠️ Error fetching Smart Context status:", err);
    return false;
  }
}

/**
 * Toggle Smart Context feature and record timestamp
 * 
 * @param {Object} params - Function parameters
 * @param {string} params.teamId - Team ID to update
 * @param {boolean} params.enabled - Whether to enable or disable Smart Context
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<void>}
 */
async function setSmartContext({ teamId, enabled, supabase }) {
  try {
    const updates = {
      enable_smart_context: enabled,
      context_last_toggled_at: new Date().toISOString(),
    };
    
    const { error } = await supabase
      .from("installations")
      .update(updates)
      .eq("team_id", teamId);
      
    if (error) {
      console.error(`[DB] Error updating Smart Context:`, error);
      throw error;
    }
    
    // Invalidate Redis cache
    const cacheKey = `smart_context:${teamId}`;
    await redis.del(cacheKey);
    console.log(`[DB] Invalidated Smart Context cache for team ${teamId}`);
    
    console.log(`[DB] Smart Context set to ${enabled} for team ${teamId}`);
  } catch (err) {
    console.error(
      `[DB] ⚠️ Error setting Smart Context=${enabled} for ${teamId}:`,
      err
    );
    throw err;
  }
}


/**
 * Get the last sync state for channel synchronization
 * 
 * @param {Object} params - Function parameters
 * @param {Object} params.supabase - Supabase client
 * @returns {Promise<Object>} - Last sync state with timestamps and thread data
 */
async function getLastSyncState({ supabase }) {
  try {
    const { data, error } = await supabase
      .from("slack_sync_state")
      .select("last_main_ts, thread_ts_data , channel_id")
      .single();

    if (error) {
      // Default to 20 days ago if no sync state exists
      const twentyDaysAgoUnix = Math.floor(Date.now() / 1000) - 20 * 24 * 60 * 60;
      console.warn("[DB] No existing sync state found, using default:", error);
      return { lastMainTS: twentyDaysAgoUnix.toString(), threadTSData: {} };
    }

    return {
      lastMainTS: data.last_main_ts || "0",
      threadTSData: data.thread_ts_data || {},
    };
  } catch (error) {
    console.error("[DB] Error retrieving sync state:", error);
    const twentyDaysAgoUnix = Math.floor(Date.now() / 1000) - 20 * 24 * 60 * 60;
    return { lastMainTS: twentyDaysAgoUnix.toString(), threadTSData: {} };
  }
}

/**
 * Update the sync state after processing messages
 * 
 * @param {Object} params - Function parameters
 * @param {Object} params.supabase - Supabase client
 * @param {string} params.channelId - Channel ID
 * @param {string} params.lastMainTS - Timestamp of the most recent message
 * @param {Object} params.threadTSData - Thread timestamp data
 * @param {string} params.teamId - Team ID
 * @returns {Promise<void>}
 */
async function updateSyncState({
  supabase,
  channelId,
  lastMainTS,
  threadTSData,
  teamId,
}) {
  try {
    const { error } = await supabase.from("slack_sync_state").upsert({
      channel_id: channelId,
      last_main_ts: lastMainTS,
      thread_ts_data: threadTSData,
      team_id: teamId,
    });

    if (error) {
      console.error("[DB] Error updating sync state:", error);
      throw error;
    }
    
    console.log(`[DB] Successfully updated sync state for channel ${channelId}`);
  } catch (error) {
    console.error("[DB] Error updating sync state:", error);
    throw error;
  }
}


async function getOptedOutUsers({supabase, team_id}) {
  const { data, error } = await supabase
    .from('user_opt_outs')
    .select('user_id')
    .eq('team_id', team_id)

  if (error) {
    console.error('Error fetching opted-out users:', error.message)
    throw error
  }

  return data.map(row => row.user_id)
}
async function optOutUser({supabase, team_id, user_id}) {
  // Insert the opt-out record only if it doesn't exist
  // Using the 'on conflict' feature of PostgreSQL via Supabase
  const { data, error } = await supabase
    .from('user_opt_outs')
    .upsert(
      { team_id, user_id, opted_out_at: new Date().toISOString() },
      { onConflict: ['team_id', 'user_id'], ignoreDuplicates: true }
    )
    .select();

  if (error) {
    console.error('Error opting out user:', error.message);
    throw error;
  }

  // Return true if a new record was created, false if none (meaning user was already opted out)
  return data && data.length > 0;
}

async function optInUser({supabase, team_id, user_id}) {
  // Delete the record and check if anything was actually deleted
  const { data, error } = await supabase
    .from('user_opt_outs')
    .delete()
    .match({ team_id, user_id })
    .select();

  if (error) {
    console.error('Error removing user opt-out:', error.message);
    throw error;
  }

  // Return true if a record was deleted, false if none (meaning user was already opted in)
  return data && data.length > 0;
}


/**
 * Purges slack messages and related documents for a specific team, channel, and user
 * 
 * @param {Object} params - Function parameters
 * @param {Object} params.supabase - Initialized Supabase client
 * @param {string} params.team_id - The team ID to filter by
 * @param {string} params.channel_id - The channel ID to filter by
 * @param {string} params.user_id - The user ID to filter by
 * @returns {boolean} True if operation was successful, false otherwise
 */
async function purgeUserData({supabase, team_id, channel_id, user_id}) {
  try {
    // Run both delete operations in parallel
    const [docsResult, messagesResult] = await Promise.all([
      supabase
        .from('documents')
        .delete()
        .match({ team_id, channel_id, user_id }),
      
      supabase
        .from('slack_messages')
        .delete()
        .match({ team_id, channel_id, user_id })
    ]);
    
    // Check if either operation had an error
    if (docsResult.error) {
      console.error('Error deleting documents:', docsResult.error.message);
      return false;
    }
    
    if (messagesResult.error) {
      console.error('Error deleting messages:', messagesResult.error.message);
      return false;
    }
    
    // If we got here, both operations succeeded
    return true;
  } catch (error) {
    console.error('Unexpected error during purge operation:', error.message);
    return false;
  }
}


/**
 * Purges all slack messages and related documents for a specific team and channel
 * 
 * @param {Object} params - Function parameters
 * @param {Object} params.supabase - Initialized Supabase client
 * @param {string} params.team_id - The team ID to filter by
 * @param {string} params.channel_id - The channel ID to filter by
 * @returns {boolean} True if operation was successful, false otherwise
 */
async function purgeChannelData({supabase, team_id, channel_id}) {
  try {
    // Run both delete operations in parallel
    const [docsResult, messagesResult] = await Promise.all([
      supabase
        .from('documents')
        .delete()
        .match({ team_id, channel_id }),
      
      supabase
        .from('slack_messages')
        .delete()
        .match({ team_id, channel_id })
    ]);
    
    // Check if either operation had an error
    if (docsResult.error) {
      console.error('Error deleting channel documents:', docsResult.error.message);
      return false;
    }
    
    if (messagesResult.error) {
      console.error('Error deleting channel messages:', messagesResult.error.message);
      return false;
    }
    
    // If we got here, both operations succeeded
    return true;
  } catch (error) {
    console.error('Unexpected error during channel purge operation:', error.message);
    return false;
  }
}


module.exports = {
  isSmartContextEnabled,
  setSmartContext,
  getLastSyncState,
  updateSyncState,
  getOptedOutUsers,
  optOutUser,
  optInUser,
  purgeUserData,
  purgeChannelData
};