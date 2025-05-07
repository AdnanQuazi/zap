const NodeCache = require('node-cache');
// TTL of 2 minutes (in seconds)
const syncCache = new NodeCache({ stdTTL: 300 });

/**
 * Checks if sync should be triggered for the given channelId.
 * @param {string} channelId - The channel identifier.
 * @returns {boolean} - Returns true if 2 minutes have passed since last sync or if no sync has been recorded.
 */
function shouldTriggerSync({channelId}) {
  // If the key doesn't exist in cache, we should sync
  if (!syncCache.has(channelId)) {
    // Set with default TTL
    syncCache.set(channelId, Date.now());
    return true;
  }
  return false;
}

module.exports = shouldTriggerSync;