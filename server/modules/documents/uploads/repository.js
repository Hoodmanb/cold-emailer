const fileStore = require('../../../utils/fileStore');

const FILE = 'uploads.json';

function listUploads(userId) {
  if (!userId) return [];
  return fileStore.read(FILE, userId).map((u) => ({ ...u }));
}

function addUpload(meta) {
  if (!meta?.userId) throw new Error('userId is required');
  const userId = String(meta.userId);
  const current = fileStore.read(FILE, userId);
  const next = [...current, meta];
  fileStore.write(FILE, next, userId);
  return meta;
}

function deleteUpload(id, userId) {
  if (!userId) return false;
  const current = fileStore.read(FILE, userId);
  const index = current.findIndex((d) => String(d.id) === String(id));
  if (index === -1) return false;
  const [removed] = current.splice(index, 1);
  fileStore.write(FILE, current, userId);
  return removed;
}

function getUpload(id, userId) {
  if (userId) {
    const found = fileStore.read(FILE, userId).find((u) => String(u.id) === String(id));
    return found ? { ...found } : null;
  }
  const { safeRead } = require('../../../db/jsonDb');
  const raw = safeRead(FILE, { __scoped: true, users: {} });
  const users = raw.users && typeof raw.users === 'object' ? raw.users : {};
  for (const uid of Object.keys(users)) {
    const rows = Array.isArray(users[uid]) ? users[uid] : [];
    const found = rows.find((u) => String(u.id) === String(id));
    if (found) return { ...found };
  }
  return null;
}

module.exports = { listUploads, addUpload, deleteUpload, getUpload };
