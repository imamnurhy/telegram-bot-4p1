# 💻 Panduan Pengembangan (Developer Guide)

Dokumen ini ditujukan bagi pengembang yang ingin berkontribusi, memodifikasi alur logic, atau menambahkan fitur baru pada **Telegram Notify Log Bot API**.

---

## 🚀 Setup Lingkungan Pengembangan

1. **Clone repository & Install dependensi:**
   ```bash
   git clone <repo-url>
   cd telegram-bot-api
   npm install
   ```

2. **Inisialisasi Environment:**
   ```bash
   cp .env.example .env
   ```
   Generate nilai acak untuk `APP_KEY` dan `IV_SECRET`:
   ```bash
   node -e "console.log('APP_KEY=' + require('crypto').randomBytes(16).toString('hex')); console.log('IV_SECRET=' + require('crypto').randomBytes(16).toString('hex'))"
   ```

3. **Jalankan Aplikasi:**
   ```bash
   npm run dev
   ```

---

## 🎨 Menambahkan Template Gaya Pesan Baru

Format tampilan pesan dikelola di dalam objek `MessageFormatters` pada file [src/controller/messageController.js](file:///Users/kominfoimam/Project/Docker/telegram-bot-api/src/controller/messageController.js).

Untuk menambahkan gaya baru, misalnya style `alert`:

```javascript
// src/controller/messageController.js

MessageFormatters.alert = ({
    statusEmoji,
    escapedTitle,
    message,
    code,
    statusText,
    eventTime,
    detail,
    detailFileBuffer,
    formattedDetail
}) => {
    let text = `🚨 <b>ALERT: ${escapedTitle}</b>\n`;
    text += `══════════════════════\n`;
    if (code) text += `<b>Kode:</b> ${code} (${statusText})\n`;
    if (message) text += `<b>Deskripsi:</b> ${escapeHTMLPreservingTags(message)}\n`;
    text += `<b>Waktu:</b> ${eventTime.format('YYYY-MM-DD HH:mm:ss')}\n`;
    
    if (detail && !detailFileBuffer) {
        text += `\n<b>Stack Trace:</b>\n<pre>${escapeHTML(formattedDetail)}</pre>`;
    }
    return text;
};
```

Setelah ditambahkan:
1. Konsumen API dapat mengirimkan properti `"style": "alert"` pada body request.
2. Perbarui dokumen [docs/api-reference.md](api-reference.md) untuk mencatat style baru tersebut.

---

## 🛡️ Standar Koding & Best Practices

1. **Sanitasi Karakter Khusus Telegram (HTML):**
   * Telegram Bot API menggunakan parser HTML yang ketat. Karakter `&`, `<`, dan `>` wajib di-escape.
   * Gunakan helper `escapeHTML` untuk teks mentah / detail log.
   * Gunakan `escapeHTMLPreservingTags` jika input user diperbolehkan mengandung tag HTML dasar Telegram seperti `<b>`, `<i>`, `<code>`.
2. **Penanganan Batas Karakter:**
   * Batas maksimal per pesan Telegram adalah **4096 karakter**.
   * Jangan mengirim detail log panjang secara langsung di teks utama; selalu gunakan mekanisme `processDetail()` untuk mengubahnya menjadi attachment jika melebihi batas.
3. **Format Standar Respons API:**
   * Respon Sukses:
     ```json
     { "status": 0, "message": "Pesan terkirim" }
     ```
   * Respon Gagal:
     ```json
     { "status": 1, "message": "Pesan error deskriptif", "error": err }
     ```

---

## 🗺️ Backlog & Roadmap Pengembangan

- [ ] **Dockerization**: Tambahkan `Dockerfile` dan `docker-compose.yml` untuk deployment container siap pakai.
- [ ] **Rate Limiter Telegram**: Tambahkan antrean (queue) pesan lokal atau Redis BullMQ untuk menghindari error `429 Too Many Requests`.
- [ ] **Webhook Secret Token**: Tambahkan verifikasi header `X-Telegram-Bot-Api-Secret-Token` untuk mencegah pemalsuan webhook.
- [ ] **Topik Forum Telegram**: Tambahkan dukungan opsi parameter `message_thread_id` agar pesan dapat dikirim ke topik tertentu di grup forum Telegram.
- [ ] **Silent Log Option**: Tambahkan opsi flag `disable_notification: true` untuk log non-kritis.
