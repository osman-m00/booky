const { supabase } = require('../config/supabase');

async function checkDbHealth() {
  try {
    // Optional: set HEALTH_TABLE in .env after you create your first table (e.g., users)
    if (process.env.HEALTH_TABLE) {
      const { error } = await supabase.from(process.env.HEALTH_TABLE).select('id').limit(1);
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = { checkDbHealth };