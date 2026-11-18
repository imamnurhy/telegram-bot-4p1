# 🚀 Panduan Deployment: Vercel Serverless

Dokumen ini menjelaskan arsitektur, konfigurasi, dan best practices dalam mendeploy **Telegram Notify Log Bot API** di platform **Vercel**.

---

## 🏗️ 1. Arsitektur di Lingkungan Vercel

Di platform Vercel, service ini berjalan sebagai **Serverless Function**:
* **Konfigurasi Routing (`vercel.json`):**
  ```json
  {
      "rewrites": [
          {
              "source": "/(.*)",
              "destination": "/api"
          }
      ]
  }
  ```
* Seluruh incoming HTTP request diarahkan ke `api/index.js` yang membungkus Express app (`src/app.js`).
* Handler webhook (`api/webhook.js`) dan route Express (`/api/webhook`) keduanya berbagi controller yang sama di `src/controller/webhookController.js`.

---

## ⚙️ 2. Environment Variables di Vercel Dashboard

Pastikan variabel-variabel berikut telah ditambahkan di **Project Settings > Environment Variables** pada dashboard Vercel:

| Variabel | Wajib | Keterangan |
| :--- | :---: | :--- |
| `TELEGRAM_BOT_TOKEN` | **Ya** | Token bot dari [@BotFather](https://t.me/BotFather) |
| `APP_KEY` | **Ya** | Key 32-karakter rahasia untuk enkripsi AES-256 |
| `IV_SECRET` | **Ya** | 16-byte hex IV untuk dekripsi token lawas |
| `APP_URL` | **Ya** | URL domain publik Vercel Anda (contoh: `https://my-telegram-bot.vercel.app`) |
| `TELEGRAM_WEBHOOK_SECRET` | Opsional | Secret token untuk verifikasi webhook Telegram |
| `TIMEZONE` | Opsional | Format timezone log (contoh: `Asia/Jakarta`) |
| `TELEGRAM_DETAIL_MAX_LENGTH` | Opsional | Batas panjang karakter detail sebelum dijadikan file (default: 1000) |

---

## 🔗 3. Mendaftarkan Webhook Telegram di Vercel

Karena Vercel menggunakan arsitektur **Serverless (Ephemeral & Stateless)**:
- Serverless instance hanya menyala saat ada request masuk (Cold Start) lalu mati kembali.
- Panggilan `bot.setWebHook()` **tidak boleh** dipanggil setiap kali fungsi cold-start karena akan menambah latensi respon Telegram.
- **Daftarkan Webhook Cukup 1 Kali Saja** via terminal setelah domain Vercel Anda aktif:

```bash
curl --location 'https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook' \
  --header 'Content-Type: application/json' \
  --data '{
    "url": "https://<NAMA-PROJECT-ANDA>.vercel.app/api/webhook"
  }'
```

Jika Anda menggunakan `TELEGRAM_WEBHOOK_SECRET` di `.env`:
```bash
curl --location 'https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook' \
  --header 'Content-Type: application/json' \
  --data '{
    "url": "https://<NAMA-PROJECT-ANDA>.vercel.app/api/webhook",
    "secret_token": "<SECRET_TOKEN_ANDA>"
  }'
```

### Memeriksa Status Webhook di Vercel:
```bash
curl --location 'https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo'
```

---

## ⚠️ 4. Karakteristik & Limitasi Serverless di Vercel

1. **In-Memory State Bersifat Ephemeral:**
   * Di Vercel, rate limiter in-memory tidak persisten antar container serverless yang berbeda. Jika Anda membutuhkan rate limiter global yang ketat di Vercel, disarankan menggunakan Upstash Redis via REST API.
2. **Execution Timeout:**
   * Vercel Free Plan (Hobby) memiliki timeout fungsi serverless sebesar **10 detik**.
   * Karena itu, pengiriman pesan Telegram harus segera diselesaikan dan tidak menjalankan proses background panjang (`setInterval`).
3. **Penyimpanan Berkas (Ephemeral `/tmp`):**
   * Service ini membuat attachment file menggunakan Buffer memory (`Buffer.from(...)`) secara langsung tanpa menulis ke disk fisik, sehingga 100% aman dan kompatibel dengan Vercel.
