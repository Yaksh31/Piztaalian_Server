const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware for authenticating requests based on allowed roles.
 * @param {Array} roles - Array of allowed roles (e.g., ['admin', 'branch admin', 'influencer', 'user'])
 */
const authMiddleware = (roles) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not logged in", status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Not authorized, please login", status: 401 });
    }

    let verifiedToken;
    // Iterate through the allowed roles and attempt token verification.
    for (const role of roles) {
      try {
        // Transform role to match environment variable naming (e.g., "branch admin" → "BRANCH_ADMIN")
        const secret = process.env[`${role.toUpperCase().replace(" ", "_")}_JWT_SECRET_TOKEN`];
        verifiedToken = jwt.verify(token, secret);
        if (verifiedToken) break;  // Token is valid for one of the roles
      } catch (error) {
        continue;  // Try the next role if verification fails
      }
    }

    if (!verifiedToken || !verifiedToken.id) {
      return res.status(401).json({ error: "Invalid token", status: 401 });
    }

    // Attach verified user information to the request object
    req.user = { id: verifiedToken.id, role: verifiedToken.role };
    next();
  };
};

module.exports.authMiddleware = authMiddleware;


/**
 * Generates an access token for a given user and role.
 * @param {String} id - The unique identifier for the user.
 * @param {String} role - The role assigned to the user.
 * @returns {String} - Signed JWT access token.
 */
const generateAccessToken = (id, role) => {
    const issuedAt = Math.floor(Date.now() / 1000);
    return jwt.sign(
      { id, iat: issuedAt, role },
      process.env[`${role.toUpperCase().replace(" ", "_")}_JWT_SECRET_TOKEN`],
      { expiresIn: "30d" }
    );
  };
  
  module.exports.generateAccessToken = generateAccessToken;
