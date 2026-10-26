# AI Disaster Assistant

Prototype web responsif pendamping keputusan dan evakuasi saat bencana.

## Menjalankan aplikasi

```sh
npm install
```

Atur `DATABASE_URL`, `APP_BASE_URL`, dan konfigurasi SMTP di `.env.local` (lihat `.env.local.example`), buat database PostgreSQL, lalu impor data JSON lama dan siapkan skema:

```sh
npm run db:migrate
npm run dev
```

Buka `http://127.0.0.1:3000`. Aplikasi menggunakan Next.js App Router.

## Akun dan role

- Pengguna dapat membuat akun dengan nama, email, dan kata sandi. Nama akun dipakai pada profil keluarga dan laporan SOS; nama yang dikirim ke server tidak dapat diganti lewat payload browser.
- Akun baru menjadi **Pengguna** setelah email diverifikasi. Verifikasi mengirim tautan sekali pakai berlaku 24 jam via SMTP; login ditolak sampai verifikasi selesai. Akun lama dari migrasi yang belum memiliki tanda verifikasi harus memakai tautan **Belum menerima email verifikasi?** pada halaman masuk. Untuk menetapkan admin pertama, isi `INITIAL_ADMIN_EMAIL` dan `INITIAL_ADMIN_SECRET`; admin juga wajib memverifikasi email sebelum dapat masuk.
- Role Tim SAR dapat melihat dan memperbarui laporan SOS, serta menambahkan posko. Posko kontribusi tetap ditandai belum terverifikasi; role akun tidak berarti afiliasi atau verifikasi resmi lembaga.
- Laporan dan API detail dibatasi di server; akun biasa tidak menerima koordinat maupun detail laporan orang lain. Koordinat hanya disimpan saat pengguna mengirim SOS dengan persetujuan lokasi presisi. Lokasi GPS live tidak disimpan sebagai lokasi global.
- Service worker hanya menyimpan cache peta yang tidak berisi laporan atau lokasi presisi. Cache offline versi lama dibersihkan saat aplikasi diperbarui.
- Akun, sesi, grup keluarga, dan data peta disimpan di PostgreSQL. Migrasi awal mengimpor `data/accounts.json`, `data/family_groups.json`, dan `data/disaster_database.json` satu kali tanpa menimpa dokumen yang sudah ada. Runtime menggunakan dokumen JSONB per domain dengan transaksi dan penguncian baris PostgreSQL agar pembaruan antarkoneksi/instance tidak saling menimpa; ini memudahkan migrasi dari prototipe, tetapi menserialisasi penulisan pada dokumen yang sama. Untuk beban produksi tinggi, normalisasikan data ke tabel domain dan siapkan backup serta pemulihan teruji.
- Hash kata sandi menggunakan scrypt dan cookie sesi bersifat HttpOnly. Fitur lupa password demo menampilkan tautan sekali pakai yang berlaku satu jam hanya saat development; email reset tidak dikirim dan kedua endpoint reset dinonaktifkan di server produksi. SMTP dipakai untuk verifikasi email akun, bukan reset password. Hosting produksi harus memakai HTTPS dan `APP_BASE_URL` HTTPS yang benar. Mode tamu tetap dapat memakai panduan non-akun dan data lokal. Tamu dapat mengirim laporan SOS anonim setelah menyetujui lokasi presisi; laporan berbasis akun memakai nama akun. Sinkronisasi keluarga tetap memerlukan akun.
- Laporan SOS membatasi koordinat, kategori, urgensi, dan panjang teks di server; batasnya 3 laporan per alamat IP per 15 menit, berlaku lintas instance lewat PostgreSQL. Login dibatasi 10 percobaan per IP per 15 menit, pendaftaran 5 akun per IP per jam, dan permintaan verifikasi/reset demo 5 kali per IP per 15 menit. Di production, API autentikasi dan SOS menolak permintaan sampai `TRUST_PROXY_HEADERS=true` diaktifkan. Aktifkan hanya di belakang reverse proxy tepercaya yang menimpa `X-Real-IP` atau `X-Forwarded-For`; jangan percaya header ini dari klien langsung.
- SMTP dan database harus tersedia agar pendaftaran serta login berfungsi. Siapkan host/port/TLS, kredensial SMTP bila diperlukan, dan alamat `SMTP_FROM` yang diizinkan provider. Ini tetap autentikasi prototype, bukan layanan produksi: belum ada reset kata sandi via email atau audit log. Analisis situasi, peta contoh, dan respons kesiapsiagaan adalah simulasi, bukan AI/layanan resmi atau dispatch darurat.
- Panduan assessment bersifat statis per jenis bencana; teks pengguna ditampilkan sebagai laporan yang belum diverifikasi, bukan dianalisis oleh AI. Peringatan resmi dan rute evakuasi live belum terhubung. Titik, kontak, jarak, dan kondisi contoh tidak boleh dipakai untuk navigasi atau meminta pertolongan. Marker demo tidak dibuat di sekitar GPS pengguna. SOS hanya dicatat di database dan tidak mengirim dispatch.

