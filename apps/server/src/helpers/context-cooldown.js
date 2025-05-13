
async function checkSmartContextCooldown(supabase) {
    // Step 1: Get the cooldown duration (default to 24 hours if not set)
    const { data: configRow } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'context_toggle_cooldown')
      .single();
    const cooldownHours = parseInt(configRow?.value ?? '6');
  
    // Step 2: Get the last toggle time for this workspace
    const { data: installationRow, error } = await supabase
      .from('installations')
      .select('context_last_toggled_at')
      .single();

    if (error || !installationRow) {
      return {
        allowed: false,
        reason: 'Installation not found for this workspace.',
      };
    }
  
    const lastToggled = installationRow.context_last_toggled_at;
    if (!lastToggled) {
      return { allowed: true }; // No previous toggle, allow it
    }
  
    const now = new Date();
    const diffInHours = (now - new Date(lastToggled)) / (1000 * 60 * 60);
  
    if (diffInHours < cooldownHours) {
      const hoursLeft = Math.ceil(cooldownHours - diffInHours);
      return {
        allowed: false,
        reason: `Please wait ${hoursLeft} more hour(s) before toggling Smart Context again.`,
      };
    }
  
    return { allowed: true };
  }
  
  module.exports = checkSmartContextCooldown