const supabaseClient = require("../config/supabase");
const { CURRENT_BOT_VERSION } = require("../constants/config");

// Define current bot version - update this when releasing new versions


async function storeInstallation(installation) {
  // Get team id from installation
  const teamId = installation.team?.id || installation.enterprise?.id;
  if (!teamId) throw new Error("No team id found in installation data.");

  const supabase = supabaseClient({ team_id: teamId });
  
  // Check if this is an update/reinstall by looking for existing record
  const { data: existingInstall } = await supabase
    .from("installations")
    .select("*")
    .eq("team_id", teamId)
    .single();
  
  // Get current timestamp
  const currentTimestamp = new Date().toISOString();
  
  // Prepare installation data
  const installationData = {
    team_id: teamId,
    access_token: installation.access_token,
    bot_user_id: installation.bot_user_id,
    team_name: installation.team ? installation.team.name : null,
    authed_user_id: installation.authed_user?.id,
    bot_version: CURRENT_BOT_VERSION,
    data: installation, // Store entire installation
  };
  
  // For new installations, add installation_date
  if (!existingInstall) {
    console.log("Processing new installation");
    installationData.installation_date = currentTimestamp;
    installationData.last_updated_at = currentTimestamp;
  } else {
    console.log("Processing update/reinstallation");
    // Keep the original installation date, update only the last_updated_at
    installationData.installation_date = existingInstall.installation_date;
    installationData.last_updated_at = currentTimestamp;
    
    // Verify this update is from the same authenticated user
    if (existingInstall.authed_user_id && 
        installation.authed_user?.id && 
        existingInstall.authed_user_id !== installation.authed_user.id) {
      console.warn(`Warning: Update initiated by different user (original: ${existingInstall.authed_user_id}, current: ${installation.authed_user.id})`);
      // You can implement additional logic here if needed
    }
  }

  // Store installation with upsert (will create new record or update existing)
  const { error } = await supabase
    .from("installations")
    .upsert(installationData);

  if (error) {
    console.error("Supabase storeInstallation error:", error);
    throw error;
  }
  
  console.log(`Successfully ${existingInstall ? 'updated' : 'installed'} bot (version: ${CURRENT_BOT_VERSION}) for team: ${teamId}`);
}

// Fetch installation data from Supabase
async function fetchInstallation(query) {
  const teamId = query.teamId || query.enterpriseId;
  if (!teamId) throw new Error("No team id provided for fetchInstallation.");

  const supabase = supabaseClient({ team_id: teamId });
  const { data, error } = await supabase
    .from("installations")
    .select("*")
    .eq("team_id", teamId)
    .single();

  if (error) {
    console.error("Supabase fetchInstallation error:", error);
    throw error;
  }

  return data;
}

// Delete installation data from Supabase
async function deleteInstallation(query) {
  const teamId = query.teamId || query.enterpriseId;
  if (!teamId) throw new Error("No team id provided for deleteInstallation.");
  
  const supabase = supabaseClient({ team_id: teamId });
  const { error } = await supabase
    .from("installations")
    .delete()
    .eq("team_id", teamId);

  if (error) {
    console.error("Supabase deleteInstallation error:", error);
    throw error;
  }
}

// Get the current bot version
function getCurrentBotVersion() {
  return CURRENT_BOT_VERSION;
}

module.exports = {
  storeInstallation,
  fetchInstallation,
  deleteInstallation,
  getCurrentBotVersion,
};