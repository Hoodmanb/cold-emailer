const { requireAuth } = require('./requireAuth');
const { errorResponse } = require('../utils/response');

function requireAdmin(req, res, next) {
  if (!req.user) {
    return errorResponse(res, {
      status: 401,
      message: 'Authentication required',
      errorCode: 'AUTH_REQUIRED',
      type: 'auth_error',
    });
  }
  if (String(req.user.role || '').toLowerCase() !== 'admin') {
    return errorResponse(res, {
      status: 403,
      message: 'Admin access required',
      errorCode: 'ADMIN_REQUIRED',
      type: 'auth_error',
    });
  }
  return next();
}

module.exports = { requireAdmin, requireAuth };
