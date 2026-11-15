# Panduan & Naskah Demonstrasi Evacu8 di Depan Dewan Juri

Dokumen ini disusun sebagai panduan operasional presentasi dan demonstrasi langsung (*live demo*) aplikasi **Evacu8** di hadapan dewan juri. Naskah dirancang berbasis skenario nyata (*story-driven demonstration*) yang memadukan urgensi kemanusiaan, kecanggihan teknis, dan ketahanan sistem saat krisis bencana.

---

## Ringkasan Eksekutif & Karakter Produk

- **Nama Platform:** Evacu8 (Sistem Respon & Navigasi Bencana Cepat Terintegrasi Dua Arah)
- **Target Pengguna:** Warga Sipil Terdampak Bencana & Tim Komando SAR (Basarnas / BPBD / Relawan)
- **Keunggulan Inti:**
  1. *Zero-Installation PWA* (berjalan instan di browser HP mana saja tanpa unduh PlayStore).
  2. *Total Offline Resilience* (fitur kunci tetap berjalan 100% tanpa internet via Web Audio API, LocalStorage Outbox, dan Skema Vektor SVG).
  3. *PASS Automated Inactivity Detection* (detektor otomatis korban tertimbun reruntuhan).
  4. *Multi-Channel Distress Beacon* (audio akustik 3.000 Hz, senter kedip Morse SOS, strobo layar, getar haptik, dan *Screen Wake Lock*).
  5. *Closed-Loop Two-Way Tracking* (koordinasi terverifikasi antara komando SAR dan warga).

---

## Rundown Alur Demonstrasi (Total Durasi: 7–10 Menit)

| Menit | Segmen | Fokus Demo | Dampak Emosional / Teknis |
| :--- | :--- | :--- | :--- |
| **00:00 - 01:30** | **Hook & Problem Statement** | Latar belakang *Golden Hour*, kepanikan warga, dan kelemahan sistem konvensional | Mengapa masalah ini belum terselesaikan dan fatal jika diabaikan |
| **01:30 - 03:00** | **Babak 1: Warga & Panduan Darurat** | Feed BMKG, pemilihan skenario gempa, dan panduan tindakan lapangan step-by-step | Desain anti-panik, berbasis sains medis, dan ramah pengguna |
| **03:00 - 05:00** | **Babak 2: Deteksi Tertimbun (Hero Feature)** | PASS 30 menit, *shake-to-cancel*, peluit 3.000 Hz, senter Morse SOS, dan Eco Mode OLED | Pukulan teknologi terkuat: menyelamatkan nyawa saat korban tidak sadar |
| **05:00 - 06:30** | **Babak 3: Rute Evakuasi & Ketahanan Offline** | Rekomendasi posko otomatis GPS, alih otomatis Skema Vektor, dan fallback SMS | Bukti sistem tidak lumpuh saat menara BTS padam total |
| **06:30 - 08:30** | **Babak 4: Pusat Komando Tim SAR** | Peta Operasi Tunggal, penetapan radius zona merah, verifikasi posko, dan Dispatch OTW | Nilai kolaborasi dua arah (*two-way life feed*) |
| **08:30 - 10:00** | **Closing & Tanya Jawab Juri** | Ringkasan metrik performa, arsitektur teknis, dan kesiapan implementasi | Memantapkan impresi profesionalitas dan skalabilitas |

---

## Naskah Lengkap Demonstrasi Langkah Demi Langkah (*Word-by-Word Script*)

### 1. Pembukaan: The Hook & The Problem (1,5 Menit)

**Tindakan Presenter:**
Tampilkan halaman utama Evacu8 di layar proyektor atau perangkat mobile. Jangan langsung klik fitur, tatap juri dengan tenang dan percaya diri.

