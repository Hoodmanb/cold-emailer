const { getCurrentUserId } = require('./requestContext');
const userRepo = require('../repositories/userRepository');

async function adminOnly(req, res, next) {
  try {
    const userId = getCurrentUserId();
    const user = await userRepo.findUserById(userId);
    if (!user || user.isAdmin !== true) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = adminOnly;
