const Supabase = require('../services/supabaseService');

const TABLE_NAME = 'chats';

// Helper to fetch the chat store for a user (object with sessions array)
async function readChatStore(userId) {
  const { data, error } = await Supabase.select(TABLE_NAME, { user_id: userId });
  if (error) throw error;
  // Expect a single row per user containing a JSON column `sessions`
  const raw = data && data.length ? data[0] : {};
  const sessions = Array.isArray(raw.sessions) ? raw.sessions : [];
  return { sessions: sessions.filter((s) => s && typeof s === 'object') };
}

// Persist the updated chat store for a user
async function writeChatStore(store, userId) {
  // Upsert: if a row exists, update its `sessions`; otherwise insert a new row
  const { data: existing, error: selErr } = await Supabase.select(TABLE_NAME, { user_id: userId });
  if (selErr) throw selErr;
  if (existing && existing.length) {
    await Supabase.update(TABLE_NAME, { user_id: userId }, { sessions: store.sessions });
  } else {
    await Supabase.insert(TABLE_NAME, { user_id: userId, sessions: store.sessions });
  }
}

function getOrCreateSession(sessionId, userId) {
  const now = new Date().toISOString();
  const id = String(sessionId || '').trim() || require('uuid').v4();
  return readChatStore(userId).then((store) => {
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
    return writeChatStore(store, userId).then(() => next);
  });
}

async function getLatestSession(userId) {
  const store = await readChatStore(userId);
  if (!store.sessions.length) return null;
  const sorted = [...store.sessions].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return sorted[0] || null;
}

async function listSessionMessages(sessionId, userId) {
  const store = await readChatStore(userId);
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

async function appendMessages(sessionId, messages, userId) {
  if (!Array.isArray(messages) || !messages.length) return [];
  const store = await readChatStore(userId);
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
      id: String(row?.id || '').trim() || require('uuid').v4(),
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
  await writeChatStore(store, userId);
  return inserted;
}

module.exports = {
  getOrCreateSession,
  getLatestSession,
  listSessionMessages,
  appendMessages,
};
