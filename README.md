# AI Disaster Assistant

Prototype web responsif pendamping keputusan dan evakuasi saat bencana.

## Menjalankan aplikasi

```sh
npm install
npm run dev
```

Buka `http://127.0.0.1:3000`. Aplikasi menggunakan Next.js App Router.

## Akun dan role

- Pengguna dapat membuat akun dengan nama, email, dan kata sandi. Nama akun dipakai pada profil keluarga dan laporan SOS; nama yang dikirim ke server tidak dapat diganti lewat payload browser.
- Akun baru menjadi **Pengguna**. Untuk menetapkan admin pertama, salin `.env.local.example` menjadi `.env.local`, isi `INITIAL_ADMIN_EMAIL`, buat `INITIAL_ADMIN_SECRET` dengan perintah contoh di berkas, lalu restart server. Saat mendaftar dengan email tersebut, masukkan kode bootstrap. Kode tidak disimpan di akun; admin awal mendapat akses **Tim SAR** dan wewenang mengubah role akun lain dari Panel SAR.
- Role Tim SAR dapat melihat dan memperbarui laporan SOS, serta menambahkan posko. Posko kontribusi tetap ditandai belum terverifikasi; role akun tidak berarti afiliasi atau verifikasi resmi lembaga.
- Laporan dan API detail dibatasi di server; akun biasa tidak menerima koordinat maupun detail laporan orang lain. Koordinat hanya disimpan saat pengguna mengirim SOS dengan persetujuan lokasi presisi. Lokasi GPS live tidak disimpan sebagai lokasi global.
- Service worker hanya menyimpan cache peta yang tidak berisi laporan atau lokasi presisi. Cache offline versi lama dibersihkan saat aplikasi diperbarui.
- Akun lokal disimpan di `data/accounts.json`; hash kata sandi menggunakan scrypt dan cookie sesi bersifat HttpOnly. Hosting produksi harus memakai HTTPS. Mode tamu tetap dapat memakai panduan non-akun dan data lokal. Tamu dapat mengirim laporan SOS anonim setelah menyetujui lokasi presisi; laporan berbasis akun memakai nama akun. Sinkronisasi keluarga tetap memerlukan akun.
- Ini autentikasi prototype, bukan layanan produksi: belum ada verifikasi email, reset kata sandi, perlindungan rate-limit lintas instance, audit log, atau database bersama. Kode bootstrap mengamankan penetapan admin awal tanpa verifikasi email, tetapi akun email lain tetap belum terverifikasi. Penyimpanan JSON hanya untuk satu server, dan kredensial/data darurat jangan digunakan sebagai kanal dispatch resmi.

## Perintah

- `npm run dev` — jalankan server pengembangan Next.js.
- `npm run build` — buat production build.
- `npm run start` — jalankan production build.
- `npm run server` — jalankan API demo Express pada port 5000.

Peta, rute, peringatan, dan status pengguna pada prototype merupakan data simulasi, bukan informasi real-time atau layanan darurat.

## Kesiapan offline dan keluarga

- Dari Beranda, pilih **Siapkan akses offline** saat masih terhubung internet. Halaman aplikasi dan berkas yang sudah dibuka akan dicache pada perangkat; checklist, titik kumpul, dan kontak cadangan disimpan di penyimpanan lokal browser.
- Peta dasar, data baru, sinkronisasi, dan panggilan telepon tetap memerlukan koneksi atau layanan perangkat. Halaman offline memberi pengingat keselamatan dasar, bukan panduan khusus yang menggantikan instruksi petugas.
- Check-in keluarga tetap manual. Setelah grup keluarga dibuat atau perangkat bergabung, profil, kebutuhan bantuan, status check-in, titik kumpul, dan kontak keluarga disinkronkan lewat API aplikasi; tidak ada pesan, notifikasi, atau pelacakan lokasi otomatis.
- Dari **Keluarga → Tambah Anggota**, QR dan token acak langsung dibuat (data keluarga disimpan di server agar tersinkron). Token hanya bisa dipakai sekali dan berlaku 24 jam. Anggota dapat memasukkan token, membuka tautan QR, atau memindai QR dari browser yang mendukung kamera dan `BarcodeDetector`. Jika pemindaian tidak tersedia, token dapat dimasukkan manual.
- Data grup disimpan di `data/family_groups.json` pada server dan tidak dimasukkan ke Git. Untuk hosting mandiri, gunakan HTTPS, batasi akses filesystem, dan arahkan `FAMILY_GROUPS_FILE` ke penyimpanan persisten yang terlindungi. Penyimpanan JSON ini ditujukan untuk satu server/aplikasi yang berjalan sendiri, bukan deployment serverless, banyak instance, atau layanan publik tanpa database bersama. Token akses perangkat disimpan di localStorage; undang hanya orang tepercaya.
- Tautan QR memakai alamat website yang sedang dibuka. `localhost`/`127.0.0.1` hanya dapat dibuka di perangkat itu sendiri; untuk bergabung dari perangkat lain, hosting aplikasi harus dapat dijangkau oleh perangkat tersebut. Token undangan sekali pakai bukan pengganti autentikasi akun.
- Nomor darurat yang ditampilkan dapat berbeda ketersediaannya di tiap wilayah. Verifikasi lewat sumber resmi daerah. Kontak lokal baru ditandai sebagai telah dicek mandiri setelah pengguna mengisi sumber dan tanggal pengecekan.
- Penyimpanan lokal browser dapat dihapus oleh pengguna atau browser. Jangan menjadikan aplikasi ini satu-satunya salinan rencana, nomor penting, maupun data kesiapsiagaan.
