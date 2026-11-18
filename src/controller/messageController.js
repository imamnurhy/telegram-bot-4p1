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

/**
 * Escapes HTML characters in raw text but preserves supported Telegram HTML tags.
 */
const escapeHTMLPreservingTags = (str) => {
    if (!str) return '';
    const tagRegex = /(<\/?(?:b|strong|i|em|u|ins|s|strike|del|span|a|code|pre)\b(?:\s+[a-zA-Z_:][a-zA-Z0-9_.:-]*\s*=\s*(?:'[^']*'|"[^"]*"|[^\s\/>]+))*\s*\/?>)/gi;
    const tokens = str.split(tagRegex);
    for (let i = 0; i < tokens.length; i++) {
        if (i % 2 === 0) {
            tokens[i] = escapeHTML(tokens[i]);
        }
    }
    return tokens.join('');
};

/**
 * Gets the status emoji based on HTTP code.
 */
const getStatusEmoji = (code) => {
    if (!code) return '🔔';
    if (code >= 500) return '🔴';
    if (code >= 400) return '⚠️';
    if (code >= 200 && code < 300) return '✅';
    return 'ℹ️';
};

/**
 * Gets the status reason text.
 */
const getStatusText = (code) => {
    if (!code) return '';
    try {
        return httpStatus.getReasonPhrase(code);
    } catch (e) {
        return 'Status';
    }
};

/**
 * Processes log details to check for max length limits and format JSON.
 */
const processDetail = (detail) => {
    let detailFileBuffer = null;
    let detailFileName = 'detail.txt';
    let detailContentType = 'text/plain';
    let formattedDetail = '';

    if (!detail) {
        return { detailFileBuffer, detailFileName, detailContentType, formattedDetail };
    }

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

    return { detailFileBuffer, detailFileName, detailContentType, formattedDetail };
};

/**
 * Registry of available message style formatters.
 */
const MessageFormatters = {
    minimalist: ({ statusEmoji, escapedTitle, message, code, statusText, eventTime, detail, detailFileBuffer, formattedDetail }) => {
        let text = `${statusEmoji} <b>${escapedTitle}</b>\n`;
        text += '──────────────────────\n';
        if (message) {
            text += `• <b>Masalah:</b> ${escapeHTMLPreservingTags(message)}\n`;
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
        return text;
    },

    compact: ({ statusEmoji, escapedTitle, message, code, eventTime, detail, detailFileBuffer, formattedDetail }) => {
        let text = `${statusEmoji} <b>${escapedTitle}</b>`;
        if (code) {
            text += ` <code>[${code}]</code>`;
        }
        text += '\n';
        if (message) {
            text += `↳ <code>${escapeHTMLPreservingTags(message)}</code>\n`;
        }
        text += `🕒 <code>${eventTime.format('DD MMM, HH:mm:ss')}</code>`;
        if (detail) {
            if (detailFileBuffer) {
                text += ` | 📝 <i>Detail terlampir</i>`;
            } else {
                text += `\n📝 <b>Detail:</b> <pre>${escapeHTML(formattedDetail)}</pre>`;
            }
        }
        return text;
    },

    custom: ({ escapedTitle, code, message, detail, detailFileBuffer, formattedDetail, datetime, eventTime }) => {
        let text = `<b>${escapedTitle}</b>`;

        if (code) {
            text += ' | ';
            try {
                text += '<b>' + httpStatus.getReasonPhrase(code) + '</b>\n\n';
            } catch (e) {
                text += '<b>Status</b>\n\n';
            }
        } else {
            text += '\n\n';
        }

        if (detail) {
            if (message) {
                text += `${escapeHTMLPreservingTags(message)}\n\n`;
            }
            if (detailFileBuffer) {
                text += `📝 <b>Detail Log:</b> <i>(Terlampir sebagai file dokumen)</i>\n`;
            } else {
                text += `<b>Detail</b>↓\n`;
                text += `<pre><code class="language-json">${escapeHTML(formattedDetail)}</code></pre>\n`;
            }
        } else {
            if (message) {
                text += `${escapeHTMLPreservingTags(message)}\n`;
            }
        }

        if (datetime || code) {
            text += '\n<b>Keterangan</b>\n';
            if (datetime) {
                text += '・Tanggal ' + eventTime.format('DD MMMM YYYY') + '\n';
                text += '・Waktu ' + eventTime.format('HH:mm:ss') + '\n';
            }

            if (code) {
                let emoticon = '';
                if (code >= 400 && code <= 511) emoticon = '❗';
                text += '・Status ' + `${code}` + `${emoticon}`;
            }
        }
        return text;
    }
};

// Aliaskan 'card' ke 'custom' untuk backward-compatibility dokumentasi
MessageFormatters.card = MessageFormatters.custom;

const MessageController = {
    sendMessage: async (req, res) => {
        const {
            message,
            code,
            title,
            detail,
            datetime,
            style = null,
            thread_id,
            message_thread_id,
            silent = false,
            disable_notification = false
        } = req.body;

        const statusEmoji = getStatusEmoji(code);
        const statusText = getStatusText(code);

        // Pretty print and format Detail (if exists)
        const { detailFileBuffer, detailFileName, detailContentType, formattedDetail } = processDetail(detail);

        const tz = process.env.TIMEZONE || 'Asia/Jakarta';
        const eventTime = datetime ? dayjs(datetime).tz(tz) : dayjs().tz(tz);
        const escapedTitle = escapeHTML(title ? title.toUpperCase() : 'NOTIFICATION');

        const formatter = MessageFormatters[style] || MessageFormatters.custom;
        const text = formatter({
            statusEmoji,
            escapedTitle,
            message,
            code,
            statusText,
            eventTime,
            detail,
            detailFileBuffer,
            formattedDetail,
            datetime
        });

        // Opsi pengiriman bot Telegram
        const messageOptions = {
            parse_mode: 'HTML',
            disable_notification: Boolean(silent || disable_notification)
        };

        const targetThreadId = thread_id || message_thread_id;
        if (targetThreadId) {
            messageOptions.message_thread_id = parseInt(targetThreadId, 10);
        }

        try {
            const chatId = req.chatId;

            // Send the main message first
            await bot.sendMessage(chatId, text, messageOptions);

            // If detail is too long, send it as an attached document
            if (detailFileBuffer) {
                const docOptions = {
                    caption: `📄 Detail Log untuk <b>${escapedTitle}</b>`,
                    parse_mode: 'HTML',
                    disable_notification: messageOptions.disable_notification
                };
                if (targetThreadId) {
                    docOptions.message_thread_id = messageOptions.message_thread_id;
                }

                await bot.sendDocument(chatId, detailFileBuffer, docOptions, {
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
                message: 'Terjadi kesalahan pengiriman Telegram',
                error: error.message || error
            });
        }
    }
};

module.exports = MessageController;
