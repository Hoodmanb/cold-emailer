const BaseRepository = require('../infrastructure/db/BaseRepository');
const FILENAME = "feedback.json";
const feedbackRepo = new BaseRepository(FILENAME);

const getAllFeedback = () => {
  const raw = feedbackRepo.readAll();
  if (!Array.isArray(raw)) return [];
  return raw.filter((f) => f && typeof f === "object");
};

const getFeedbackById = (id) => {
  const all = getAllFeedback();
  return all.find((f) => String(f.id) === String(id)) || null;
};

const createFeedback = (data) => {
  const newFeedback = {
    userId: String(data.userId || "").trim(),
    userEmail: String(data.userEmail || "").trim().toLowerCase(),
    userName: String(data.userName || "").trim(),
    timestamp: data.timestamp || new Date().toISOString(),
    subject: String(data.subject || "").trim(),
    category: String(data.category || "").trim(),
    message: String(data.message || "").trim(),
    pageUrl: data.pageUrl ? String(data.pageUrl).trim() : null,
    browserInfo: data.browserInfo ? String(data.browserInfo).trim() : null,
    status: data.status || "New",
  };
  return feedbackRepo.create(newFeedback);
};

const updateFeedbackStatus = (id, status) => {
  return feedbackRepo.update(id, { status });
};

module.exports = {
  getAllFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedbackStatus,
};
