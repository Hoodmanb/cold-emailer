const recipientRepo = require('../repositories/recipientRepository');
const normalizeString = require('../utils/normalizeString');

const listRecipients = (req, res) => {
  const recipients = recipientRepo.listRecipients();
  return res.status(200).json({ message: 'retrieved successfully', data: recipients });
};

const getRecipient = (req, res) => {
  const { email } = req.params;
  const recipient = recipientRepo.getRecipientByEmail(email);
  if (!recipient) return res.status(404).json({ message: 'recipient not found' });
  return res.status(200).json({ message: 'retrieved successfully', data: recipient });
};

const createRecipient = (req, res) => {
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

  const existing = recipientRepo.getRecipientByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'field error', errors: { email: 'email already exist' } });
  }

  const recipient = recipientRepo.createRecipient({ email, name, category, company, role });
  return res.status(200).json({ message: 'created successfully', data: recipient });
};

const updateRecipient = (req, res) => {
  const { email } = req.params;
  const existing = recipientRepo.getRecipientByEmail(email);
  if (!existing) return res.status(404).json({ message: 'recipient not found' });

  const updated = recipientRepo.updateRecipient(existing.id, req.body);
  return res.status(200).json({ message: 'recipient updated successfully', data: updated });
};

const deleteRecipient = (req, res) => {
  const { email } = req.params;
  const existing = recipientRepo.getRecipientByEmail(email);
  if (!existing) return res.status(404).json({ message: 'recipient not found' });

  recipientRepo.deleteRecipient(existing.id);
  return res.status(204).send();
};

module.exports = { listRecipients, getRecipient, createRecipient, updateRecipient, deleteRecipient };