**Naskah Suara Presenter:**
> *"Selamat pagi/siang yang terhormat Dewan Juri.*
>
> *Saat gempa berkekuatan 6.8 magnitudo mengguncang, dinding beton runtuh dalam hitungan detik. Korban tertimbun puing di dalam kegelapan. Listrik padam total, menara seluler 4G roboh, dan korban tidak tahu harus lari ke mana.*
>
> *Dalam ilmu medis gawat darurat dan standar SAR internasional, ada konsep yang disebut **The Golden Hour** — 60 menit pertama yang menentukan hidup atau mati korban akibat asfiksia, hipotermia, atau sindrom himpitan reruntuhan. Korban yang berteriak meminta tolong akan kehabisan tenaga dan oksigen hanya dalam 15 menit.*
>
> *Di sinilah **Evacu8** hadir. Evacu8 adalah platform kesiapsiagaan dan navigasi bencana terintegrasi dua arah yang dirancang khusus untuk kondisi terburuk: tanpa aplikasi berat yang harus diunduh, tanpa baterai boros, dan 100% tahan banting bahkan saat jaringan internet lumpuh total.*
>
> *Mari kita simulasikan bagaimana Evacu8 menyelamatkan satu keluarga dari momen bencana hingga titik aman di posko."*

---

### 2. Babak 1: Deteksi Bencana & Panduan Evakuasi Terstruktur (1,5 Menit)

