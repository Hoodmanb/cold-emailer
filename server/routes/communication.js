const express = require('express');
const commSettingsRepo = require('../repositories/communicationSettingsRepository');

const router = express.Router();

router.get('/public', async (req, res) => {
  try {
    const settings = await commSettingsRepo.getSettings();
    const publicSettings = {};

    // Only expose enabled settings
    if (settings.whatsapp && settings.whatsapp.enabled) {
      publicSettings.whatsapp = settings.whatsapp;
    }
    if (settings.instagram && settings.instagram.enabled) {
      publicSettings.instagram = settings.instagram;
    }
    if (settings.twitter && settings.twitter.enabled) {
      publicSettings.twitter = settings.twitter;
    }
    if (settings.supportEmail && settings.supportEmail.enabled) {
      publicSettings.supportEmail = settings.supportEmail;
    }

    return res.status(200).json({
      success: true,
      message: 'retrieved successfully',
      data: publicSettings
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + err.message
    });
  }
});

module.exports = router;
