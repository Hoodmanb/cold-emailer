const jwt = require("jsonwebtoken");
const { setCurrentUserId } = require("./requestContext");
const { findUserById } = require("../repositories/userRepository");
const debugLog = require("../utils/debugLogger");

const { JWT_SECRET } = require("../utils/token");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = String(payload.sub || payload.id || "");
    
    if (!userId) {
      debugLog("AUTH FAILED", { reason: "Missing sub/id in payload" });
      return res.status(401).json({ success: false, message: "Invalid authentication token" });
    }

    // Hydrate user from storage to ensure they exist and are active
    const user = findUserById(userId);
    if (!user) {
      debugLog("AUTH FAILED", { userId, reason: "User not found in storage" });
      return res.status(401).json({ success: false, message: "User account no longer exists" });
    }

    if (user.disabled === true) {
      debugLog("AUTH FAILED", { userId, reason: "User disabled" });
      return res.status(403).json({ success: false, message: "Account has been disabled" });
    }

    // Attach FULL fresh user object to req.user
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
    return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
  }
}

module.exports = { requireAuth, JWT_SECRET };
