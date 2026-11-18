const { decodeWithSecretKey } = require("../utils/crypto");

const accessKey = async function (req, res, next) {
    const apiKey = req.header('x-api-key');

    // Mendukung juga jika pengguna langsung mengirim chat-id via header atau query param
    const directChatId = req.header('x-chat-id') || req.query.chat_id;

    if (!apiKey && !directChatId) {
        return res.status(401).json({ status: 0, message: 'Unauthorized (x-api-key atau x-chat-id diperlukan)' });
    }

    try {
        if (apiKey) {
            const chatId = decodeWithSecretKey(apiKey);
            req.chatId = chatId;
        } else {
            req.chatId = directChatId;
        }
        next();
    } catch (error) {
        return res.status(401).json({ status: 0, message: 'Unauthorized: API Key tidak valid' });
    }
};

module.exports = { accessKey };
