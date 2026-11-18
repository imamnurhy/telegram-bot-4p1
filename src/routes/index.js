const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const { decodeWithSecretKey, encodeWithSecretKey } = require('../utils/crypto');

// Routes
router.use('/message', require('./message'));
router.use('/webhook', require('./webhook'));

// GET /api/health
router.get('/health', (req, res) => {
    const uptimeSeconds = Math.floor(process.uptime());
    return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: `${uptimeSeconds}s`,
        memory_usage: {
            rss_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
            heap_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        },
        timezone: process.env.TIMEZONE || 'Asia/Jakarta'
    });
});

// GET /api/validate (Validasi x-api-key dan tampilkan Chat ID asli)
router.get('/validate', (req, res) => {
    const apiKey = req.header('x-api-key');
    if (!apiKey) {
        return res.status(401).json({ status: 1, valid: false, message: 'Header x-api-key tidak ditemukan' });
    }

    try {
        const chatId = decodeWithSecretKey(apiKey);
        return res.status(200).json({
            status: 0,
            valid: true,
            chat_id: chatId,
            message: 'API Key valid'
        });
    } catch (e) {
        return res.status(401).json({ status: 1, valid: false, message: 'API Key tidak valid' });
    }
});

// POST /api/generate-key (Utilitas: Buat x-api-key dari Chat ID numerik)
router.post('/generate-key', (req, res) => {
    const { chat_id } = req.body;
    if (!chat_id) {
        return res.status(400).json({ status: 1, message: 'chat_id wajib diisi pada body' });
    }

    try {
        const key = encodeWithSecretKey(chat_id);
        return res.status(200).json({
            status: 0,
            chat_id: String(chat_id),
            access_key: key
        });
    } catch (e) {
        return res.status(500).json({ status: 1, message: e.message });
    }
});

module.exports = router;
