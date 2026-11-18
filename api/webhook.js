const WebhookController = require('../src/controller/webhookController');

module.exports = async (req, res) => {
    return WebhookController.handleWebhook(req, res);
};
