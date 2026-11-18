const rateLimitStore = new Map();

/**
 * In-memory rate limiter ringan tanpa dependensi eksternal.
 * @param {Object} options
 * @param {number} options.windowMs - Jendela waktu dalam milidetik (contoh: 60000 = 1 menit)
 * @param {number} options.max - Maksimal request per jendela waktu
 * @param {string} options.message - Pesan error jika melampaui batas
 */
const apiRateLimiter = (options = {}) => {
    const windowMs = options.windowMs || 60 * 1000;
    const max = options.max || 60; // default 60 req / menit
    const message = options.message || 'Terlalu banyak permintaan, silakan coba lagi beberapa saat.';

    // Bersihkan data lama secara periodik tiap 5 menit
    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of rateLimitStore.entries()) {
            if (now > value.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }, 5 * 60 * 1000).unref();

    return (req, res, next) => {
        // Identifikasi klien berdasarkan x-api-key jika ada, atau fallback ke IP
        const clientKey = req.header('x-api-key') || req.ip || req.connection.remoteAddress;
        const now = Date.now();

        let record = rateLimitStore.get(clientKey);

        if (!record || now > record.resetTime) {
            record = {
                count: 1,
                resetTime: now + windowMs
            };
            rateLimitStore.set(clientKey, record);
        } else {
            record.count += 1;
        }

        const remaining = Math.max(0, max - record.count);
        const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', resetSeconds);

        if (record.count > max) {
            return res.status(429).json({
                status: 1,
                message,
                retry_after_seconds: resetSeconds
            });
        }

        next();
    };
};

module.exports = { apiRateLimiter };
