const fileStore = require('../utils/fileStore');
const { ensureArray } = require('../utils/jsonNormalizer');
const { v4: uuidv4 } = require('uuid');
const normalizeString = require('../utils/normalizeString');

const FILE = 'recipients.json';

const listRecipients = (userId) => ensureArray(fileStore.read(FILE, userId));

const getRecipient = (id, userId) =>
  listRecipients(userId).find((r) => String(r.id) === String(id)) || null;

const getRecipientByEmail = (email, userId) =>
  listRecipients(userId).find(
    (r) => normalizeString(r.email) === normalizeString(email),
  ) || null;

const createRecipient = (data, userId) => {
  const recipient = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    name: data.name,
    email: normalizeString(data.email),
    company: data.company || '',
    category: data.category || '',
    role: data.role || '',
    usageCount: 0,
    lastUsedAt: null,
  };
  return fileStore.append(FILE, recipient, userId);
};

const updateRecipient = (id, updates, userId) =>
  fileStore.update(FILE, (r) => r.id === id, () => ({ ...updates }), userId);

const bumpRecipientUsage = (id, userId) => {
  const r = getRecipient(id, userId);
  if (!r) return null;
  return updateRecipient(
    id,
    {
      usageCount: (Number(r.usageCount) || 0) + 1,
      lastUsedAt: new Date().toISOString(),
    },
    userId,
  );
};

const deleteRecipient = (id, userId) =>
  fileStore.remove(FILE, (r) => r.id === id, userId);

module.exports = {
  listRecipients,
  getRecipient,
  getRecipientByEmail,
  createRecipient,
  updateRecipient,
  deleteRecipient,
  bumpRecipientUsage,
};
