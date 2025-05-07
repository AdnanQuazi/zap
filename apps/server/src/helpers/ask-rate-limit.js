/**
 * Redis rate limiting for /ask command with optimized timezone handling
 */

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const redis = require('../config/redis');

// Setup dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Initialize Redis client


// Redis TTL for cached timezone data (7 days in seconds)
const TIMEZONE_CACHE_TTL = 7 * 24 * 60 * 60;

/**
 * Get or cache user's timezone
 * 
 * @param {Object} params - Function parameters
 * @param {Object} params.client - Slack client
 * @param {string} params.userId - User ID to get timezone for
 * @returns {Promise<string>} - User's timezone or 'UTC' as fallback
 */
async function getUserTimezone({ client, userId }) {
  try {
    // Check if timezone is cached in Redis
    const redisKey = `user_timezone:${userId}`;
    const cachedTimezone = await redis.get(redisKey);
    
    if (cachedTimezone) {
      return cachedTimezone;
    }
    
    // Fetch timezone from Slack API if not cached
    const userInfo = await client.users.info({ user: userId });
    const timezone = userInfo.user.tz || 'UTC';
    
    // Cache timezone in Redis for future requests
    await redis.set(redisKey, timezone, 'EX', TIMEZONE_CACHE_TTL);
    
    return timezone;
  } catch (error) {
    console.warn('[RATE LIMIT] ⚠️ Error fetching/caching user timezone:', error);
    return 'UTC'; // Default to UTC if unable to get user timezone
  }
}

/**
 * Check if the team has exceeded their daily quota
 * 
 * @param {Object} params - Function parameters
 * @param {string} params.teamId - Team ID to check quota for
 * @param {number} params.maxRequests - Maximum allowed requests per day (default: 30)
 * @param {string} params.userTimezone - User's timezone for displaying reset time (default: 'UTC')
 * @returns {Promise<Object>} - Object containing hasQuota and resetInfo
 */
async function checkTeamQuota({ teamId, maxRequests = 30, userTimezone = 'UTC' }) {
  try {
    // Key format: ask_quota:{teamId}:{YYYY-MM-DD}
    const today = dayjs().utc().format('YYYY-MM-DD');
    const redisKey = `ask_quota:${teamId}:${today}`;
    
    // Increment the counter atomically and get the new value
    const currentCount = await redis.incr(redisKey);
    
    // If this is a new key, set expiration to end of day (UTC)
    if (currentCount === 1) {
      // Calculate seconds until midnight UTC
      const midnight = dayjs().utc().endOf('day');
      const secondsToExpire = midnight.diff(dayjs().utc(), 'second');
      await redis.expire(redisKey, secondsToExpire);
    }
    
    // Check if quota is exceeded
    const hasQuota = currentCount <= maxRequests;
    
    // Calculate reset time in user's timezone
    const nextResetUtc = dayjs().utc().endOf('day');
    const nextResetUserTz = nextResetUtc.clone().tz(userTimezone);
    const resetTime = nextResetUserTz.format('h:mm A');
    const resetTimeWithDay = nextResetUserTz.format('h:mm A [on] MMM D');
    
    // Calculate if reset is today or tomorrow in user's timezone
    const now = dayjs().tz(userTimezone);
    const isToday = nextResetUserTz.isSame(now, 'day');
    const isTomorrow = nextResetUserTz.isSame(now.add(1, 'day'), 'day');
    
    // Return quota status and reset information
    return {
      hasQuota,
      currentCount,
      maxRequests,
      remainingRequests: Math.max(0, maxRequests - currentCount),
      resetTime,
      resetTimeWithDay,
      isToday,
      isTomorrow
    };
  } catch (error) {
    console.error('[RATE LIMIT] ❌ Error checking team quota:', error);
    // Default to allowing the request in case of error
    return { 
      hasQuota: true, 
      errorOccurred: true 
    };
  }
}

/**
 * Generate message for quota limit reached
 * 
 * @param {Object} quotaInfo - Quota information object
 * @returns {string} - Formatted message for the user
 */
function generateQuotaLimitMessage(quotaInfo) {
  const { resetTime, isToday, isTomorrow, resetTimeWithDay } = quotaInfo;
  
  let resetMessage;
  if (isToday) {
    resetMessage = `today at ${resetTime}`;
  } else if (isTomorrow) {
    resetMessage = `tomorrow at ${resetTime}`;
  } else {
    resetMessage = resetTimeWithDay;
  }
  
  return `⚠️ Your team has reached the daily limit of 30 AI-powered responses. Your quota will reset ${resetMessage} in your local time.`;
}

module.exports = {
  checkTeamQuota,
  getUserTimezone,
  generateQuotaLimitMessage
};