const smtpRepo = require('../repositories/smtpRepository');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const { sanitizeSmtp } = require('../utils/sanitizeSmtp');
const { requireUserId } = require('../utils/requireUserId');

const listSmtps = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const smtps = await smtpRepo.getAllSmtps(userId);
    const safeSmtps = smtps.map(sanitizeSmtp);
    return res.status(200).json({ success: true, message: 'retrieved successfully', data: safeSmtps });
  } catch (err) {
    next(err);
  }
};

const createSmtp = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { email, host, port, secure, appPassword, isDefault } = req.body;

    if (!email || !host || !port || !appPassword) {
      return res.status(400).json({ success: false, message: 'email, host, port, and appPassword are required' });
    }

    const existing = await smtpRepo.getSmtpByEmail(email, userId);
    if (existing) {
      return res.status(400).json({ success: false, message: 'SMTP email already exists' });
    }

    const newSmtp = await smtpRepo.createSmtp({
      email: String(email).trim().toLowerCase(),
      host: String(host).trim(),
      port: Number(port),
      secure: !!secure,
      appPassword: String(appPassword),
      status: 'pending',
      isDefault: !!isDefault
    }, userId);

    return res.status(201).json({ success: true, message: 'SMTP config created', data: sanitizeSmtp(newSmtp) });
  } catch (err) {
    next(err);
  }
};

const updateSmtp = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { id } = req.params;
    const { email, host, port, secure, appPassword, isDefault } = req.body;

    const existing = await smtpRepo.getSmtpById(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'SMTP config not found' });
    }

    if (email && email !== existing.email) {
      const emailCheck = await smtpRepo.getSmtpByEmail(email, userId);
      if (emailCheck) {
        return res.status(400).json({ success: false, message: 'SMTP email already exists' });
      }
    }

    const updates = {
      secure: !!secure,
      isDefault: !!isDefault,
      ...(email !== undefined ? { email: String(email).trim().toLowerCase() } : {}),
      ...(host !== undefined ? { host: String(host).trim() } : {}),
      ...(port !== undefined ? { port: Number(port) } : {}),
    };

    if (appPassword) {
      updates.appPassword = String(appPassword);
      updates.status = 'pending';
    }

    const updatedSmtp = await smtpRepo.updateSmtp(id, updates, userId);
    return res.status(200).json({ success: true, message: 'SMTP config updated', data: sanitizeSmtp(updatedSmtp) });
  } catch (err) {
    next(err);
  }
};

const deleteSmtp = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { id } = req.params;
    const existing = await smtpRepo.getSmtpById(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'SMTP config not found' });
    }

    await smtpRepo.deleteSmtp(id, userId);
    return res.status(200).json({ success: true, message: 'SMTP config deleted' });
  } catch (err) {
    next(err);
  }
};

const verifySmtp = async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { id } = req.params;
    let mode = req.body?.mode;
    if (mode == null) {
      mode = 'deep';
    }
    if (mode !== 'quick' && mode !== 'deep') {
      return res.status(400).json({ success: false, message: 'mode must be "quick" or "deep"' });
    }

    const smtp = await smtpRepo.getSmtpById(id, userId);

    if (!smtp) {
      return res.status(404).json({ success: false, message: 'SMTP config not found' });
    }

    const decryptedPassword = smtpRepo.getDecryptedPassword(smtp);
    if (!decryptedPassword) {
      return res.status(400).json({
        success: false,
        message: 'SMTP credentials are missing or corrupted. Re-save the app password and retry verification.',
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465 ? true : (smtp.port === 587 || smtp.port === 25 ? false : smtp.secure),
      auth: {
        user: smtp.email,
        pass: decryptedPassword,
      },
      connectionTimeout: 5000, // 5 seconds timeout
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });

    const now = new Date().toISOString();
    const persistResult = async (status) => {
      await smtpRepo.updateSmtp(id, {
        status,
        lastVerifiedAt: now,
        lastVerificationMode: mode,
      }, userId);
      return smtpRepo.getSmtpById(id, userId);
    };

    try {
      if (mode === 'quick') {
        await transporter.verify();
      } else {
        await transporter.sendMail({
          from: smtp.email,
          to: smtp.email,
          subject: 'SMTP Deep Verification - Career Automation',
          text: `Deep verification at ${now}`,
        });
      }

      const updated = await persistResult('verified');
      return res.status(200).json({
        success: true,
        message: mode === 'quick'
          ? 'Quick verify succeeded (connection check).'
          : 'Deep verify succeeded (test email sent).',
        data: sanitizeSmtp(updated),
      });
    } catch (verifyError) {
      const updated = await persistResult('failed');
      logger.error('SMTP Verification Failed:', { error: verifyError.message, mode });
      return res.status(400).json({
        success: false,
        message: 'Verification failed',
        error: verifyError.message,
        data: sanitizeSmtp(updated),
      });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listSmtps,
  createSmtp,
  updateSmtp,
  deleteSmtp,
  verifySmtp
};
