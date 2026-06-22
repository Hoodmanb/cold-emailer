// const { createClient } = require('@supabase/supabase-js');

// const SUPABASE_URL = process.env.SUPABASE_URL;
// const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
//   throw new Error('Supabase credentials missing: SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables.');
// }

// /**
//  * Public (anon-key) Supabase client.
//  * Used for:
//  *   - signInWithPassword / signUp flows when not using admin privileges
//  *   - password reset emails
//  *   - general data queries not requiring elevated permissions
//  */
// const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// module.exports = supabasePublic;


const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase service role credentials are missing in environment variables.');
}

// Export a singleton admin client (service_role) for privileged operations
const supabasePublic = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

module.exports = supabasePublic;