## Perintah

- `npm run dev` — jalankan server pengembangan Next.js.
- `npm run build` — buat production build.
- `npm run start` — jalankan production build.
- `npm run db:migrate` — buat tabel PostgreSQL dan impor data JSON lama tanpa menimpa data yang sudah ada.
- `npm run db:backup` — buat snapshot database konsisten ke `DATABASE_BACKUP_DIR` (direktori absolut di luar repository).
- `npm run db:restore` — pulihkan snapshot; memerlukan `DATABASE_RESTORE_FILE` dan konfirmasi eksplisit `DATABASE_RESTORE_CONFIRM=replace-all-data`.
- `npm test` — jalankan tes validasi SOS, rate limit proxy, dan kontrak API assessment; tes integrasi PostgreSQL tersedia terpisah.

API aplikasi dilayani oleh Next.js Route Handlers; backend Express terpisah yang dahulu berjalan di port 5000 telah dihapus agar UI dan penyimpanan memakai satu jalur. Peta, rute, peringatan, assessment, dan status pengguna pada prototype merupakan data simulasi, bukan informasi real-time atau layanan darurat.

## Kesiapan offline dan keluarga

- Dari Beranda, pilih **Siapkan akses offline** saat masih terhubung internet. Halaman aplikasi dan berkas yang sudah dibuka akan dicache pada perangkat; checklist, titik kumpul, dan kontak cadangan disimpan di penyimpanan lokal browser.
- Peta dasar, data baru, sinkronisasi, dan panggilan telepon tetap memerlukan koneksi atau layanan perangkat. Halaman offline memberi pengingat keselamatan dasar, bukan panduan khusus yang menggantikan instruksi petugas.
- Check-in keluarga tetap manual. Setelah grup keluarga dibuat atau perangkat bergabung, profil, kebutuhan bantuan, status check-in, titik kumpul, dan kontak keluarga disinkronkan lewat API aplikasi; tidak ada pesan, notifikasi, atau pelacakan lokasi otomatis.
- Dari **Keluarga → Tambah Anggota**, QR dan token acak langsung dibuat (data keluarga disimpan di server agar tersinkron). Token hanya bisa dipakai sekali dan berlaku 24 jam. Anggota dapat memasukkan token, membuka tautan QR, atau memindai QR dari browser yang mendukung kamera dan `BarcodeDetector`. Jika pemindaian tidak tersedia, token dapat dimasukkan manual.
- Data grup disimpan di PostgreSQL. Token akses perangkat disimpan di localStorage dan hanya hash token disimpan di server; undang hanya orang tepercaya. Migrasi membaca file JSON lama hanya untuk pengimporan awal.
- Tautan QR memakai alamat website yang sedang dibuka. `localhost`/`127.0.0.1` hanya dapat dibuka di perangkat itu sendiri; untuk bergabung dari perangkat lain, hosting aplikasi harus dapat dijangkau oleh perangkat tersebut. Token undangan sekali pakai bukan pengganti autentikasi akun.
- Nomor darurat yang ditampilkan dapat berbeda ketersediaannya di tiap wilayah. Verifikasi lewat sumber resmi daerah. Kontak lokal baru ditandai sebagai telah dicek mandiri setelah pengguna mengisi sumber dan tanggal pengecekan.
- Penyimpanan lokal browser dapat dihapus oleh pengguna atau browser. Jangan menjadikan aplikasi ini satu-satunya salinan rencana, nomor penting, maupun data kesiapsiagaan.

## Tes integrasi PostgreSQL

Setelah konfigurasi database dan migrasi, jalankan `$env:RUN_DATABASE_INTEGRATION_TESTS='true'; npm test` di PowerShell atau `RUN_DATABASE_INTEGRATION_TESTS=true npm test` di bash untuk menguji autentikasi, verifikasi email, sesi, role, rate limit, dan undangan keluarga sekali pakai. Tes membuat lalu menghapus akun/grup sementara.

## Backup dan pemulihan

Isi `DATABASE_BACKUP_DIR` dengan direktori absolut di luar repository dan batasi aksesnya; backup berisi hash kata sandi, sesi, grup, serta laporan pribadi. Jalankan `npm run db:backup` untuk membuat snapshot konsisten. Untuk menguji pemulihan, gunakan database staging terpisah yang dibuat dari backup; jangan jalankan restore terhadap database production sebagai uji coba. Restore mengganti seluruh dokumen aplikasi dan hanya boleh dijalankan setelah memeriksa `DATABASE_URL`, file backup, dan menetapkan `DATABASE_RESTORE_CONFIRM=replace-all-data`. Enkripsi backup dan retensi di luar aplikasi tetap perlu dikonfigurasi sesuai kebijakan operasional.
