const executionRepo = require('../modules/scheduler/executionRepo');

// GET /api/scheduler/history
async function listHistory(req, res) {
  try {
    const history = await executionRepo.listAll();
    return res.status(200).json({ message: 'retrieved successfully', data: history });
  } catch (err) {
    console.error('[scheduleExecutionController] Error fetching history:', err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
}

module.exports = {
  listHistory,
};
