# TERAS DELIVERY

Sistem Korwil + Driver + Token + Transaksi + Laporan Realtime, untuk wilayah uji coba **Lelea (TRS-003)**.

Stack: React + Vite + Firebase (Auth, Realtime Database, Storage) + PWA. Dirancang untuk berjalan di tier gratis: GitHub Free + Vercel Hobby + Firebase Spark.

## 1. Batasan penting yang perlu Anda ketahui

- **Login tanpa password** (sesuai permintaan) tetap butuh identitas Firebase supaya security rules bisa jalan. Solusinya: setiap sesi browser sign-in **anonim** ke Firebase, lalu ID yang Anda ketik dipetakan ke UID anonim itu lewat node `sessions`. Artinya model keamanannya sama persis dengan yang Anda minta: **siapa pun yang tahu ID bisa login sebagai user itu** — itu keputusan bisnis Anda (tanpa password), bukan celah di luar itu.
- **Tidak memakai Firebase Cloud Storage.** Sejak 3 Februari 2026, Google mewajibkan paket berbayar (Blaze, perlu kartu kredit tertaut) untuk memakai Cloud Storage, walau pemakaiannya tetap Rp0 di bawah kuota gratis. Supaya project ini benar-benar bisa jalan tanpa kartu kredit sama sekali, bukti transfer top-up dikompresi di browser lalu disimpan langsung sebagai gambar (base64) di dalam **Realtime Database** — yang tetap 100% gratis tanpa kartu kredit di paket Spark. Konsekuensinya: ukuran database akan sedikit lebih besar dari biasanya, dan gambar dikompresi otomatis (~kualitas 60%, lebar maks 900px) supaya tetap ringan.
- **Saldo token** dijaga lewat Firebase Realtime Database *transaction* (atomic) supaya aman dari race condition dua device menulis bersamaan, dan rules membatasi: driver hanya bisa mengurangi saldonya sendiri tepat 1 (saat order), Korwil hanya bisa menambah saldo driver di wilayahnya (saat approve). Karena tidak ada server (Cloud Functions perlu paket Blaze), rules tidak bisa memverifikasi "penambahan ini persis cocok dengan pengajuan top-up X" secara matematis sempurna — ini batas teknis Realtime Database rules tanpa backend. Untuk 1 wilayah dengan 2-3 orang terpercaya ini cukup aman; kalau nanti skalanya besar, langkah pengerasan berikutnya adalah memindahkan approve/reject ke Cloud Function.
- Saya tidak bisa menjalankan `npm install` / `npm run build` atau membuat project Firebase sungguhan dari sisi saya (tidak ada akses jaringan di lingkungan ini). Semua kode di bawah ini saya tulis manual dan konsisten secara logika, tapi **jalankan `npm install && npm run build` di komputer Anda sebagai langkah pertama** untuk menangkap typo/error sebelum deploy.
- Logo TERAS asli belum pernah diunggah ke percakapan ini, jadi ikon PWA (`public/icons/icon-192.png`, `icon-512.png`) masih placeholder kosong — lihat `public/icons/BACA-INI.txt`.
- Struk JPEG (html2canvas) dan PDF laporan (jsPDF) sudah diimplementasikan; keduanya baru bisa benar-benar dites setelah `npm install` di komputer Anda.

## 2. Struktur data (Realtime Database)

```
users/{userId}          -> { role, name, driverCode, regionCode, active, createdAt }
regions/{regionCode}     -> { receiptSettings: {...}, deliveryZones: { key: {name, fee} } }
transactions/{txId}      -> { transactionNumber, regionCode, driverId, driverCode, createdAt, customer, stores, deliveryRegion, deliveryFee, multiStoreFee, parking, goodsTotal, total, tokenUsed }
tokenLedger/{driverId}/{entryId} -> { type: 'order'|'topup', amount, referenceId, balanceAfter, createdAt }
tokenBalances/{driverId} -> number (cache, selalu dihitung ulang via transaction dari ledger)
topUps/{topUpId}         -> { driverId, driverCode, regionCode, amount, tokenAmount, proofData (base64 image), status, createdAt, approvedBy, approvedAt, rejectionReason }
counters/{regionCode}/{driverCode}/{dateKey} -> angka urutan transaksi harian (reset otomatis per tanggal)
sessions/{firebaseUid}   -> { userId, ts }  (pemetaan login ID -> sesi Firebase)
```

## 3. Setup Firebase

