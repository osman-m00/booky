const { verifyToken, clerkClient } = require('@clerk/clerk-sdk-node');

async function clerkAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'No token provided' });

    // Verify the token (session JWT)
    const session = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Fetch full user from Clerk
    const user = await clerkClient.users.getUser(session.sub);

    // Attach full user to request
    req.user = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      avatarUrl: user.profileImageUrl || null,
    };

    next();
  } catch (err) {
    console.error('Clerk auth error:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = clerkAuth;
