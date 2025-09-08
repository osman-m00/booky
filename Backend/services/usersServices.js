const {supabase} = require('../config/supabase')
const { clerkClient } = require('@clerk/clerk-sdk-node');

async function getOrCreateUser(clerkUser) {
  try {
    // Fetch full user data from Clerk
    const fullUser = await clerkClient.users.getUser(clerkUser.id);

    const { emailAddresses, firstName, lastName, imageUrl } = fullUser;

    const email = emailAddresses?.[0]?.emailAddress; // first email
    const name = `${firstName || ''} ${lastName || ''}`.trim() || email || clerkUser.id;

    // Check if user exists
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUser.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (user) return user;

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_id: clerkUser.id,
        email,
        name,
        avatar_url: imageUrl,
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
