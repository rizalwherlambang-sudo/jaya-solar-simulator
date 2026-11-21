# JAYA Solar Investment Simulator — Netlify package

## Isi paket
- `index.html`: dashboard JAYA baru
- `netlify/functions/pvgis-tmy.mjs`: backend proxy untuk PVGIS TMY
- `netlify.toml`: konfigurasi Netlify Functions

## Deploy
1. Extract ZIP ke folder.
2. Buka https://app.netlify.com/drop atau buat site baru di Netlify.
3. Deploy folder project ini (folder yang berisi `index.html` dan `netlify.toml`).
4. Tunggu deploy selesai. Netlify akan mendeteksi function `pvgis-tmy`.
5. Buka URL Netlify yang diberikan, lalu klik **Update Solar Data**.

Penting: jangan hanya mengunggah `index.html`. Folder `netlify/functions` dan `netlify.toml` wajib ikut ter-deploy agar endpoint `/.netlify/functions/pvgis-tmy` tersedia.

## Penggunaan
- Isi latitude dan longitude.
- Pilih bulan dan tanggal TMY.
- Isi parameter PV, battery, dan beban.
- Klik Update Solar Data.

## Catatan model
- API PVGIS 5.3 TMY mengembalikan data hourly. Timestamp API dikonversi dari UTC ke WIB.
- Produksi PV per jam saat ini memakai pendekatan GHI (W/m²) × kWp × PR / 1000. Ini adalah estimasi awal, bukan simulasi POA/PVcalc lengkap dengan tilt, azimuth, temperatur modul, inverter, dan shading.
- Beban rumah dibagi rata ke jam siang (07:00–17:00) dan malam (jam lain) berdasarkan persentase porsi beban siang. Untuk desain final, gunakan load profile aktual.
- Battery SOC awal diasumsikan penuh pada awal hari representatif.
- Snapshot finansial adalah indikatif, bukan proyeksi 8.760 jam atau IRR/NPV final.

## Troubleshooting
- Jika muncul "Function not found", pastikan deploy folder root project lengkap dan cek Functions tab di Netlify.
- Jika PVGIS error, coba lagi nanti atau periksa koordinat.
- Untuk pengembangan lokal dengan Netlify CLI, jalankan `netlify dev` dari folder project.
