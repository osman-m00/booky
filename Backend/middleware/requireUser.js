const supabase = require('../config/supabase') // your Supabase client

module.exports = async function requireUser(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User must be authenticated',
      });
    }

    const clerkId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'This user does not exist in the internal database',
      });
    }

    req.userId = user.id;

    next(); // continue to the controller
  } catch (err) {
    console.error('requireUser error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
