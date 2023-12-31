const express = require('express');
const cors = require('cors')
const app = express();
const router = require('./routes');
const bot = require('./utils/telegramBotConfig');

bot.setWebHook(`${process.env.APP_URL}/api/webhook`);

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Selamat data di Tebot Apis').status(200);
});

app.use('/api', router);

module.exports = app;
