# Wavy Mobile

App mobile Wavy khusus **customer**: login OTP, jelajah konser, checkout, bayar Midtrans (sandbox),
tiket QR + transfer, riwayat pesanan, profil & level, notifikasi. EO dan admin tetap memakai web (`wavy-next`).

| | |
|---|---|
| Expo SDK | **58** (`expo ~58.1.0`, React Native 0.88, React 19.3) |
| Router | expo-router (folder `src/app/`) |
| Styling | NativeWind 4.2.7 (Tailwind v3), token di `src/theme/tokens.js` |
| Jalan di | **Expo Go** dari Play Store / App Store, versi untuk SDK 58 (Android 58.0.6 ke atas). Tanpa dev build. |
| Backend | `wavy-backend` (`/api/v1`, port 1420), endpoint sama dengan web |

## Prasyarat

- Node.js 22.13 atau lebih baru, npm
- HP Android/iOS dengan **Expo Go** terbaru (harus mendukung SDK 58; buka Expo Go → Settings untuk melihat versi)
- Laptop dan HP di **jaringan Wi-Fi yang sama**
- `wavy-backend` jalan di laptop (`bun run dev`, lihat `wavy-backend/TESTING.md`)

## Menjalankan di HP (IP LAN laptop)

HP tidak bisa membuka `localhost` milik laptop, jadi alamat backend harus memakai IP LAN laptop.

1. **Cari IP LAN laptop**
   - Windows: `ipconfig` → bagian adapter Wi-Fi → `IPv4 Address` (mis. `192.168.1.10`)
   - macOS: `ipconfig getifaddr en0` · Linux: `hostname -I`
2. **Buat file `.env`** dari contoh, lalu ganti IP-nya:
   ```bash
   cp .env.example .env
   # .env
   EXPO_PUBLIC_API_URL=http://192.168.1.10:1420/api/v1
   ```
   Wajib diakhiri `/api/v1`, tanpa garis miring di akhir. Setiap kali `.env` diubah, hentikan Expo lalu
   jalankan ulang dengan `npx expo start -c` (nilai `EXPO_PUBLIC_*` ditanam saat bundling).
3. **Cek dari HP**: buka browser HP ke `http://192.168.1.10:1420/health` (health ada di root, bukan di bawah `/api/v1`). Harus muncul
   `{"status":"ok"}`. Kalau tidak terbuka, lihat bagian *Masalah umum*.
4. **Jalankan Expo**:
   ```bash
   npm install
   npx expo start
   ```
   Pindai QR di terminal dengan Expo Go (Android) atau aplikasi Kamera (iOS).

Kalau IP laptop berganti (pindah Wi-Fi), ulangi langkah 1–2.

## Masalah umum

- **"Tidak bisa terhubung ke server"** di app: IP di `.env` salah, backend mati, atau firewall memblokir
  port 1420. Di Windows, izinkan Bun di *Windows Defender Firewall* untuk jaringan **Private**, dan pastikan
  profil Wi-Fi laptop = Private (bukan Public).
- **"Alamat server belum diatur"**: `.env` belum ada atau `EXPO_PUBLIC_API_URL` kosong. Isi lalu `npx expo start -c`.
- **Expo Go tidak bisa memuat app** (QR dipindai tapi macet): firewall juga memblokir port Metro (8081).
  Coba `npx expo start --tunnel`. Tunnel hanya untuk Metro; backend tetap lewat IP LAN.
- **"Project is incompatible with this version of Expo Go"**: perbarui Expo Go dari Play Store/App Store.
- **OTP tidak masuk**: OTP dikirim lewat SMTP backend (`SMTP_*` di `.env` backend); cek folder spam.

## Pembayaran (Midtrans sandbox)

"Bayar sekarang" di detail pesanan memanggil `POST /orders/:id/pay`, lalu membuka `redirect_url` Snap di
WebView dalam app. Setelah selesai/ditutup, app memanggil `GET /orders/:id/payment-status` supaya status
pesanan ter-update walaupun webhook Midtrans tidak sampai ke laptop. Panduan kartu/VA uji:
`wavy-next/docs/MIDTRANS.md`.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npx expo start` | Jalankan Metro, pindai QR dengan Expo Go |
| `npx expo start -c` | Sama, sambil membersihkan cache (setelah ubah `.env`/tailwind config) |
| `npm run lint` | ESLint (expo lint) |
| `npm run typecheck` | TypeScript `tsc --noEmit` |
| `npx expo-doctor` | Cek kecocokan dependensi dengan SDK 58 |

## Struktur

```
src/
  app/            layar (expo-router). (tabs)/ = tab bawah
  components/ui/  komponen dasar: Text, Button, badge status, state loading/kosong/error, poster
  i18n/           teks UI: id.ts (utama), en.ts (boleh menyusul, kunci kosong jatuh ke id)
  lib/            api client, pesan error per kode, format Rupiah/tanggal WIB
  store/          sesi (expo-secure-store)
  theme/tokens.js satu-satunya file berisi nilai warna (disalin dari wavy-next globals.css)
```

## Aturan

Mengikuti `wavy-next/CLAUDE.md` dan `wavy-next/docs/DESIGN.md`:

- Warna hanya lewat token (`bg-primary`, `text-muted-foreground`, ...). Hex hanya di `src/theme/tokens.js`.
- Tidak ada data mock dan tidak ada pesan sukses saat API gagal; setiap layar punya state loading/kosong/error.
- Teks UI lewat `t()` dari `src/i18n`.
- Font: Space Grotesk (judul), Inter (body), IBM Plex Mono (harga, kode, tanggal). Pakai kelas
  `font-display`, `font-sans-semibold`, `font-mono`, dst. Jangan `font-bold` (di React Native tiap
  ketebalan = family font sendiri).
- Library harus termasuk di Expo Go (cek `npx expo install` + https://docs.expo.dev/versions/v58.0.0/).
