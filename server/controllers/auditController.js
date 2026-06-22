const { readLogs } = require('../logs/auditLogger');

const getLogs = async (req, res) => {
  const { limit = 100, action } = req.query;
  const logs = await readLogs({ limit: parseInt(limit, 10), action });
  return res.status(200).json({ message: 'retrieved successfully', data: logs });
};

module.exports = { getLogs };
