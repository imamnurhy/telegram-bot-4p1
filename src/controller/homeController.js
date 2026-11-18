const fs = require('fs');
const path = require('path');

// Cache template di memory agar tidak I/O berulang kali
let cachedHtml = null;

const HomeController = {
    renderHome: (req, res) => {
        const isVercel = Boolean(process.env.VERCEL);

        // Jika request meminta JSON (misal dari cURL / API client)
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(200).json({
                name: 'Telegram Notify Log Bot API',
                environment: isVercel ? 'vercel-serverless' : 'server-node',
                status: 'online',
                endpoints: {
                    message: 'POST /api/message',
                    health: 'GET /api/health',
                    validate: 'GET /api/validate',
                    generate_key: 'POST /api/generate-key',
                    webhook: 'POST /api/webhook'
                }
            });
        }

        try {
            if (!cachedHtml) {
                const templatePath = path.join(__dirname, '../views/index.html');
                cachedHtml = fs.readFileSync(templatePath, 'utf-8');
            }

            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const environment = isVercel ? '⚡ Vercel Serverless' : '🖥️ Node.js Standalone';
            const timezone = process.env.TIMEZONE || 'Asia/Jakarta';

            const rendered = cachedHtml
                .replace(/{{ENVIRONMENT}}/g, environment)
                .replace(/{{TIMEZONE}}/g, timezone)
                .replace(/{{BASE_URL}}/g, baseUrl);

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(rendered);
        } catch (error) {
            console.error('Error rendering home view:', error);
            return res.status(200).json({
                name: 'Telegram Notify Log Bot API',
                status: 'running'
            });
        }
    }
};

module.exports = HomeController;