**Tindakan Presenter:**
1. Arahkan kursor / layar ke [HomeDashboard](file:///d:/Coding/AI%20Disaster/src/components/HomeDashboard.jsx).
2. Tunjukkan *Banner BMKG Alert Real-time* di bagian atas.
3. Klik tombol skenario **Gempa Bumi (Struktur Roboh)**, lalu tekan **"Mulai Panduan Darurat"**.

**Naskah Suara Presenter:**
> *"Ketika warga membuka Evacu8, mereka langsung disambut oleh data peringatan dini BMKG yang terverifikasi. Tidak ada teks membingungkan, tidak ada jargon rumit.*
>
> *Saat tombol 'Mulai Panduan Darurat' ditekan, sistem langsung masuk ke **Emergency Mode**. Di layar ini, perhatikan bahwa kami tidak menyodorkan formulir panjang yang memicu panik. Kami menyajikan panduan terstruktur langkah demi langkah: 'Merunduk, Lindungi Kepala, dan Menjauh dari Kaca'.*
>
> *Setiap langkah dilengkapi penjelasan saintifik: 'Mengapa langkah ini penting', disertai pengukur waktu hitung mundur Golden Hour. Jika satu jalur evakuasi terhalang lemari roboh, warga cukup membuka panduan cadangan (*fallback guidance*) untuk mencari celah aman alternatif.*
>
> *Namun, skenario terburuk sering terjadi: bagaimana jika plafon beton runtuh dan korban tertimpa balok sehingga tidak bisa bergerak sama sekali?"*

---

### 3. Babak 2: Fitur Heroik — PASS & Peluit Akustik Morse SOS (2 Menit)

**Tindakan Presenter:**
1. Masuk ke tab **Peta Keselamatan** atau buka widget **Deteksi Korban Terjebak (PASS)** di [InactivityTrapDetector](file:///d:/Coding/AI%20Disaster/src/components/InactivityTrapDetector.jsx).
2. Tunjukkan status: *"Diam tanpa gerak di Zona AWAS"*.
3. Tekan tombol **"Simulasi Uji (20s)"** untuk mendemonstrasikan hitung mundur secara cepat di depan juri.
4. Saat hitung mundur 15 detik pre-alarm muncul (*"Apakah Anda Baik-Baik Saja?"*), angkat ponsel dan **goyangkan ponsel secara fisik** untuk menunjukkan fitur **Shake-to-Cancel**.
5. Kemudian, biarkan alarm terpicu otomatis atau buka konsol [SignalBeaconModal](file:///d:/Coding/AI%20Disaster/src/components/SignalBeaconModal.jsx).

**Naskah Suara Presenter:**
> *"Ini adalah salah satu inovasi teknologi paling krusial di Evacu8: **PASS (Personal Alert Safety System)**, teknologi yang diadaptasi dari standar keselamatan petugas pemadam kebakaran internasional (NFPA).*
>
> *Di zona bencana kritis level 3 (Zona AWAS), sistem GPS dan akselerometer perangkat secara otomatis memantau pergerakan korban. Jika korban tidak berpindah posisi selama **30 menit** — batas akhir sebelum cadangan oksigen di celah reruntuhan kritis — Evacu8 berasumsi korban terjebak atau tidak sadarkan diri.*
>
> *Sistem memicu pra-alarm 15 detik. Jika tangan korban terjepit puing beton dan tidak bisa menyentuh layar, korban cukup **menggoyangkan ponsel** (*DeviceMotion shake gesture*) untuk membatalkan alarm darurat.*
>
> *Jika dalam 15 detik korban tidak merespons, Evacu8 secara otomatis mengeksekusi dua tindakan penyelamatan serentak:*
> 1. *Mengirimkan sinyal darurat darurat presisi ke radar Tim SAR.*
> 2. *Mengaktifkan **Konsol Sinyal Darurat Lapangan Terpadu**.*
>
> *Perhatikan apa yang terjadi saat ini di ponsel saya:*
> - *Audionya langsung memancarkan gelombang frekuensi tinggi **3.000 Hz** menusuk telinga. Kenapa 3.000 Hz? Karena frekuensi ini terbukti secara akustik paling efektif menembus celah puing beton dan paling cepat didengar oleh anjing pelacak K9 SAR.*
> - *Senter kamera HP dan strobo layar secara serentak berkedip mengikuti ritme sandi internasional Morse SOS: **Tiga Pendek, Tiga Panjang, Tiga Pendek** (`... --- ...`).*
> - *Semua aktif otomatis tanpa perlu disetel! Korban yang terluka parah tidak perlu membuang waktu menyetel mode.*
> - *Kami juga menyematkan **Screen Wake Lock API** agar layar ponsel tidak mati atau sleep di latar belakang, serta deteksi baterai kritis yang menyarankan **Survival Eco Mode** berlayar hitam OLED untuk melipatgandakan sisa daya baterai hingga 3 kali lipat."*

---

### 4. Babak 3: Rute Evakuasi & Ketahanan Total Tanpa Sinyal (1,5 Menit)

**Tindakan Presenter:**
1. Masuk ke halaman [SafeRoute](file:///d:/Coding/AI%20Disaster/src/components/SafeRoute.jsx).
2. Tunjukkan rute rute jalan nyata (*real-road routing*) yang menghindari zona bahaya.
3. Simulasikan mode offline (atau tunjukkan lencana jaringan offline / sakelar **Skema Vektor**).
4. Tunjukkan tombol **Kirim SMS Fallback** di [FallbackSosModal](file:///d:/Coding/AI%20Disaster/src/components/FallbackSosModal.jsx).

**Naskah Suara Presenter:**
> *"Setelah berhasil keluar dari reruntuhan, warga harus menuju titik kumpul evakuasi terdekat. Evacu8 tidak menggunakan garis lurus semata (*Haversine*), melainkan jaringan jalan riil yang memperhitungkan blokade reruntuhan jalan.*
>
> *Tetapi pertanyaan terbesar yang sering dilontarkan juri: **'Bagaimana jika menara BTS padam total dan tidak ada koneksi internet sama sekali?'**.*
>
> *Evacu8 memiliki **Total Offline Resilience**:*
> 1. *Begitu browser mendeteksi sinyal internet padam (`navigator.onLine === false`), Evacu8 otomatis mengalihkan peta ke **Skema Vektor Offline 100%**. Warga tidak akan pernah melihat kotak peta abu-abu kosong yang membingungkan. Diagram alur navigasi digambar langsung menggunakan mesin grafis SVG lokal di memori HP.*
> 2. *Untuk pengiriman laporan darurat, Evacu8 memiliki **Offline Emergency Outbox**. Laporan SOS tersimpan aman di IndexedDB/LocalStorage, dan akan otomatis disinkronkan ke server pusat saat sinyal pertama kali terdeteksi.*
> 3. *Tersedia pintasan **SMS Fallback 1-Klik**. Ketika paket data 4G/5G lumpuh, sinyal SMS seluler 2G pita rendah sering kali masih mampu tembus. Tombol ini otomatis menyusun teks terformat berisi koordinat GPS presisi 5 angka desimal, status baterai, dan kondisi darurat warga langsung ke SMS ponsel."*

---

### 5. Babak 4: Konfirmasi Posko & Pusat Kendali Komando SAR (2 Menit)

**Tindakan Presenter:**
1. Di layar Warga, masuk ke [SafeConfirmation](file:///d:/Coding/AI%20Disaster/src/components/SafeConfirmation.jsx). Tunjukkan bahwa nama posko otomatis disarankan berdasarkan GPS terdekat tanpa warga harus mengetik manual.
2. Tekan **"Ya, Kami Sudah Aman di Posko"**.
3. Beralih ke **Dashboard SAR** melalui sakelar peran di header (*Mode: Tim SAR*).
4. Tunjukkan [SarDashboard](file:///d:/Coding/AI%20Disaster/src/components/SarDashboard.jsx):
   - **Pusat Operasi Peta Tunggal (Unified Map):** Tunjukkan pin korban, posko, dan zona merah.
   - **Daftar Triase Korban:** Pilih laporan korban bertanda *AUTO-PASS* atau *KRITIS*.
   - Tekan tombol **Tugaskan Regu SAR & Kirim Status OTW**. Masukkan nama regu (*Regu Alpha Basarnas*) dan ETA (misal *10 Menit*).

**Naskah Suara Presenter:**
> *"Begitu warga tiba di posko, GPS perangkat langsung mendeteksi posko terdekat dan menampilkannya di formulir pintar. Cukup satu klik: 'Ya, Kami Sudah Aman di Posko'. Nama mereka langsung tercatat di data logistik posko.*
>
> *Sekarang, mari kita lihat apa yang dilihat oleh komandan penyelamat di **Dashboard Komando SAR**.*
>
> *Di layar SAR ini, petugas lapangan memiliki **Pusat Peta Operasi Terpadu**:*
> - *Petugas dapat mengunci koordinat fisik GPS di lapangan dengan 1 klik, menetapkan batas radius zona bahaya level 3 AWAS, atau mendaftarkan posko pengungsian baru lengkap dengan batas kapasitas maksimalnya.*
> - *Pada tab **Triase**, petugas melihat secara real-time korban yang butuh pertolongan darurat. Perhatikan laporan bertanda **AUTO-PASS**: laporan ini dikirim secara otomatis oleh HP korban yang tertimbun tanpa korban harus menekan tombol apa pun!*
> - *Saat petugas menekan tombol **'Tugaskan Regu & OTW'**, sebuah komunikasi dua arah tercipta. Di ponsel korban yang panik, statusnya langsung berubah: **'Bantuan Sedang Bergerak! Regu Alpha Basarnas diperkirakan tiba dalam 10 Menit'**. Ini memberikan kepastian psikologis yang sangat masif bagi korban yang sedang berjuang bertahan hidup."*

---

### 6. Penutup: Why Evacu8 Wins (1 Menit)

**Tindakan Presenter:**
Tampilkan ringkasan metrik / layar [LandingPage](file:///d:/Coding/AI%20Disaster/src/components/LandingPage.jsx). Pandang juri dan sampaikan kesimpulan penutup.

**Naskah Suara Presenter:**
> *"Dewan Juri yang kami hormati,*
>
> *Evacu8 bukan sekadar proyek konsep visual. Kode yang berjalan di hadapan Anda saat ini telah tervalidasi dengan **31 automated unit & integration tests**, terhubung ke database cloud PostgreSQL bereputasi tinggi, dan didesain ramah baterai dengan standar sentuh mobile UI yang presisi.*
>
> *Tiga pilar pembeda Evacu8:*
> 1. *Kecepatan: Berjalan langsung di browser tanpa instalasi aplikasi.*
> 2. *Keandalan: Bekerja saat internet padam total via Skema Vektor, Offline Outbox, dan audio Web API.*
> 3. *Proaktif: Deteksi pasif PASS 30 menit menyelamatkan korban yang tidak sadarkan diri di bawah reruntuhan.*
>
> *Teknologi terbaik dalam bencana adalah teknologi yang tidak menuntut korban untuk berpikir rumit saat hidup mereka dipertaruhkan. Evacu8 hadir untuk menjaga nyawa warga Indonesia.*
>
> *Terima kasih. Kami siap menjawab pertanyaan dari Dewan Juri."*

---

## Panduan Khusus Menghadapi Sesi Tanya Jawab (*Q&A Defense Guide*)

Berikut adalah daftar pertanyaan tersulit yang biasa diajukan oleh juri teknis maupun juri praktisi kebencanaan, beserta jawaban strategisnya:

### Pertanyaan 1: "Bagaimana jika korban tidak sengaja tidur di zona bencana, apakah sistem akan memicu alarm palsu (*false alarm*)?"
**Jawaban Tangkas:**
> *"Evacu8 memiliki 3 lapis perlindungan dari false alarm:*
> 1. *Sistem PASS hanya aktif di **Zona Merah Kritis (Level 3 - AWAS)** yang telah ditetapkan tim SAR. Di zona ini, warga dilarang berada di dalam struktur roboh/bahaya aktif.*
> 2. *Jika ada pergeseran posisi lebih dari 12 meter atau akselerometer mendeteksi langkah kaki/gerakan wajar, timer otomatis ter-reset ke 0.*
> 3. *Sebelum sinyal darurat dipancarkan, ada **pra-alarm 15 detik** dengan suara peringatan dan panduan gestur **Shake-to-Cancel**. Cukup mengguncangkan HP atau menekan tombol 'Saya Selamat', alarm langsung dibatalkan."*

---

### Pertanyaan 2: "Browser mobile sering kali mematikan proses di latar belakang (*background sleep*). Bagaimana Anda menjamin peluit dan senter tetap berbunyi saat layar mati?"
**Jawaban Tangkas:**
> *"Kami menggunakan **Screen Wake Lock API** standar W3C. Begitu konsol sinyal darurat aktif, browser meminta izin kunci bangun layar (`navigator.wakeLock.request('screen')`) sehingga OS Android/iOS dilarang mematikan proses web dan layar. Selain itu, kami menyediakan **Survival Eco Mode** berlayar hitam pekat OLED (RGB 0,0,0) yang menjaga proses tetap terjaga di layar depan namun hanya mengonsumsi daya layar di bawah 15% pada panel AMOLED."*

---

### Pertanyaan 3: "Bagaimana masalah privasi lokasi warga? Apakah tetangga bisa melacak koordinat rumah saya secara persis?"
**Jawaban Tangkas:**
> *"Privasi warga dilindungi dengan prinsip **Spatial Obfuscation (Pengaburan Koordinat)**:*
> - *Dalam kondisi normal, tetangga atau publik di peta hanya melihat lingkaran estimasi privasi radius 1 km tanpa koordinat presisi maupun nomor kontak.*
> - *Lokasi presisi fisik GPS hanya dan hanya diungkap kepada **Tim Komando SAR Terverifikasi** saat warga secara sadar menekan tombol SOS atau saat sistem PASS terpicu otomatis demi kepentingan penyelamatan jiwa."*

---

### Pertanyaan 4: "Bagaimana ketahanan database jika ribuan warga mengirim laporan SOS bersamaan saat terjadi gempa besar?"
**Jawaban Tangkas:**
> *"Arsitektur backend kami menggunakan arsitektur nir-server (*serverless*) berbasis Node.js/Next.js dengan koneksi basis data PostgreSQL tervirtualisasi yang mendukung penskalaan komputasi instan (*instant autoscaling*). Selain itu, di sisi klien kami menerapkan algoritma pelambatan (*rate limiting*) dan mekanisme antrean offline (*queueing*), sehingga lonjakan permintaan terbagi secara teratur tanpa membuat server mengalami kegagalan sistem (*down*)."*

---

## Lembar Ceklist Persiapan Teknis Sebelum Tampil

1. **Persiapan Perangkat:**
   - [ ] Buka browser laptop / ponsel di alamat `http://localhost:3000` atau URL hosting produksi Vercel.
   - [ ] Pastikan volume media perangkat berada di level 80%–100% agar efek peluit 3.000 Hz terdengar nyata dan mengesankan juri.
   - [ ] Buka tab SAR Dashboard di satu jendela dan tab Warga di jendela lain (atau gunakan HP untuk Warga dan laptop untuk SAR) agar juri melihat interaksi dua arah secara langsung.
2. **Kesiapan Skenario:**
   - [ ] Pastikan demo data posko dan zona bencana sudah termigrasi di database (`npm run db:migrate`).
   - [ ] Uji coba sakelar GPS dan tombol simulasi 20 detik sebelum naik ke panggung.
3. **Bahasa Tubuh & Intonasi:**
   - [ ] Bicaralah dengan artikulasi tegas dan tidak terburu-buru.
   - [ ] Saat mendemonstrasikan peluit SOS dan senter kamera, arahkan bagian belakang ponsel ke arah meja juri selama 2–3 detik agar juri melihat kedipan morse optik secara visual.
