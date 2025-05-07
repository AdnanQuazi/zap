/**
 * Timestamp utilities for consistent timestamp handling across the application
 */

const { FIFTEEN_DAYS_IN_SECONDS } = require("../constants/config");


/**
 * Converts input timestamp to Unix seconds
 * @param {string|number} tsInput - Input timestamp
 * @returns {number} Unix timestamp in seconds
 * @throws {Error} If timestamp format is invalid
 */
function convertToUnixTimestamp(tsInput) {
  if (typeof tsInput === "string") {
    return Math.floor(new Date(tsInput).getTime() / 1000);
  }
  if (typeof tsInput === "number") {
    return tsInput;
  }
  throw new Error("Invalid timestamp format. Provide ISO string or Unix number.");
}

/**
 * Validates if timestamp is within last 15 days
 * @param {string|number} tsInput - Timestamp to validate
 * @returns {Object} Validation results and timestamp info
 */
function isWithinLast15Days(tsInput) {
  const now = Math.floor(Date.now() / 1000);
  const fifteenDaysAgo = now - FIFTEEN_DAYS_IN_SECONDS;

  try {
    const ts = convertToUnixTimestamp(tsInput);
    return {
      isValid: ts >= fifteenDaysAgo && ts <= now,
      inputUnix: ts,
      fifteenDaysAgoUnix: fifteenDaysAgo,
      nowUnix: now,
    };
  } catch (error) {
    console.error("Error processing timestamp:", error);
    return {
      isValid: false,
      error: error.message
    };
  }
}

/**
 * Format Unix timestamp to Slack message timestamp format
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Formatted timestamp for Slack
 */
function formatSlackTimestamp(timestamp) {
  // Slack messages use a format like "1743246576.867459"
  return timestamp.toString();
}

/**
 * Convert Slack timestamp to a message link
 * @param {string} timestamp - Slack timestamp 
 * @param {string} subdomain - Slack workspace subdomain
 * @param {string} channelId - Channel ID
 * @returns {string} Slack message link
 */
function createMessageLink(timestamp, subdomain, channelId) {
  // Remove decimal point for permalink format
  const formattedTs = timestamp.replace('.', '');
  return `https://${subdomain}.slack.com/archives/${channelId}/p${formattedTs}`;
}

/**
 * Get a human-readable time representation
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Human-readable time
 */
function getHumanReadableTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

/**
 * Get a human-readable time representation from ISO string
 * @param {string} isoString - ISO date string
 * @param {string} tz - Timezone string
 * @returns {string} Human-readable time
 */


function formatDateFromISO (isoString , tz){
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    timeZone: tz,
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short"
  });
};

module.exports = {
  convertToUnixTimestamp,
  isWithinLast15Days,
  formatSlackTimestamp,
  createMessageLink,
  getHumanReadableTime,
  formatDateFromISO,
  FIFTEEN_DAYS_IN_SECONDS
};