const adminSmtpRepo = require('../repositories/adminSmtpRepository');
const commSettingsRepo = require('../repositories/communicationSettingsRepository');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const sanitizeSmtp = (smtp) => {
  if (!smtp) return null;
  const { password, iv, ...safe } = smtp;
  return safe;
};

const getCommunicationSettings = async (req, res, next) => {
  try {
    const settings = await commSettingsRepo.getSettings();
    const smtps = await adminSmtpRepo.getAllAdminSmtps();
    return res.status(200).json({
      success: true,
      message: 'retrieved successfully',
      data: {
        settings,
        smtps: smtps.map(sanitizeSmtp),
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateCommunicationSettings = async (req, res, next) => {
  try {
    const { whatsapp, instagram, twitter, supportEmail } = req.body;
    const updates = {};
    
    if (whatsapp) updates.whatsapp = whatsapp;
    if (instagram) updates.instagram = instagram;
    if (twitter) updates.twitter = twitter;
    if (supportEmail) updates.supportEmail = supportEmail;

    const nextSettings = await commSettingsRepo.updateSettings(updates);
    return res.status(200).json({
      success: true,
      message: 'settings updated successfully',
      data: nextSettings
    });
  } catch (err) {
    next(err);
  }
};

const createSmtpProfile = async (req, res, next) => {
  try {
    const { name, host, port, username, password, secure, isActive } = req.body;

    if (!name || !host || !port || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, host, port, username, and password are required'
      });
    }

    const created = await adminSmtpRepo.createAdminSmtp({
      name,
      host,
      port: Number(port),
      username,
      password,
      secure: !!secure,
      isActive: !!isActive
    });

    return res.status(201).json({
      success: true,
      message: 'SMTP profile created successfully',
      data: sanitizeSmtp(created)
    });
  } catch (err) {
    next(err);
  }
};

const updateSmtpProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, host, port, username, password, secure, isActive } = req.body;

    const existing = await adminSmtpRepo.getAdminSmtpById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'SMTP profile not found' });
    }

    const updates = {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(host !== undefined ? { host: String(host).trim() } : {}),
      ...(port !== undefined ? { port: Number(port) } : {}),
      ...(username !== undefined ? { username: String(username).trim().toLowerCase() } : {}),
      ...(secure !== undefined ? { secure: !!secure } : {}),
      ...(isActive !== undefined ? { isActive: !!isActive } : {}),
    };

    if (password) {
      updates.password = String(password);
      updates.iv = null; // Re-encrypt on repository layer
    }

    const updated = await adminSmtpRepo.updateAdminSmtp(id, updates);
    return res.status(200).json({
      success: true,
      message: 'SMTP profile updated successfully',
      data: sanitizeSmtp(updated)
    });
  } catch (err) {
    next(err);
  }
};

const deleteSmtpProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await adminSmtpRepo.getAdminSmtpById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'SMTP profile not found' });
    }

    await adminSmtpRepo.deleteAdminSmtp(id);
    return res.status(200).json({ success: true, message: 'SMTP profile deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const testSmtpConnection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const smtp = await adminSmtpRepo.getAdminSmtpById(id);
    if (!smtp) {
      return res.status(404).json({ success: false, message: 'SMTP profile not found' });
    }

    const decryptedPassword = adminSmtpRepo.getDecryptedPassword(smtp);
    if (!decryptedPassword) {
      return res.status(400).json({ success: false, message: 'SMTP credentials could not be decrypted' });
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465 ? true : (smtp.port === 587 || smtp.port === 25 ? false : smtp.secure),
      auth: {
        user: smtp.username,
        pass: decryptedPassword,
      },
      connectionTimeout: 5000, // 5 seconds timeout
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });

    try {
      await transporter.verify();
      return res.status(200).json({
        success: true,
        message: 'SMTP connection verification succeeded!'
      });
    } catch (verifyError) {
      logger.error('Admin SMTP connection verification failed:', verifyError);
      return res.status(400).json({
        success: false,
        message: 'SMTP verification failed: ' + verifyError.message
      });
    }
  } catch (err) {
    next(err);
  }
};

const setActiveSmtpProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const smtp = await adminSmtpRepo.getAdminSmtpById(id);
    if (!smtp) {
      return res.status(404).json({ success: false, message: 'SMTP profile not found' });
    }

    await adminSmtpRepo.setActiveAdminSmtp(id);
    return res.status(200).json({
      success: true,
      message: 'SMTP profile set as active'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCommunicationSettings,
  updateCommunicationSettings,
  createSmtpProfile,
  updateSmtpProfile,
  deleteSmtpProfile,
  testSmtpConnection,
  setActiveSmtpProfile,
};
