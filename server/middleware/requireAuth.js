const supabaseAdmin = require('../utils/supabaseAdmin');
const jwt = require('jsonwebtoken');
const { setCurrentUserId } = require('./requestContext');

/**
 * Validates a Supabase JWT from the Authorization header.
 * Attaches `req.user = { id, email, role }` on success.
 *
 * Accepts:  Authorization: Bearer <supabase-access-token>
 * Also falls back to cookie auth_token.
 */
async function requireAuth(req, res, next) {
  let token = null;

  // 1. Authorization header
  const authHeader = req.headers?.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // 2. Cookie fallback
  if (!token) {
    token = req.cookies?.auth_token || null;
  }

  if (!token) {
    return res.status(401).json({
      status: 401,
      message: 'Authentication required',
      error: 'Missing auth token',
      type: 'auth_error',
      errorCode: 'AUTH_REQUIRED',
    });
  }

  const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

  let user = null;
  let supabaseError = null;

  /**
   * ─────────────────────────────────────────────
   * 1. Try local JWT verification first (fast path)
   * ─────────────────────────────────────────────
   */
  if (JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      user = {
        id: decoded.sub,
        email: decoded.email,
        user_metadata: decoded.user_metadata || {},
      };
    } catch (err) {
      console.warn('[requireAuth] Local JWT verification failed, falling back to Supabase:', err.message);
    }
  }

  /**
   * ─────────────────────────────────────────────
   * 2. Fallback to Supabase Admin verification
   * ─────────────────────────────────────────────
   */
  if (!user) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    supabaseError = error || null;

    if (!error) {
      user = data?.user;
    }
  }

  /**
   * ─────────────────────────────────────────────
   * 3. Handle Supabase errors (network vs auth)
   * ─────────────────────────────────────────────
   */
  if (supabaseError) {
    const errMsg = String(
      supabaseError?.message ||
      supabaseError?.name ||
      ''
    );

    const causeCode =
      supabaseError?.cause?.code ||
      supabaseError?.code ||
      '';

    const isNetworkError =
      errMsg.includes('fetch failed') ||
      errMsg.includes('timeout') ||
      errMsg.includes('ECONNRESET') ||
      errMsg.includes('socket') ||
      errMsg.includes('SSL') ||
      errMsg.includes('decryption failed') ||
      causeCode.startsWith('UND_ERR') ||
      causeCode === 'ECONNRESET' ||
      causeCode === 'ETIMEDOUT';

    if (isNetworkError) {
      console.warn(
        '[requireAuth] Supabase network error — returning 503:',
        errMsg
      );

      return res.status(503).json({
        status: 503,
        message: 'Authentication service temporarily unavailable. Please retry.',
        error: 'Auth service unreachable',
        type: 'service_unavailable',
        errorCode: 'AUTH_SERVICE_UNAVAILABLE',
      });
    }

    return res.status(401).json({
      status: 401,
      message: 'Invalid or expired session',
      error: supabaseError?.message ?? 'Auth error',
      type: 'auth_error',
      errorCode: 'AUTH_INVALID_TOKEN',
    });
  }

  /**
   * ─────────────────────────────────────────────
   * 4. Final safety check
   * ─────────────────────────────────────────────
   */
  if (!user) {
    return res.status(401).json({
      status: 401,
      message: 'Invalid or expired session',
      error: 'No user returned from auth service',
      type: 'auth_error',
      errorCode: 'AUTH_INVALID_TOKEN',
    });
  }

  /**
   * ─────────────────────────────────────────────
   * 5. Attach user context
   * ─────────────────────────────────────────────
   */
  const roleRaw = user.user_metadata?.role || 'user';
  const role =
    typeof roleRaw === 'string'
      ? roleRaw.toLowerCase()
      : 'user';

  console.log(
    '[requireAuth] User metadata:',
    JSON.stringify(user.user_metadata)
  );

  console.log(
    '[requireAuth] Resolved role (normalized):',
    role
  );

  req.user = {
    id: user.id,
    email: user.email,
    role,
  };

  // Seed async request context
  setCurrentUserId(user.id);

  next();
}

/** Legacy export placeholder */
const JWT_SECRET = null;

module.exports = { requireAuth, JWT_SECRET };