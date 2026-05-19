const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aiSettingsController');

router.get('/ai', ctrl.getAISettingsHandler);
router.put('/ai/keys', ctrl.upsertAIKeyHandler);
router.delete('/ai/keys/:provider', ctrl.deleteAIKeyHandler);
router.put('/ai/feature-map', ctrl.updateFeatureMapHandler);
router.patch('/ai/feature-config/:featureId', ctrl.updateFeatureConfigHandler);
router.get('/ai/models', ctrl.getModelsHandler);
router.post('/ai/feature-generate', ctrl.featureGenerateHandler);
router.post('/ai/chat', ctrl.chatHandler);
router.get('/ai/chat/latest', ctrl.getLatestChatSessionHandler);
router.get('/ai/chat/:sessionId', ctrl.getChatSessionHandler);

module.exports = router;
