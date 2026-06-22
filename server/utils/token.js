/**
 * DEPRECATED — token signing is now handled entirely by Supabase Auth.
 * This file is kept only to avoid breaking any legacy imports.
 * Do not use signToken() — it will throw at runtime.
 */

function signToken(_user) {
  throw new Error(
    '[token.js] signToken() is deprecated. Authentication is now handled by Supabase Auth.'
  );
}

const JWT_SECRET = null;

module.exports = { signToken, JWT_SECRET };
