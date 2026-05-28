const jwt = require("jsonwebtoken");
const { setCurrentUserId } = require("./requestContext");
const { findUserById } = require("../repositories/userRepository");
const debugLog = require("../utils/debugLogger");
const { errorResponse } = require("../utils/response");

const { JWT_SECRET } = require("../utils/token");

function authFailure(res, message, errorCode = "AUTH_ERROR") {
  return errorResponse(res, {
    status: 401,
    message,
    error: message,
    type: "auth_error",
    errorCode,
  });
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return authFailure(res, "Authentication required", "AUTH_REQUIRED");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = String(payload.sub || payload.id || "");

    if (!userId) {
      debugLog("AUTH FAILED", { reason: "Missing sub/id in payload" });
      return authFailure(res, "Invalid authentication token", "AUTH_INVALID_TOKEN");
    }

    const user = findUserById(userId);
    if (!user) {
      debugLog("AUTH FAILED", { userId, reason: "User not found in storage" });
      return authFailure(res, "User account no longer exists", "AUTH_USER_NOT_FOUND");
    }

    if (user.disabled === true) {
      debugLog("AUTH FAILED", { userId, reason: "User disabled" });
      return errorResponse(res, {
        status: 403,
        message: "Account has been disabled",
        error: "Account has been disabled",
        type: "auth_error",
        errorCode: "AUTH_DISABLED",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      userVersion: user.userVersion || 1,
      role: user.role || "user",
    };

    setCurrentUserId(req.user.id);
    debugLog("AUTH HYDRATION", { email: req.user.email, id: req.user.id, version: req.user.userVersion });

    return next();
  } catch (_err) {
    debugLog("AUTH FAILED", { error: _err.message });
    return authFailure(res, "Invalid or expired authentication token", "AUTH_TOKEN_EXPIRED");
  }
}

module.exports = { requireAuth, JWT_SECRET };
