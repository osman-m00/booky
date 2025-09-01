const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // MUST run before using process.env



const supabaseUrl = process.env.SUPABASE_URL;

// Use ANON key for public requests (frontend) and service role key for backend server
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    throw new Error('Missing environment variables');
}

// Export two clients: one public, one server
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
});

const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
});

module.exports = { supabase, supabasePublic };
