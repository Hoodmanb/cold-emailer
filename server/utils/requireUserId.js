const { errorResponse } = require('./response');

/**
 * Extract authenticated user id from the request.
 * Returns the userId string, or null after sending a 401 response.
 */
function requireUserId(req, res) {
  const userId = req.user?.id ? String(req.user.id) : '';
  if (!userId) {
    errorResponse(res, {
      status: 401,
      message: 'Authentication required',
      error: 'Authentication required',
      type: 'auth_error',
      errorCode: 'AUTH_REQUIRED',
    });
    return null;
  }
  return userId;
}

module.exports = { requireUserId };
