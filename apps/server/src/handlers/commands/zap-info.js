const {INFO_BLOCKS, CURRENT_BOT_VERSION } = require("../../constants/config");
const { getUserTimezone } = require("../../helpers/ask-rate-limit");
const { fetchInstallation } = require("../../services/installation-services");
const { formatDateFromISO } = require("../../utils/timestamp-utils");
const compareVersions = require("../../utils/version-check");

module.exports = async ({ command, ack, respond, client }) => {
  await ack();
  const { team_id, user_id } = command;
  const timezone = await getUserTimezone({ client, userId: user_id }); // IANA timezone string, e.g., "Asia/Kolkata"

  try {
    const data = await fetchInstallation({ teamId: team_id });
    if (!data) {
      await respond("No installation data found for your team.");
      return;
    }
    const installedAt = formatDateFromISO(data.installation_date, timezone);
    const updatedAt = formatDateFromISO(data.last_updated_at, timezone);
    await respond({
      text: "App information overview",
      blocks: INFO_BLOCKS({
        data,
        installedAt,
        updatedAt,
        showUpdateButton: compareVersions(
          data.bot_version,
          CURRENT_BOT_VERSION
        ),
      })
    });
    return;
  } catch (error) {
    console.error("Info err :", error);
    return respond({
      text: "⚠️ Something went wrong. Please try again later.",
    });
  }
};
