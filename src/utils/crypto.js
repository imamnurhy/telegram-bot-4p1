const crypto = require('crypto');

const secretKey = process.env.APP_KEY;
const secretIV = process.env.IV_SECRET;

/**
 * Enkripsi Chat ID menggunakan AES-256-CBC dengan Dynamic IV (16 bytes random per token).
 * Format output: <iv_hex>:<ciphertext_hex>
 */
const encodeWithSecretKey = (id) => {
    if (!secretKey) throw new Error('APP_KEY is not defined in environment variables');
    const algorithm = 'aes-256-cbc';
    const key = crypto.createHash('sha256').update(secretKey).digest();

    // Generate random IV 16 bytes untuk keamanan maksimal
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encoded = cipher.update(id.toString(), 'utf8', 'hex');
    encoded += cipher.final('hex');

    return `${iv.toString('hex')}:${encoded}`;
};

/**
 * Dekripsi token kembali ke Chat ID.
 * Mendukung format baru (<iv_hex>:<ciphertext_hex>) dan format lama (statik IV_SECRET)
 * untuk memastikan backwards compatibility.
 */
const decodeWithSecretKey = (encodedToken) => {
    if (!secretKey) throw new Error('APP_KEY is not defined in environment variables');
    const algorithm = 'aes-256-cbc';
    const key = crypto.createHash('sha256').update(secretKey).digest();

    try {
        let iv;
        let ciphertext;

        // Cek apakah token menggunakan format baru dengan delimiter ':'
        if (encodedToken.includes(':')) {
            const parts = encodedToken.split(':');
            iv = Buffer.from(parts[0], 'hex');
            ciphertext = parts[1];
        } else {
            // Fallback ke legacy format dengan statik IV_SECRET
            if (!secretIV) throw new Error('IV_SECRET is not defined');
            iv = Buffer.from(secretIV, 'hex');
            ciphertext = encodedToken;
        }

        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        if (!decrypted) throw new Error('Decryption resulted in empty value');
        return decrypted;
    } catch (error) {
        throw new Error('Api key tidak valid!');
    }
};

module.exports = {
    encodeWithSecretKey,
    decodeWithSecretKey
};
