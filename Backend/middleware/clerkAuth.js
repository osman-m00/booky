// Import the Clerk SDK
const { verifyToken } = require('@clerk/clerk-sdk-node');

async function clerkAuth(req, res, next) {
  try {
    // 1. Get the Authorization header from the request
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    // 2. Extract the token part from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // 3. Verify the token with Clerk using your secret key
    const session = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // 4. Attach the user info from Clerk to the request object
    req.user = {
      id: session.sub,           // Clerk user ID
      sessionId: session.sid,    // Session ID
      claims: session,           // All claims in the JWT
    };

    // 5. Pass control to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Clerk auth error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = clerkAuth;
