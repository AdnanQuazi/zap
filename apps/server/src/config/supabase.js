// lib/getScopedSupabaseClient.js

const jwt = require('jsonwebtoken')
const { createClient } = require('@supabase/supabase-js')

/**
 * @param {{ team_id: string, channel_id?: string|null }} opts
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
function supabaseClient({ team_id, channel_id = null , user_id = null}) {
  if (!team_id) {
    throw new Error('`team_id` is required')
  }

  // Build the JWT payload
  const payload = { team_id }
  if (channel_id) payload.channel_id = channel_id
  if (user_id) payload.user_id = user_id
  // Sign it with the same secret Supabase uses
  const token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET, {
    expiresIn: '1h',
  })

  // Create a new client using the anon key (so RLS applies)
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  )
}

module.exports = supabaseClient 
