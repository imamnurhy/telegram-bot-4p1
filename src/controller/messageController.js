const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const bot = require("../utils/telegramBotConfig");
const httpStatus = require('http-status-codes');

// Load dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Escapes HTML special characters to prevent Telegram API parsing errors.
 */
const escapeHTML = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

const MessageController = {
    sendMessage: async (req, res) => {
        const { message, code, title, detail, datetime, style } = req.body;

        let statusEmoji = '🔔';
        let statusText = '';

        if (code) {
            try {
                statusText = httpStatus.getReasonPhrase(code);
            } catch (e) {
                statusText = 'Status';
            }

            if (code >= 500) {
                statusEmoji = '🔴';
            } else if (code >= 400) {
                statusEmoji = '⚠️';
            } else if (code >= 200 && code < 300) {
                statusEmoji = '✅';
            } else {
                statusEmoji = 'ℹ️';
            }
        }

        // Pretty print and format Detail (if exists)
        let detailFileBuffer = null;
        let detailFileName = 'detail.txt';
        let detailContentType = 'text/plain';
        let formattedDetail = '';

        if (detail) {
            formattedDetail = detail;
            let isJson = false;
            try {
                const parsed = typeof detail === 'string' ? JSON.parse(detail) : detail;
                formattedDetail = JSON.stringify(parsed, null, 2);
                isJson = true;
            } catch (e) {
                // Keep original string if not a valid JSON
            }

            const maxLength = parseInt(process.env.TELEGRAM_DETAIL_MAX_LENGTH, 10) || 1000;
            if (formattedDetail.length > maxLength) {
                detailFileBuffer = Buffer.from(formattedDetail, 'utf-8');
                detailFileName = isJson ? 'detail.json' : 'detail.txt';
                detailContentType = isJson ? 'application/json' : 'text/plain';
            }
        }

        const tz = process.env.TIMEZONE || 'Asia/Jakarta';
        const eventTime = datetime ? dayjs(datetime).tz(tz) : dayjs().tz(tz);
        const escapedTitle = escapeHTML(title ? title.toUpperCase() : 'NOTIFICATION');

        let text = '';
        const selectedStyle = style || 'card';

        if (selectedStyle === 'minimalist') {
            // Style 2: Modern Minimalist
            text = `${statusEmoji} <b>${escapedTitle}</b>\n`;
            text += '──────────────────────\n';
            if (message) {
                text += `• <b>Masalah:</b> ${escapeHTML(message)}\n`;
            }
            if (code) {
                text += `• <b>Kode:</b> <code>${code} (${statusText})</code>\n`;
            }
            text += `• <b>Waktu:</b> <code>${eventTime.format('DD MMM YYYY, HH:mm:ss')}</code>\n\n`;

            if (detail) {
                if (detailFileBuffer) {
                    text += `📝 <b>Detail:</b> <i>(Terlampir sebagai file dokumen)</i>\n\n`;
                } else {
                    text += `📝 <b>Detail:</b>\n`;
                    text += `<pre>${escapeHTML(formattedDetail)}</pre>\n\n`;
                }
            }
        } else if (selectedStyle === 'compact') {
            // Style 3: Compact Row
            text = `${statusEmoji} <b>${escapedTitle}</b>`;
            if (code) {
                text += ` <code>[${code}]</code>`;
            }
            text += '\n';
            if (message) {
                text += `↳ <code>${escapeHTML(message)}</code>\n`;
            }
            text += `🕒 <code>${eventTime.format('DD MMM, HH:mm:ss')}</code>`;
            if (detail) {
                if (detailFileBuffer) {
                    text += ` | 📝 <i>Detail terlampir</i>`;
                } else {
                    text += `\n📝 <b>Detail:</b> <pre>${escapeHTML(formattedDetail)}</pre>`;
                }
            }
        } else {
            // Style 1: Card Style (Default)
            text = `${statusEmoji} <b>${escapedTitle}</b>`;
            if (code) {
                text += ` [<code>${code}</code>]`;
            }
            text += '\n━━━━━━━━━━━━━━━━━━━━━━\n';

            if (message) {
                text += `<blockquote>${escapeHTML(message)}</blockquote>\n\n`;
            }

            if (detail) {
                if (detailFileBuffer) {
                    text += `📝 <b>Detail Log:</b> <i>(Terlampir sebagai file dokumen)</i>\n\n`;
                } else {
                    text += `📝 <b>Detail Log:</b>\n`;
                    text += `<pre>${escapeHTML(formattedDetail)}</pre>\n\n`;
                }
            }

            text += `📅 <b>Waktu:</b> <code>${eventTime.format('DD MMM YYYY, HH:mm:ss')} (${tz})</code>`;
            if (code) {
                text += `\n🏷️ <b>Status:</b> <code>${code} - ${statusText}</code>`;
            }
        }

        try {
            const chatId = req.chatId;
            // Send the main message first
            await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });

            // If detail is too long, send it as an attached document
            if (detailFileBuffer) {
                await bot.sendDocument(chatId, detailFileBuffer, {
                    caption: `📄 Detail Log untuk <b>${escapedTitle}</b>`,
                    parse_mode: 'HTML'
                }, {
                    filename: detailFileName,
                    contentType: detailContentType
                });
            }

            return res.status(200).json({
                status: 0,
                message: 'Pesan terkirim',
            });
        } catch (error) {
            console.error('Error sending Telegram message:', error);
            return res.status(500).json({
                status: 1,
                message: 'Terjadi kesalahan',
                error: error.message || error
            });
        }
    }
}

module.exports = MessageController;