# 📨 API Reference

Dokumentasi spesifikasi endpoint HTTP yang disediakan oleh **Telegram Notify Log Bot API**.

---

## Base URL
- Lokal: `http://localhost:3000/api`
- Produksi: `https://<domain-anda>/api`

---

## 1. POST `/api/message`
Mengirim pesan notifikasi, error log, atau status pemantauan ke Telegram tujuan.

### Headers
| Header | Tipe | Wajib | Keterangan |
| :--- | :--- | :--- | :--- |
| `x-api-key` | String | Fleksibel* | Access key unik dari bot Telegram |
| `x-chat-id` | String / Number | Fleksibel* | Alternatif: Langsung gunakan Chat ID numerik (misal: `123456789`) |
| `Content-Type` | String | **Ya** | `application/json` atau `application/x-www-form-urlencoded` |

*\*Catatan: Kirim salah satu antara `x-api-key` atau `x-chat-id`.*

### Request Body
| Parameter | Tipe | Wajib | Nilai Bawaan | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `title` | String | **Ya** | - | Judul notifikasi (otomatis dikonversi ke huruf besar) |
| `message` | String | **Ya** | - | Deskripsi pesan atau ringkasan error |
| `code` | Number | Tidak | `null` | HTTP Status Code (contoh: `200`, `404`, `500`). Status `400–511` otomatis ditandai ikon ❗ |
| `detail` | String / Object | Tidak | `null` | Data teknis, payload JSON, atau stack trace log |
| `datetime` | String (ISO 8601) | Tidak | Waktu saat ini | Waktu kejadian log |
| `style` | String | Tidak | `custom` | Gaya tampilan pesan: `card` / `custom`, `minimalist`, atau `compact` |
| `thread_id` | Number | Tidak | `null` | ID Sub-topik pada Telegram Group bertipe Forum |
| `silent` | Boolean | Tidak | `false` | Jika `true`, pesan terkirim tanpa membunyikan dering/getar |

---

### Penjelasan Opsi `style`

1. **`custom` (Default):**
   Format kartu detail lengkap dengan pemisah, rincian status code, detail log dalam block `<pre>`, dan bagian keterangan waktu terpisah.
2. **`minimalist`:**
   Format bersih dengan pemisah garis horizontal tipis dan poin-poin terstruktur (`• Masalah`, `• Kode`, `• Waktu`).
3. **`compact`:**
   Format ringkas satu baris inline, ideal untuk notifikasi dengan frekuensi tinggi.

---

### Perilaku Lampiran Dokumen Otomatis
Telegram membatasi panjang teks pesan maksimal **4096 karakter**. Service ini memiliki mekanisme otomatis:
- Jika panjang teks `detail` melebihi nilai `TELEGRAM_DETAIL_MAX_LENGTH` (default: 1000 karakter):
  - Pesan teks utama tetap terkirim dengan keterangan *(Terlampir sebagai file dokumen)*.
  - Detail log otomatis diubah menjadi file dokumen (`detail.json` jika berformat JSON, atau `detail.txt`) dan dikirimkan sebagai lampiran tepat setelah pesan utama.

---

### Contoh Permintaan

#### cURL (JSON Body)
```bash
curl --location 'https://<domain-anda>/api/message' \
  --header 'x-api-key: 68a2f1b74c89...' \
  --header 'Content-Type: application/json' \
  --data '{
    "title": "Database Connection Timeout",
    "message": "Gagal terhubung ke cluster PostgreSQL node primary",
    "code": 500,
    "detail": {
      "error": "ETIMEDOUT",
      "address": "10.0.12.44",
      "port": 5432,
      "attempts": 3
    },
    "style": "custom"
  }'
```

---

### Format Respons

#### 1. Berhasil (200 OK)
```json
{
  "status": 0,
  "message": "Pesan terkirim"
}
```

#### 2. Kunci Tidak Valid / Tidak Ada (401 Unauthorized)
```json
{
  "status": 0,
  "message": "Unauthorized"
}
```

#### 3. Validasi Input Gagal (422 Unprocessable Entity)
```json
{
  "status": 1,
  "message": "Validasi gagal",
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Field message dalam data tidak boleh kosong.",
      "path": "message",
      "location": "body"
    }
  ]
}
```

#### 4. Kesalahan Server / Telegram API (500 Internal Server Error)
```json
{
  "status": 1,
  "message": "Terjadi kesalahan",
  "error": "ETELEGRAM: 403 Forbidden: bot was blocked by the user"
}
```
