# 🤖 Telegram Notify Log Bot API

Service API berbasis Node.js & Express untuk mengirimkan notifikasi, log sistem, dan error terformat ke Telegram secara aman menggunakan token enkripsi unik per Chat ID (stateless).

---

## ⚡ Quick Start

```bash
# 1. Clone & Install
npm install

# 2. Setup Environment
cp .env.example .env
# Lengkapi TELEGRAM_BOT_TOKEN, APP_KEY, IV_SECRET di .env

# 3. Jalankan Server (Lokal)
npm run dev

# ATAU Jalankan via Docker
docker-compose up -d --build
```

---

## 📚 Dokumentasi Lengkap

Untuk kemudahan navigasi dan pemeliharaan, dokumentasi telah dipecah ke dalam folder [`docs/`](docs/):

| Dokumen | Deskripsi |
| :--- | :--- |
| 📖 **[API Reference](docs/api-reference.md)** | Spesifikasi lengkap endpoint `/api/message`, parameter body, pilihan format style, dan contoh response |
| 🚀 **[Panduan Vercel](docs/vercel.md)** | Arsitektur serverless di Vercel, setup webhook sekali pakai, dan variabel environment |
| 🏗️ **[Arsitektur & Keamanan](docs/architecture.md)** | Penjelasan arsitektur internal, struktur folder, diagram alur sequence, dan mekanisme token AES-256 |
| ⚙️ **[Panduan Webhook](docs/webhook.md)** | Cara kerja webhook Telegram, setup Ngrok lokal, dan perintah curl manajemen webhook manual |
| 💻 **[Panduan Developer](docs/development.md)** | Setup lingkungan dev, cara menambah style formatting baru, standar koding, dan roadmap fitur |
| 📋 **[Roadmap & Rencana](docs/roadmap.md)** | Master plan tahapan perbaikan bug, penguatan keamanan, antrean, dan fitur baru |

---

## 🔑 Cara Mendapatkan API Key & Chat ID

Anda bisa menggunakan salah satu dari cara berikut:

### 1. Langsung Lewat Bot Telegram
1. Buka bot Telegram Anda (di private chat atau undang ke grup Anda).
2. Kirim perintah:
   * `/id` atau `/chatid` : Bot akan langsung membalas dengan **Chat ID** Anda (contoh: `123456789` atau `-100123456789` untuk grup).
   * `/subscribe` : Bot akan menampilkan tombol **🔑 Request Access Key** dan **🆔 Cek Chat ID**.
3. Simpan **x-api-key** (terenkripsi) atau **Chat ID** sesuai kebutuhan integrasi Anda.

### 2. Mengetahui Chat ID dari `x-api-key`
Jika Anda sudah memiliki `x-api-key` dan ingin mengecek Chat ID aslinya:
```bash
curl --location 'http://localhost:3000/api/validate' \
  --header 'x-api-key: <ACCESS_KEY_ANDA>'
```
*Respons:*
```json
{
  "status": 0,
  "valid": true,
  "chat_id": "123456789",
  "message": "API Key valid"
}
```

---

## 📨 Contoh Penggunaan Cepat

```bash
curl --location 'http://localhost:3000/api/message' \
  --header 'x-api-key: <TOKEN_AKSES_ANDA>' \
  --header 'Content-Type: application/json' \
  --data '{
    "title": "Server Health Check",
    "message": "Disk usage melebihi ambang batas 85%",
    "code": 500,
    "style": "custom"
  }'
```

---

## 📄 Lisensi

Distributed under the [ISC License](LICENSE).