1. Buka https://console.firebase.google.com → **Add project** → beri nama (mis. `teras-delivery`).
2. **Build > Authentication > Get started** → tab Sign-in method → aktifkan **Anonymous**.
3. **Build > Realtime Database > Create Database** → pilih lokasi (Singapore paling dekat) → mode **locked**.
4. Buka tab **Rules** di Realtime Database, tempel isi file `firebase.rules.json` dari project ini, lalu **Publish**.
5. **Project settings (ikon gerigi) > General** → scroll ke "Your apps" → klik ikon web `</>` → daftarkan app (nama bebas, tidak perlu Hosting).
6. Salin konfigurasi (`apiKey`, `authDomain`, `databaseURL`, dst) ke file `.env` (salin dari `.env.example`).

Tidak perlu setup Cloud Storage sama sekali — project ini sengaja tidak memakainya (lihat bagian 1).

### Isi data awal (demo data)

Setelah rules aktif, tambahkan manual di Realtime Database (tab Data) — atau lewat aplikasi setelah deploy:

```
users/TRS-K-003 -> { "role": "korwil", "name": "Rizki", "regionCode": "TRS-003", "active": true }
users/TRS-003-01 -> { "role": "driver", "name": "Rizki", "driverCode": "01", "regionCode": "TRS-003", "active": true }
users/TRS-003-02 -> { "role": "driver", "name": "Jo", "driverCode": "02", "regionCode": "TRS-003", "active": true }
tokenBalances/TRS-003-01 -> 0
tokenBalances/TRS-003-02 -> 0
```

Driver baru selanjutnya bisa dibuat langsung dari menu **Manajemen Driver** di dashboard Korwil (tidak perlu masuk ke Firebase Console lagi).

## 4. Jalankan lokal

```bash
npm install
cp .env.example .env   # lalu isi dengan config Firebase Anda
npm run dev
```

Buka `http://localhost:5173`, login dengan `TRS-K-003` (Korwil) atau `TRS-003-02` (Jo).

Pastikan juga:
```bash
npm run build
```
berhasil tanpa error sebelum deploy.

## 5. Deploy: GitHub → Vercel

1. `git init && git add . && git commit -m "Teras Delivery v1"`.
2. Buat repo baru di GitHub, lalu `git push`.
3. Di https://vercel.com → **Add New > Project** → import repo tadi.
4. Framework preset otomatis terdeteksi sebagai Vite.
5. Di **Environment Variables**, masukkan seluruh variabel dari `.env` Anda (`VITE_FIREBASE_...`).
6. Deploy. URL bawaan seperti `teras-delivery.vercel.app` sudah cukup untuk uji coba.
7. Test Korwil: login `TRS-K-003`, buat driver baru, cek dashboard.
8. Test Driver: login `TRS-003-02`, buat pesanan, cek saldo token berkurang.
9. Test realtime: buka dashboard Korwil di satu perangkat/tab dan dashboard Driver di tab lain — perubahan harus muncul tanpa reload.

## 6. Test case (sesuai spesifikasi)

| # | Skenario | Hasil yang diharapkan |
|---|----------|------------------------|
| 1 | Jo 5 token, buat 3 order | Saldo jadi 2 |
| 2 | Jo 0 token, buat 3 order | Saldo jadi -3, order tetap berhasil |
| 3 | Jo -3 token, top-up Rp20.000 disetujui | Saldo jadi 7 |
| 4 | Top-up Rp20.000 (10 token) ditolak | Saldo tidak berubah |
| 5 | Order 2 toko | Biaya beda toko Rp3.000 |
| 6 | Order 3 toko | Biaya beda toko tetap Rp3.000 |
| 7 | Nomor transaksi tanggal baru | Urutan kembali ke 001 |
| 8 | Driver buat transaksi, Korwil buka dashboard | Data langsung muncul tanpa input ulang |
| 9 | Korwil approve top-up, driver buka dashboard | Saldo token berubah otomatis |
| 10 | Jo buka riwayat | Tidak melihat transaksi Rizki |

Semua kasus ini didukung oleh logika di `src/lib/tokenLedger.js` dan `src/lib/transactionNumber.js`, serta rules di `firebase.rules.json`.

## 7. Yang sengaja belum dibuat (sesuai instruksi)

Tidak ada marketplace, GPS/Maps, chat, payment gateway, password/OTP/login Google, subscription, rating driver. Cakupan tetap: Korwil + Driver + Order + Token + Top Up + Approval + Laporan.
