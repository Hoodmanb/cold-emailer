const smtpRepo = require('../repositories/smtpRepository');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const { sanitizeSmtp } = require('../utils/sanitizeSmtp');

const listSmtps = (req, res, next) => {
  try {
    const smtps = smtpRepo.getAllSmtps();
    const safeSmtps = smtps.map(sanitizeSmtp);
    return res.status(200).json({ success: true, message: 'retrieved successfully', data: safeSmtps });
  } catch (err) {
    next(err);
  }
};

const createSmtp = (req, res, next) => {
  try {
    const { email, host, port, secure, appPassword, isDefault } = req.body;

    if (!email || !host || !port || !appPassword) {
      return res.status(400).json({ success: false, message: 'email, host, port, and appPassword are required' });
    }

    const existing = smtpRepo.getSmtpByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'SMTP email already exists' });
    }

    const newSmtp = smtpRepo.createSmtp({
      email: String(email).trim().toLowerCase(),
      host: String(host).trim(),
      port: Number(port),
      secure: !!secure,
      appPassword: String(appPassword),
      status: 'pending',
      isDefault: !!isDefault
    });

    return res.status(201).json({ success: true, message: 'SMTP config created', data: sanitizeSmtp(newSmtp) });
  } catch (err) {
    next(err);
  }
};

const updateSmtp = (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, host, port, secure, appPassword, isDefault } = req.body;

    const existing = smtpRepo.getSmtpById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'SMTP config not found' });
    }

    if (email && email !== existing.email) {
      const emailCheck = smtpRepo.getSmtpByEmail(email);
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
      updates.status = 'pending'; // Require re-verification if password changes
    }

    const updatedSmtp = smtpRepo.updateSmtp(id, updates);
    return res.status(200).json({ success: true, message: 'SMTP config updated', data: sanitizeSmtp(updatedSmtp) });
  } catch (err) {
    next(err);
  }
};

const deleteSmtp = (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = smtpRepo.getSmtpById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'SMTP config not found' });
    }
    
    // Prevent deleting the default SMTP if there are others, or maybe handle it safely.
    // For now, just delete.
    smtpRepo.deleteSmtp(id);
    return res.status(200).json({ success: true, message: 'SMTP config deleted' });
  } catch (err) {
    next(err);
  }
};

const verifySmtp = async (req, res, next) => {
  try {
    const { id } = req.params;
    let mode = req.body?.mode;
    if (mode == null) {
      mode = 'deep';
    }
    if (mode !== 'quick' && mode !== 'deep') {
      return res.status(400).json({ success: false, message: 'mode must be "quick" or "deep"' });
    }

    const smtp = smtpRepo.getSmtpById(id);

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
      secure: smtp.secure,
      auth: {
        user: smtp.email,
        pass: decryptedPassword,
      },
    });

    const now = new Date().toISOString();
    const persistResult = (status) => {
      smtpRepo.updateSmtp(id, {
        status,
        lastVerifiedAt: now,
        lastVerificationMode: mode,
      });
      return smtpRepo.getSmtpById(id);
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

      const updated = persistResult('verified');
      return res.status(200).json({
        success: true,
        message: mode === 'quick'
          ? 'Quick verify succeeded (connection check).'
          : 'Deep verify succeeded (test email sent).',
        data: sanitizeSmtp(updated),
      });
    } catch (verifyError) {
      const updated = persistResult('failed');
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
