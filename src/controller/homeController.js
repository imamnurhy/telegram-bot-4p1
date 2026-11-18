const fs = require('fs');
const path = require('path');

let cachedHtml = null;

const HomeController = {
    renderHome: (req, res) => {
        // Jika request meminta format JSON (misal dari script monitoring / bot probe)
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(200).json({
                status: 'operational'
            });
        }

        try {
            if (!cachedHtml) {
                const templatePath = path.join(__dirname, '../views/index.html');
                cachedHtml = fs.readFileSync(templatePath, 'utf-8');
            }

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(cachedHtml);
        } catch (error) {
            return res.status(200).send('Service Operational');
        }
    }
};

module.exports = HomeController;
