const {
  getRecipientSuggestions,
  getTemplateSuggestions,
  getSmtpSuggestions,
  parseLimit,
} = require('../services/suggestionsService');
const { recordSelection } = require('../services/contextUsageService');

const recipients = (req, res) => {
  const limit = parseLimit(req.query);
  const data = getRecipientSuggestions(limit);
  return res.status(200).json({ success: true, data });
};

const templates = (req, res) => {
  const limit = parseLimit(req.query);
  const data = getTemplateSuggestions(limit);
  return res.status(200).json({ success: true, data });
};

const smtp = (req, res) => {
  const limit = parseLimit(req.query);
  const data = getSmtpSuggestions(limit);
  return res.status(200).json({ success: true, data });
};

const track = (req, res) => {
  const result = recordSelection(req.body);
  if (!result.ok) {
    return res.status(400).json({ success: false, message: result.message || 'Invalid request' });
  }
  return res.status(200).json({ success: true });
};

module.exports = { recipients, templates, smtp, track };
