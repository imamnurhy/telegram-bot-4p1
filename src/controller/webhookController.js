// https://github.com/yagop/node-telegram-bot-api/issues/319#issuecomment-324963294
process.env.NTBA_FIX_319 = 'test';

const { encodeWithSecretKey } = require('../utils/crypto');
const bot = require('../utils/telegramBotConfig');

const subscribeMessage = async (id, chatType = 'private') => {
    const textMessage = '🎉 <b>Halo! Selamat datang di Telegram Notify Bot API</b> 🤖\n\n' +
        `• <b>Chat ID Anda:</b> <code>${id}</code>\n` +
        `• <b>Tipe Chat:</b> <code>${chatType}</code>\n\n` +
        'Silakan klik tombol di bawah untuk mendapatkan <b>Access Key</b> terenkripsi Anda:';

    await bot.sendMessage(id, textMessage, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🔑 Request Access Key', callback_data: 'request' },
                    { text: '🆔 Cek Chat ID Saja', callback_data: 'get_chat_id' }
                ],
            ]
        }
    });
};

const WebhookController = {
    handleWebhook: async (req, res) => {
        // Validasi opsional Telegram Secret Token jika diatur di .env
        const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
        if (secretToken) {
            const incomingToken = req.headers['x-telegram-bot-api-secret-token'];
            if (incomingToken !== secretToken) {
                console.warn('Unauthorized webhook request rejected (secret token mismatch)');
                return res.status(401).send('Unauthorized');
            }
        }

        try {
            const body = req.body;

            if (body && body.message) {
                const { chat: { id, type }, text } = body.message;

                if (text) {
                    const cleanText = text.trim();

                    // Perintah /id atau /chatid (Langsung tampilkan Chat ID)
                    if (/^\/(id|chatid)(\s|$)/i.test(cleanText)) {
                        await bot.sendMessage(id, `🆔 <b>Chat ID Anda:</b> <code>${id}</code>`, {
                            parse_mode: 'HTML'
                        });
                        return res.status(200).send('OK');
                    }

                    // Perintah /start subscribe atau /subscribe
                    const startCommand = (command) => /\/start/.test(command);
                    const match = cleanText.match(/\/start (.+)/i);
                    if (startCommand(cleanText)) {
                        if (match && match[1].toLowerCase() === 'subscribe') {
                            await subscribeMessage(id, type);
                        } else {
                            await bot.sendMessage(id, `Hola 👋🏻\n\nGunakan perintah:\n• <code>/subscribe</code> - Mendaftarkan notifikasi & ambil API Key\n• <code>/id</code> - Melihat Chat ID ini`, {
                                parse_mode: 'HTML'
                            });
                        }
                    } else if (/\/subscribe/i.test(cleanText)) {
                        await subscribeMessage(id, type);
                    }
                }
            }

            if (body && body.callback_query) {
                const { message: { chat: { id }, message_id }, data } = body.callback_query;

                switch (data) {
                    case 'request': {
                        const accessKey = encodeWithSecretKey(id);
                        let textMessage = '✅ <b>Akses Key Berhasil Dibuat:</b>\n\n' +
                            `• <b>Chat ID:</b> <code>${id}</code>\n` +
                            `• <b>x-api-key:</b>\n<pre>${accessKey}</pre>\n\n` +
                            '<i>Salin x-api-key di atas dan gunakan pada header HTTP request Anda.</i>';

                        await bot.sendMessage(id, textMessage, {
                            parse_mode: 'HTML'
                        }).then(async (sentMessage) => {
                            await bot.deleteMessage(sentMessage.chat.id, message_id);
                        }).catch(error => {
                            console.error('Error callback query:', error);
                        });
                        break;
                    }

                    case 'get_chat_id': {
                        await bot.sendMessage(id, `🆔 <b>Chat ID:</b> <code>${id}</code>`, {
                            parse_mode: 'HTML'
                        });
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('Error handling webhook:', error);
        }

        return res.status(200).send('OK');
    }
};

module.exports = WebhookController;
