const express = require('express');
const router = express.Router();

const { handleValidationErrors } = require('../utils/validation');
const MessageController = require('../controller/messageController');
const { body } = require('express-validator');
const { accessKey } = require('../middleware/accessKey');

router.use(accessKey); // Middleware Access Key

router.post('/', [
    body('code').optional().if(body('code').exists()).isNumeric().withMessage('Field code dalam data harus berupa angka.'),

    body('message').notEmpty().withMessage('Field message dalam data tidak boleh kosong.'),

    body('detail').optional(),

], handleValidationErrors, MessageController.sendMessage);

module.exports = router;
