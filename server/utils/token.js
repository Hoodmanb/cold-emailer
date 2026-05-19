const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "local-dev-jwt-secret-change-me";

/**
 * Signs a JWT token for a user.
 * @param {object} user - The user object (must contain id and email).
 * @returns {string} - The signed JWT token.
 */
function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

module.exports = {
  signToken,
  JWT_SECRET,
};
