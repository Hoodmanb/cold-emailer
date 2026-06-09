const { getCurrentUserId } = require('./requestContext');
const userRepo = require('../repositories/userRepository');

function adminOnly(req, res, next) {
  const userId = getCurrentUserId();
  const user = userRepo.findUserById(userId);
  if (!user || user.isAdmin !== true) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

module.exports = adminOnly;
