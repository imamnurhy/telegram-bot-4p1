const express = require('express');
const cors = require('cors');
const app = express();
const router = require('./routes');
const bot = require('./utils/telegramBotConfig');
const HomeController = require('./controller/homeController');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Safe Webhook Setup:
// Di Vercel Serverless (process.env.VERCEL terdefinisi), setup webhook otomatis sebaiknya dihindari saat cold start
// karena fungsi serverless bersifat ephemeral dan memicu overhead latensi / API call ke Telegram di setiap cold boot.
const isVercel = Boolean(process.env.VERCEL);

if (!isVercel && process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
    const webhookOptions = {};
    if (process.env.TELEGRAM_WEBHOOK_SECRET) {
        webhookOptions.secret_token = process.env.TELEGRAM_WEBHOOK_SECRET;
    }
    bot.setWebHook(`${process.env.APP_URL}/api/webhook`, webhookOptions)
        .then(() => console.log(`[Telegram] Webhook successfully set to ${process.env.APP_URL}/api/webhook`))
        .catch((err) => console.error('[Telegram] Failed to set webhook:', err.message));
} else if (isVercel) {
    console.log('[Telegram] Running on Vercel Serverless environment. Automatic setWebHook skipped during boot.');
} else {
    console.warn('[Telegram] APP_URL not configured. Webhook registration skipped.');
}

// Default Timezone
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(process.env.TIMEZONE || 'Asia/Jakarta');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Halaman Beranda (Landing Page & Testing UI via HomeController)
app.get('/', HomeController.renderHome);

app.use('/api', router);

module.exports = app;
