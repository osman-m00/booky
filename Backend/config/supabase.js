const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if(!supabaseUrl || !supabaseKey) {
    throw new Error('Missing environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {persistSession: false},
});

module.exports = {supabase};