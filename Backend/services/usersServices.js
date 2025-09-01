const supabase = require('../config/supabase')

async function getOrCreateUser(clerkUser) {
  try {
    const { id: clerkId, email, firstName, lastName, avatarUrl } = clerkUser;

    const name = `${firstName || ''} ${lastName || ''}`.trim() || email;

    // Checking if user already exists
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    if (user) return user;

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_id: clerkId,
        email,
        name,
        avatar_url: avatarUrl,
      })
      .select('*')
      .single();

    if (insertError) throw insertError;

    return newUser;

  } catch (err) {
    console.error('getOrCreateUser error:', err);
    throw err;
  }
}

module.exports = getOrCreateUser;
