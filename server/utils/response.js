/**
 * @param {import('express').Response} res
 */
function successResponse(res, { status = 200, message, data = {}, meta } = {}) {
  const req = res.req;
  const payload = {
    success: true,
    message: message || "Request completed successfully",
    data,
  };

  // Attach lightweight auth metadata for frontend sync
  if (req.user) {
    payload.auth = {
      userVersion: req.user.userVersion,
      isAuthenticated: true,
    };
  } else {
    payload.auth = {
      isAuthenticated: false,
    };
  }

  if (meta !== undefined) payload.meta = meta;
  return res.status(status).json(payload);
}

/**
 * @param {import('express').Response} res
 */
function errorResponse(res, { status = 500, message, error, type, errors, errorCode } = {}) {
  const safeMessage = message || "Something went wrong. Please try again later";
  const payload = {
    success: false,
    message: safeMessage,
    error: error || safeMessage,
  };
  if (type) payload.type = type;
  if (Array.isArray(errors) && errors.length) payload.errors = errors;
  if (errorCode) payload.errorCode = errorCode;
  return res.status(status).json(payload);
}

module.exports = {
  successResponse,
  errorResponse,
};
