
const fileStore = require("../utils/fileStore");
const { v4: uuidv4 } = require('uuid');
const normalizeString = require('../utils/normalizeString');

const FILE = 'recipients.json';

const listRecipients = () => fileStore.read(FILE);

const getRecipient = (id) => listRecipients().find((r) => String(r.id) === String(id)) || null;

const getRecipientByEmail = (email) =>
  // findOne(FILE, (r) => normalizeString(r.email) === normalizeString(email));
  listRecipients().find((r) => normalizeString(r.email) === normalizeString(email)) || null;

const createRecipient = (data) => {
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
  return fileStore.append(FILE, recipient);
};

const updateRecipient = (id, updates) =>
  fileStore.update(FILE, (r) => r.id === id, () => ({ ...updates }));

const bumpRecipientUsage = (id) => {
  const r = getRecipient(id);
  if (!r) return null;
  return updateRecipient(id, {
    usageCount: (Number(r.usageCount) || 0) + 1,
    lastUsedAt: new Date().toISOString(),
  });
};

const deleteRecipient = (id) => fileStore.remove(FILE, (r) => r.id === id);

module.exports = {
  listRecipients,
  getRecipient,
  getRecipientByEmail,
  createRecipient,
  updateRecipient,
  deleteRecipient,
  bumpRecipientUsage,
};
