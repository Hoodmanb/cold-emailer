const { v4: uuidv4 } = require('uuid');
const Supabase = require('../services/supabaseService');

const TABLE = 'feedback';
const META_PREFIX = '__FEEDBACK_META__:';

function encodeComment(data) {
  const message = String(data.message || '').trim();
  const meta = {
    userEmail: String(data.userEmail || '').trim().toLowerCase(),
    userName: String(data.userName || '').trim(),
    subject: String(data.subject || '').trim(),
    category: String(data.category || '').trim(),
    message,
    pageUrl: data.pageUrl ? String(data.pageUrl).trim() : null,
    browserInfo: data.browserInfo ? String(data.browserInfo).trim() : null,
    status: data.status || 'New',
  };
  return `${META_PREFIX}${JSON.stringify(meta)}`;
}

function decodeComment(comment) {
  const raw = String(comment || '');
  if (!raw.startsWith(META_PREFIX)) {
    return {
      subject: raw,
      message: raw,
      category: '',
      userEmail: '',
      userName: '',
      pageUrl: null,
      browserInfo: null,
      status: 'New',
    };
  }
  try {
    const parsed = JSON.parse(raw.slice(META_PREFIX.length));
    return {
      userEmail: parsed.userEmail || '',
      userName: parsed.userName || '',
      subject: parsed.subject || parsed.message || '',
      category: parsed.category || '',
      message: parsed.message || '',
      pageUrl: parsed.pageUrl || null,
      browserInfo: parsed.browserInfo || null,
      status: parsed.status || 'New',
    };
  } catch (_err) {
    return {
      subject: raw,
      message: raw,
      category: '',
      userEmail: '',
      userName: '',
      pageUrl: null,
      browserInfo: null,
      status: 'New',
    };
  }
}

function fromRow(row) {
  if (!row) return null;
  const meta = decodeComment(row.comment);
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: meta.userEmail,
    userName: meta.userName,
    timestamp: row.created_at,
    subject: meta.subject,
    category: meta.category,
    message: meta.message,
    pageUrl: meta.pageUrl,
    browserInfo: meta.browserInfo,
    status: meta.status,
    rating: row.rating,
  };
}

const getAllFeedback = async () => {
  const { data, error } = await Supabase.selectAll(TABLE);
  if (error) throw error;
  return (data || []).map(fromRow);
};

const getFeedbackById = async (id) => {
  const { data, error } = await Supabase.selectOne(TABLE, { id });
  if (error) throw error;
  return fromRow(data);
};

const createFeedback = async (data) => {
  const userId = String(data.userId || '').trim();
  const row = {
    id: uuidv4(),
    user_id: userId,
    rating: data.rating || null,
    comment: encodeComment(data),
    created_at: data.timestamp || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data: inserted, error } = await Supabase.insert(TABLE, row, userId);
  if (error) throw error;
  return fromRow(inserted?.[0] || row);
};

const updateFeedbackStatus = async (id, status) => {
  const current = await getFeedbackById(id);
  if (!current) return null;
  const nextComment = encodeComment({ ...current, status });
  const { data, error } = await Supabase.update(
    TABLE,
    { id },
    { comment: nextComment, updated_at: new Date().toISOString() },
  );
  if (error) throw error;
  return fromRow(data[0]);
};

module.exports = {
  getAllFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedbackStatus,
};
