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
function errorResponse(res, { status = 500, message, errors, errorCode } = {}) {
  const payload = {
    success: false,
    message: message || "Something went wrong. Please try again later",
  };
  if (Array.isArray(errors) && errors.length) payload.errors = errors;
  if (errorCode) payload.errorCode = errorCode;
  return res.status(status).json(payload);
}

module.exports = {
  successResponse,
  errorResponse,
};
