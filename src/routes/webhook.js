const express = require('express');
const router = express.Router();
const WebhookController = require('../controller/webhookController');

router.post('/', WebhookController.handleWebhook);

module.exports = router;
