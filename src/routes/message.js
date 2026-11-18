const express = require('express');
const router = express.Router();

const { handleValidationErrors } = require('../utils/validation');
const MessageController = require('../controller/messageController');
const { body } = require('express-validator');
const { accessKey } = require('../middleware/accessKey');
const { apiRateLimiter } = require('../middleware/rateLimiter');

// Rate limiting: maks 60 request per menit per API key / IP
router.use(apiRateLimiter({ windowMs: 60 * 1000, max: 60 }));
router.use(accessKey); // Middleware Access Key

router.post('/', [
    body('code').optional().if(body('code').exists()).isNumeric().withMessage('Field code dalam data harus berupa angka.'),
    body('message').notEmpty().withMessage('Field message dalam data tidak boleh kosong.'),
    body('title').optional().isString().withMessage('Field title harus berupa teks.'),
    body('detail').optional(),
    body('datetime').optional().isISO8601().withMessage('Field datetime harus berformat tanggal ISO 8601 yang valid.'),
    body('style').optional().isIn(['card', 'custom', 'minimalist', 'compact']).withMessage('Style harus berupa card, custom, minimalist, atau compact.'),
    body('thread_id').optional().isNumeric().withMessage('Field thread_id harus berupa angka.'),
    body('message_thread_id').optional().isNumeric().withMessage('Field message_thread_id harus berupa angka.'),
    body('silent').optional().isBoolean().withMessage('Field silent harus berupa boolean (true/false).'),
    body('disable_notification').optional().isBoolean().withMessage('Field disable_notification harus berupa boolean (true/false).'),
], handleValidationErrors, MessageController.sendMessage);

module.exports = router;
