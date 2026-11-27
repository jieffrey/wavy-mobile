# Spike MO-0 — stadion 3D di Expo Go

Branch `spike/venue-3d-expo-go` (dari `origin/main`). **Tidak di-merge**; hasilnya menentukan MO-3 (PLAN-v2 §5.3 di `wavy-next/docs/PLAN-v2.md`).

## Isi spike

| File | Isi |
|---|---|
| `src/spike/venue/stadium-data.ts` | Stadion rekaan: 4 section festival, 14 tribun bawah, 18 tribun atas (36 section), bentuk data = rencana `venue_sections` |
| `src/spike/venue/camera.ts` | Orbit (yaw/pitch/zoom), pose "Lihat dari sini", easing |
| `src/spike/venue/stadium-scene.tsx` | `@react-three/fiber/native` Canvas, geometri prosedural (box), tap via pointer event r3f, drag orbit, kamera terbang 900 ms |
| `src/spike/venue/stadium-2d.tsx` | Denah 2D `react-native-svg` dari data yang sama (fallback) |
| `src/spike/venue/metrics.ts` | Waktu frame pertama, fps, fps minimum saat bergerak, log tap, jumlah resume |
| `src/app/spike-venue.tsx` | Layar uji + error boundary + fallback otomatis ke 2D bila frame pertama > 4 dtk |
| `src/app/login.tsx` | Tombol "Spike 3D" (hanya `__DEV__`) |

Dependensi baru (versi dikunci): `three@0.187.0`, `@react-three/fiber@9.8.2`, `expo-gl@~58.0.4`, `expo-asset@~58.0.21`, `expo-file-system@~58.0.15`, dev `@types/three@0.187.0`. Tanpa drei, tanpa teks 3D, tanpa file model.

## Yang sudah dicek (tanpa HP)

| Cek | Hasil |
|---|---|
| Peer dependency r3f 9.8.2 (`react >=19 <19.4`, `react-native >=0.78`, `expo-gl >=11`) vs React 19.3.0 / RN 0.88.1 | Cocok |
| `expo-gl` di Expo Go SDK 58 (docs v58 gl-view) | "Included in Expo Go" |
| `npx tsc --noEmit` | Lolos |
| `npx expo lint` | 0 error |
| `npx expo export --platform android` (Hermes) | Lolos, bundle 9,5 MB |
| `npx expo export --platform ios` (Hermes) | Lolos, bundle 9,3 MB |
| Dev server `--port 3001`, `GET /spike-venue` | 200 |

**Belum dicek: perilaku di HP nyata.** Tidak ada perangkat/emulator Android yang terhubung di mesin ini.

## Uji HP #1 — gagal, sudah diperbaiki

**Gejala:** `TypeError: undefined is not a function` di `node_modules/three/build/three.cjs:12` saat membuka Spike 3D.
**Sebab:** `@react-three/fiber/native` memakai `require('three')`; Metro memilih kondisi `require` di `exports` three → `build/three.cjs`, yang mulai three 0.18x memanggil `process.emitWarning` (tidak ada di React Native). Typecheck, lint, dan `expo export` tidak menangkapnya karena ini error saat runtime.
**Perbaikan:** `metro.config.js` → `resolver.resolveRequest` mengarahkan import persis `'three'` ke `build/three.module.js`; subpath lain tetap lewat resolver bawaan. Polyfill `process.emitWarning` (rencana cadangan) tidak diperlukan.

| Verifikasi (bundle Android `--no-bytecode --no-minify`) | Sebelum | Sesudah |
|---|---|---|
| String `THREE_CJS_DEPRECATED` / `emitWarning` | 1 / ada | 0 / 0 |
| `three/examples/jsm/utils/BufferGeometryUtils.js`, `three/addons/geometries/RoundedBoxGeometry.js` (import sementara, sudah dihapus) | — | ter-bundle |
| Salinan three (`REVISION = '187'`, `class WebGLRenderer`) | 1 | 1 |
| `npm ls three` | `three@0.187.0` + deduped di r3f | sama |
| Export Hermes Android / iOS | lolos | lolos (9,5 / 9,3 MB) |

## Cara uji di HP (Expo Go)

1. `git switch spike/venue-3d-expo-go && git pull && npm install`
2. `npx expo start --port 3001 --clear` → scan QR dengan Expo Go (HP & laptop satu Wi-Fi). `--clear` wajib setelah `metro.config.js` berubah, supaya cache resolver lama tidak dipakai.
3. Di layar Masuk, tekan **Spike 3D** (kanan bawah).
4. Isi tabel di bawah untuk **1 Android kelas menengah** dan **1 iPhone**. Kotak metrik kiri atas menampilkan angkanya.

| Kriteria (PLAN-v2 §5.3) | Cara | Android | iPhone |
|---|---|---|---|
| Render < 2 dtk | Angka "frame pertama" setelah layar dibuka | | |
| ≥ 30 fps saat rotasi | Tekan "Putar: on" 10 dtk, lalu drag-drag sendiri; baca "min saat gerak" | | |
| Tap tepat 10/10 | Tap 10 section berbeda (festival, tribun bawah, tribun atas, termasuk yang kecil di kejauhan); bandingkan kode di panel bawah & log "tap" | | |
| Kamera terbang mulus | Pilih section → "Lihat dari sini" → "Kembali ke overview", 3× | | |
| Kembali dari background tanpa layar hitam | Home → buka lagi Expo Go, dengan "Remount: on" **dan** "Remount: off" | | |
| Fallback 2D | Tombol "2D": tap section di denah, panel ikut berubah | | |

Catat juga: model HP, versi OS, apakah HP panas setelah 1 menit putar, dan pesan merah "fallback 2D" bila muncul.

## Hal yang sengaja belum ada di spike

- **Pinch zoom**: handler sentuh r3f native memakai `PanResponder` satu jari; zoom lewat tombol +/−. Pinch dengan `react-native-gesture-handler` dicoba di MO-3.
- `frameloop="demand"`: spike memakai loop terus-menerus supaya fps bisa diukur; MO-3 memakai demand.
- Teks UI belum lewat i18n (layar uji, tidak di-merge).
