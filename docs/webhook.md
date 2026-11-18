# ⚙️ Panduan Webhook Telegram

Dokumen ini menjelaskan alur kerja, setup lokal, dan troubleshooting webhook Telegram pada service **Telegram Notify Log Bot API**.

---

## 🌐 Bagaimana Webhook Bekerja

1. Pengguna mengirimkan interaksi ke Bot di Telegram (misal: perintah `/subscribe` atau menekan tombol inline).
2. Server Telegram meneruskan event tersebut melalui HTTP POST ke URL Webhook publik Anda:
   ```text
   POST https://<domain-anda>/api/webhook
   ```
3. Handler webhook (`api/webhook.js`) memproses event tersebut dan membalas aksi ke pengguna.

---

## 🛠️ Setup Webhook di Lingkungan Lokal (Development)

Server Telegram membutuhkan URL publik berbasis **HTTPS**. Untuk pengembangan di komputer lokal:

### 1. Gunakan Tool Tunneling (Ngrok)
Jalankan Ngrok pada port aplikasi (contoh: port `3000`):
```bash
ngrok http 3000
```
Output Ngrok akan memberikan URL publik seperti:
`https://a1b2-c3d4.ngrok-free.app`

### 2. Atur Variabel `.env`
Salin URL HTTPS tersebut ke dalam file `.env`:
```env
APP_URL=https://a1b2-c3d4.ngrok-free.app
```

### 3. Jalankan Aplikasi
Saat server dijalankan (`npm run dev`), file `src/app.js` akan secara otomatis mendaftarkan webhook:
```javascript
bot.setWebHook(`${process.env.APP_URL}/api/webhook`);
```

---

## 🔧 Manajemen Webhook Manual (cURL)

Jika Anda ingin memeriksa status atau mengonfigurasi webhook secara mandiri tanpa restart server:

### 1. Cek Status & Info Webhook
```bash
curl --location 'https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo'
```
*Respons berisi status URL saat ini, jumlah update tertunda, dan pesan error terakhir jika ada kendala koneksi.*

### 2. Set Webhook Manual
```bash
curl --location 'https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook' \
  --header 'Content-Type: application/json' \
  --data '{"url": "https://<domain-anda>/api/webhook"}'
```

### 3. Hapus Webhook
Jika Anda ingin menonaktifkan webhook atau beralih ke mode long-polling:
```bash
curl --location 'https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?remove'
```

---

## 🚨 Troubleshooting Masalah Webhook

| Masalah | Kemungkinan Penyebab | Solusi |
| :--- | :--- | :--- |
| `Wrong response code: 404` | Endpoint `/api/webhook` belum diarahkan dengan benar | Pastikan route handler webhook aktif di server/Vercel |
| `SSL error / certificate untrusted` | Menggunakan URL HTTP atau sertifikat self-signed yang tidak didukung | Pastikan domain menggunakan sertifikat valid HTTPS (Let's Encrypt / Ngrok HTTPS) |
| Webhook tidak merespons di local | URL Ngrok telah kedaluwarsa setelah restart | Update nilai `APP_URL` di `.env` dengan URL Ngrok yang baru |
| `Wrong response code: 500` | Error internal saat menangani JSON update Telegram | Periksa terminal log server lokal atau dashboard log Vercel |
