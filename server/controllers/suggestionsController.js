const {
  getRecipientSuggestions,
  getTemplateSuggestions,
  getSmtpSuggestions,
  parseLimit,
} = require('../services/suggestionsService');
const { recordSelection } = require('../services/contextUsageService');

const recipients = async (req, res) => {
  try {
    const limit = parseLimit(req.query);
    const data = await getRecipientSuggestions(limit);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const templates = async (req, res) => {
  try {
    const limit = parseLimit(req.query);
    const data = await getTemplateSuggestions(limit);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const smtp = async (req, res) => {
  try {
    const limit = parseLimit(req.query);
    const data = await getSmtpSuggestions(limit);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const track = async (req, res) => {
  try {
    const result = await recordSelection(req.body);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message || 'Invalid request' });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { recipients, templates, smtp, track };
