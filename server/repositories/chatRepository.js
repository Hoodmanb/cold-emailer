const { v4: uuidv4 } = require('uuid');
const fileStore = require('../utils/fileStore');

const FILE = 'chats.json';

function readChatStore(userId) {
  const raw = fileStore.read(FILE, userId);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const sessions = Array.isArray(raw.sessions) ? raw.sessions : [];
    return { sessions: sessions.filter((s) => s && typeof s === 'object') };
  }
  return { sessions: [] };
}

function writeChatStore(data, userId) {
  return fileStore.write(FILE, data, userId);
}

function getOrCreateSession(sessionId, userId) {
  const now = new Date().toISOString();
  const id = String(sessionId || '').trim() || uuidv4();
  const store = readChatStore(userId);
  const existing = store.sessions.find((s) => s.id === id);
  if (existing) return existing;
  const ownerId = String(userId || '');
  const next = {
    id,
    userId: ownerId,
    createdBy: ownerId,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  store.sessions.push(next);
  writeChatStore(store, userId);
  return next;
}

function getLatestSession(userId) {
  const store = readChatStore(userId);
  if (!store.sessions.length) return null;
  return (
    [...store.sessions].sort((a, b) =>
      String(b.updatedAt).localeCompare(String(a.updatedAt)),
    )[0] || null
  );
}

function listSessionMessages(sessionId, userId) {
  const store = readChatStore(userId);
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return [];
  return Array.isArray(session.messages)
    ? session.messages.map((m) => ({
        id: m.id,
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || ''),
        createdAt: m.createdAt || new Date().toISOString(),
      }))
    : [];
}

function appendMessages(sessionId, messages, userId) {
  if (!Array.isArray(messages) || !messages.length) return [];
  const store = readChatStore(userId);
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return [];
  if (!Array.isArray(session.messages)) session.messages = [];
  const inserted = [];
  const now = new Date().toISOString();
  const ownerId = String(userId || '');

  for (const row of messages) {
    const content = String(row?.content || '').trim();
    if (!content) continue;
    const next = {
      id: String(row?.id || '').trim() || uuidv4(),
      userId: ownerId,
      createdBy: ownerId,
      role: row?.role === 'assistant' ? 'assistant' : 'user',
      content,
      createdAt: String(row?.createdAt || '').trim() || now,
    };
    session.messages.push(next);
    inserted.push(next);
  }
  session.updatedAt = now;
  writeChatStore(store, userId);
  return inserted;
}

module.exports = {
  getOrCreateSession,
  getLatestSession,
  listSessionMessages,
  appendMessages,
};
