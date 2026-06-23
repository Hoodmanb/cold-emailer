const recipientRepo = require('../repositories/recipientRepository');
const { requireUserId } = require('../utils/requireUserId');

const listRecipients = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const recipients = await recipientRepo.listRecipients(userId);
    return res.status(200).json({ message: 'retrieved successfully', data: recipients });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

const getRecipient = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { email } = req.params;
    const recipient = await recipientRepo.getRecipientByEmail(email, userId);
    if (!recipient) return res.status(404).json({ message: 'recipient not found' });
    return res.status(200).json({ message: 'retrieved successfully', data: recipient });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

const createRecipient = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { email, name, category, company, role } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        message: 'validation error',
        errors: [
          !name && { message: 'name is required', path: ['name'] },
          !email && { message: 'email is required', path: ['email'] },
        ].filter(Boolean),
      });
    }

    const existing = await recipientRepo.getRecipientByEmail(email, userId);
    if (existing) {
      return res.status(409).json({ message: 'field error', errors: { email: 'email already exist' } });
    }

    const recipient = await recipientRepo.createRecipient({ email, name, category, company, role }, userId);
    return res.status(200).json({ message: 'created successfully', data: recipient });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

const updateRecipient = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { email } = req.params;
    const existing = await recipientRepo.getRecipientByEmail(email, userId);
    if (!existing) return res.status(404).json({ message: 'recipient not found' });

    const updated = await recipientRepo.updateRecipient(existing.id, req.body, userId);
    return res.status(200).json({ message: 'recipient updated successfully', data: updated });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

const deleteRecipient = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { email } = req.params;
    const existing = await recipientRepo.getRecipientByEmail(email, userId);
    if (!existing) return res.status(404).json({ message: 'recipient not found' });

    await recipientRepo.deleteRecipient(existing.id, userId);
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

module.exports = { listRecipients, getRecipient, createRecipient, updateRecipient, deleteRecipient };
