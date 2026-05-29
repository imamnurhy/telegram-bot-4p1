# Telegram Notify Log Bot API

Service API berbasis Node.js & Express untuk mengirimkan notifikasi/log/error terformat ke Telegram secara terenkripsi menggunakan token/key unik per Chat ID.

## 🛠️ Environment Variables (.env)
Salin `.env.example` ke `.env` dan lengkapi konfigurasi berikut:
```env
APP_PORT=3000
APP_KEY=      # Key 32-karakter untuk enkripsi AES-256
IV_SECRET=    # 16-byte hex IV untuk enkripsi
APP_URL=      # URL publik (Ngrok/Vercel) untuk webhook Telegram
TELEGRAM_BOT_TOKEN=  # Token dari BotFather
TIMEZONE=Asia/Jakarta
TELEGRAM_DETAIL_MAX_LENGTH=1000 # Batas karakter detail log sebelum dijadikan file (.json / .txt)
```

## 🚀 Jalankan Aplikasi
1. **Instal Dependensi:**
   ```bash
   npm install
   ```
2. **Jalankan Lokal dengan Webhook (Ngrok):**
   - Jalankan Ngrok untuk expose port lokal ke publik:
     ```bash
     ngrok http 3000
     ```
   - Salin URL HTTPS dari Ngrok ke variabel `APP_URL` di `.env`.
   - Jalankan server development:
     ```bash
     npm run dev
     # ATAU menggunakan vercel dev
     vercel dev
     ```

## 🤖 Cara Mendapatkan Access Key
Untuk dapat mengirim notifikasi ke chat/grup Anda, Anda membutuhkan `x-api-key`:
1. Buka Bot Telegram Anda.
2. Kirim perintah `/subscribe` atau `/start subscribe`.
3. Klik tombol **Request Kode** yang muncul. Bot akan membalas dengan kode enkripsi Chat ID Anda (gunakan kode ini sebagai `x-api-key`).

## 📨 API Endpoint: Mengirim Notifikasi
Kirim notifikasi dengan melakukan POST request ke endpoint `/api/message`.

* **Endpoint:** `POST /api/message`
* **Headers:**
  * `x-api-key`: `<Access Key dari Bot>`
  * `Content-Type`: `application/json` atau `application/x-www-form-urlencoded`
* **Body:**
  * `title` (Wajib, String): Judul pesan.
  * `message` (Wajib, String): Detail pesan.
  * `code` (Opsional, Number): HTTP Status Code (misal: 500, 200). Kode 400-511 otomatis ditandai ikon ❗.
  * `detail` (Opsional, String/JSON): Log detail teknis (otomatis diformat dalam block code JSON atau dilampirkan sebagai file jika terlalu panjang).
  * `datetime` (Opsional, Date/String): Waktu kejadian.
  * `style` (Opsional, String): Gaya tampilan pesan. Pilihan: `card` (default), `minimalist`, atau `compact`.

### Contoh Request (cURL):
```bash
curl --location 'https://<domain-anda>/api/message' \
--header 'x-api-key: <Access Key Anda>' \
--header 'Content-Type: application/json' \
--data '{
    "title": "Database Connection Error",
    "message": "Gagal terhubung ke database PostgreSQL",
    "code": 500,
    "detail": "{\"error\": \"Connection timeout after 5000ms\"}",
    "datetime": "2026-05-29T19:50:00Z",
    "style": "card"
}'
```

## ⚙️ Manajemen Webhook Manual (Opsional)
Jika webhook tidak ter-update otomatis pada saat startup, gunakan command berikut:
* **Cek Webhook:**
  ```bash
  curl --location 'https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo'
  ```
* **Set Webhook:**
  ```bash
  curl --location 'https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook' \
  --header 'Content-Type: application/json' \
  --data '{"url": "https://<domain-anda>/api/webhook"}'
  ```
* **Hapus Webhook:**
  ```bash
  curl --location 'https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?remove'
  ```