const feedbackRepo = require('../repositories/feedbackRepository');
const { sendFeedbackEmail } = require('../services/feedbackEmailService');

const submitFeedback = async (req, res, next) => {
  try {
    const { subject, category, message, pageUrl, browserInfo } = req.body;

    if (!subject || !category || !message) {
      return res.status(400).json({
        success: false,
        message: 'subject, category, and message are required'
      });
    }

    const categories = ['Bug Report', 'Feature Request', 'General Feedback', 'Account Issue', 'Other'];
    if (!categories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `category must be one of: ${categories.join(', ')}`
      });
    }

    const newFeedback = await feedbackRepo.createFeedback({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name || '',
      subject,
      category,
      message,
      pageUrl,
      browserInfo,
      status: 'New'
    });

    sendFeedbackEmail(newFeedback).catch((err) => {
      console.error('Async feedback email notification failed:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: newFeedback
    });
  } catch (err) {
    next(err);
  }
};

const listFeedbackAdmin = async (req, res, next) => {
  try {
    const { category, status, user, dateFrom, dateTo, search } = req.query;
    let list = await feedbackRepo.getAllFeedback();

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter((f) =>
        String(f.subject || '').toLowerCase().includes(q) ||
        String(f.message || '').toLowerCase().includes(q)
      );
    }

    if (category) {
      list = list.filter((f) => String(f.category).toLowerCase() === String(category).toLowerCase());
    }

    if (status) {
      list = list.filter((f) => String(f.status).toLowerCase() === String(status).toLowerCase());
    }

    if (user) {
      const u = String(user).toLowerCase();
      list = list.filter((f) =>
        String(f.userId || '').toLowerCase().includes(u) ||
        String(f.userEmail || '').toLowerCase().includes(u) ||
        String(f.userName || '').toLowerCase().includes(u)
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter((f) => new Date(f.timestamp).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime();
      list = list.filter((f) => new Date(f.timestamp).getTime() <= to);
    }

    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.status(200).json({
      success: true,
      message: 'retrieved successfully',
      data: list
    });
  } catch (err) {
    next(err);
  }
};

const updateFeedbackStatusAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statuses = ['New', 'In Review', 'Resolved', 'Closed'];
    if (!statuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${statuses.join(', ')}`
      });
    }

    const existing = await feedbackRepo.getFeedbackById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    const updated = await feedbackRepo.updateFeedbackStatus(id, status);
    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitFeedback,
  listFeedbackAdmin,
  updateFeedbackStatusAdmin,
};
