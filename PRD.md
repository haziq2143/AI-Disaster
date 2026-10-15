PRODUCT REQUIREMENTS DOCUMENT

AI DISASTER ASSISTANT

Platform Web Pendamping Keputusan dan Evakuasi Saat Bencana

“Tetap tenang. Pahami situasi. Ambil langkah aman.”

Versi 1.1 — Dokumen Kebutuhan Produk untuk Lomba UI/UX

Tanggal: 15 Oktober 2026
Status: Revisi 1.1 — Acuan Prototype UI/UX Interaktif

Fokus: AI Emergency Mode · Global Safety Map · Family Safety · Safe Route · Anti-Abuse Protection

# Daftar Isi

1. Overview

2. Goals & Objectives

3. Target Audience & User Personas

4. Key Features & Functionality

## 4.13 Fake Location Detector (Location Anti-Spoofing)

Tujuan: mendeteksi indikasi bahwa lokasi yang dikirim pengguna ke Global Safety Map dimanipulasi melalui aplikasi atau mekanisme seperti Fake GPS/mock location, agar pin palsu lebih sulit dipublikasikan. Fitur ini menilai indikator risiko dan tidak menjamin kepastian mutlak.

Pemeriksaan platform: jika aplikasi berjalan pada platform yang mendukung, periksa indikator mock location atau sinyal integritas lokasi yang tersedia melalui API sistem operasi. Pada prototype berbasis web biasa, jangan mengklaim dapat mengetahui seluruh aplikasi Fake GPS yang terpasang atau berjalan di perangkat pengguna.

Pemeriksaan pendukung dapat mencakup konsistensi koordinat dari waktu ke waktu, akurasi dan usia pembacaan lokasi, perpindahan yang tidak masuk akal dalam interval singkat, serta ketidaksesuaian antara area yang dipilih manual dan lokasi perangkat bila izin lokasi diberikan.

Jangan mengandalkan satu sinyal saja. GPS drift, penggunaan VPN, jaringan lemah, kondisi indoor, mode hemat baterai, atau pengguna yang sedang bergerak dapat menghasilkan anomali yang sah. Tidak ditemukannya indikator mock location juga bukan bukti bahwa lokasi pasti asli.

Gunakan hasil pemeriksaan bertingkat: (1) tidak ditemukan indikator yang diketahui—pin tetap berlabel “Lokasi belum diverifikasi secara menyeluruh”; (2) indikator lemah—minta pengguna memperbarui lokasi atau memilih area perkiraan; (3) indikator kuat—tahan sementara publikasi pin untuk verifikasi/peninjauan. Dalam semua kondisi, pengguna tetap dapat membuka panduan darurat dan mengakses jalur meminta bantuan.

Status publik yang disarankan: “Lokasi belum diverifikasi”, “Perlu verifikasi tambahan”, atau “Sedang ditinjau”. Hindari label “lokasi asli/pasti valid” kecuali ada metode verifikasi yang benar-benar mendukung klaim tersebut. Jangan menampilkan skor risiko internal atau detail teknis deteksi kepada publik.

Sediakan mekanisme koreksi/banding jika lokasi salah ditandai. Simpan hanya data pemeriksaan minimum dengan akses terbatas dan retensi yang ditentukan. Jangan mengekspos koordinat presisi atau detail perangkat kepada pengguna lain.

Batasan prototype: seluruh hasil deteksi pada prototype web diberi label “DATA DEMO”. Deteksi mock location tingkat perangkat memerlukan implementasi sesuai platform, misalnya aplikasi native atau integrasi yang mendukung, serta pengujian teknis sebelum diklaim aktif.

5. Technical & Product Requirements

6. User Flow

7. UI/UX Requirements dan Daftar Screen

8. Success Metrics

9. Constraints & Assumptions

10. Risks & Mitigations

11. Timeline & Roadmap

12. Acceptance Criteria

Catatan: nomor halaman dapat berubah setelah dokumen diedit atau dibuka pada aplikasi pengolah kata.

# 1. Overview

## 1.1 Purpose

AI Disaster Assistant adalah konsep platform web responsif yang membantu masyarakat memahami langkah awal saat menghadapi situasi bencana. Produk mengubah informasi yang kompleks menjadi panduan tindakan yang ringkas, bertahap, mudah dibaca, dan mempertimbangkan kondisi pengguna serta anggota keluarga.

Dokumen ini menjadi acuan ruang lingkup produk, kebutuhan pengguna, fitur utama, alur penggunaan, persyaratan UI/UX, metrik keberhasilan, risiko, dan kriteria penerimaan untuk pembuatan prototype lomba. Fokus utama adalah kualitas pengalaman pengguna; integrasi data dan layanan eksternal pada tahap prototype dapat disimulasikan dengan data contoh yang diberi label jelas.

## 1.2 Background & Rationale

Dalam keadaan darurat, pengguna dapat mengalami kepanikan, keterbatasan waktu, koneksi internet yang tidak stabil, serta kesulitan memahami informasi yang panjang atau saling bertentangan. Informasi umum saja belum tentu menjawab pertanyaan praktis: apa yang harus dilakukan sekarang, siapa yang perlu dibantu lebih dahulu, dan ke mana harus bergerak jika rute aman telah terverifikasi.

- Information overload: pengguna harus memilah banyak informasi ketika waktu dan perhatian terbatas.

- Kebutuhan berbeda: anak-anak, lansia, penyandang disabilitas, dan orang yang membutuhkan obat atau bantuan mobilitas mungkin memerlukan rencana yang berbeda.

- Kesenjangan aksesibilitas: teks kecil, istilah teknis, navigasi rumit, atau ketergantungan pada input teks dapat menghambat penggunaan.

- Kepercayaan dan keselamatan: rekomendasi harus menjelaskan sumber dan batasannya, bukan memberi kepastian palsu.

## 1.3 Product Vision

Menjadi pendamping keputusan awal yang membantu pengguna beralih dari kebingungan menuju tindakan yang lebih terstruktur, tanpa menggantikan instruksi petugas resmi atau layanan darurat.

Fitur tambahan pada versi 1.1 adalah Global Safety Map: peta berbasis pin yang menampilkan status keselamatan yang dibagikan pengguna di berbagai wilayah, tidak terbatas pada anggota keluarga. Status merupakan laporan pengguna dengan waktu pembaruan, bukan bukti otomatis bahwa seseorang terjebak atau aman.

Perlindungan anti-penyalahgunaan menjadi persyaratan inti. Lokasi pribadi tidak ditampilkan secara publik secara default; pengguna harus memilih untuk membagikan status/lokasinya, menentukan tingkat presisi dan audiens, serta dapat menghentikan berbagi kapan saja.

## 1.4 Product Principles

- Emergency-first: tindakan paling penting ditampilkan terlebih dahulu.

- Simple under stress: kalimat singkat, satu tindakan utama per langkah, dan tombol besar.

- Accessible by default: kontras memadai, dukungan keyboard, ukuran teks yang terbaca, dan opsi input suara.

- Transparent AI: alasan, sumber, waktu pembaruan, dan tingkat kepastian ditampilkan bila tersedia.

- Safety over novelty: ketika data tidak cukup, sistem meminta klarifikasi atau mengarahkan pengguna ke sumber resmi.

# 2. Goals & Objectives

## 2.1 Goals

- Mengurangi beban kognitif melalui panduan tindakan yang diprioritaskan.

- Membantu pengguna menjelaskan kondisi melalui teks atau input suara.

- Menyediakan AI Situation Assessment yang mengubah informasi pengguna menjadi ringkasan kondisi dan langkah yang relevan.

- Mendukung perencanaan keselamatan keluarga melalui daftar anggota dan kebutuhan bantuan.

- Menyediakan Safe Route hanya jika data lokasi, rute, dan status keselamatan tersedia serta dapat diverifikasi.

- Menyediakan Emergency Checklist untuk kebutuhan dasar yang sesuai konteks.

- Mengubah antarmuka ke Emergency Mode ketika pengguna memilih atau mengonfirmasi kondisi darurat.

- Membuat prototype yang dapat diuji menggunakan skenario tugas yang jelas dan metrik usability.

Membantu pengguna melihat pin status keselamatan dari pengguna lain yang secara sadar memilih berbagi di Global Safety Map.

Mengurangi laporan palsu, spam, dan perilaku trolling melalui pembatasan laju, pelaporan komunitas, deteksi anomali, dan peninjauan moderator.

## 2.2 Non-Goals

- Bukan pengganti BMKG, BNPB/BPBD, petugas penyelamat, tenaga medis, atau layanan darurat.

- Tidak menjamin bahwa suatu lokasi atau rute sepenuhnya aman.

- Tidak melakukan dispatch ambulans, tim penyelamat, atau kendaraan secara otomatis.

- Tidak mengklaim pemantauan bencana real-time jika integrasi data belum tersedia.

- Tidak melakukan pelacakan lokasi terus-menerus tanpa persetujuan pengguna.

Tidak menampilkan lokasi presisi setiap akun secara otomatis atau membuat pengguna dapat dilacak secara diam-diam. Global Safety Map hanya menampilkan lokasi/status yang dibagikan sesuai persetujuan dan pengaturan visibilitas.

Tidak menganggap skor risiko atau deteksi anomali sebagai bukti final bahwa pengguna melakukan trolling; keputusan pembatasan berat memerlukan peninjauan atau bukti yang memadai.

- Tidak membuat diagnosis medis atau memutuskan evakuasi secara otonom tanpa mempertimbangkan instruksi resmi.

## 2.3 Prioritas Produk

| Prioritas | Fitur | Alasan |

| --- | --- | --- |

| P0 — Wajib prototype | Home, Situation Input, AI Assessment, Emergency Action, Emergency Mode | Mendemonstrasikan nilai inti dan alur keputusan utama. |

| P1 — Penting | Family Safety, Safe Route, Emergency Checklist, Safe Confirmation | Menunjukkan dukungan situasional dan kebutuhan keluarga. |

| P2 — Pengembangan lanjut | Notifikasi resmi, offline guidance terkurasi, sinkronisasi status keluarga | Membutuhkan validasi sumber, integrasi, dan pertimbangan privasi tambahan. |

| P1 — Penting | Global Safety Map, Family Safety, Safe Route, Emergency Checklist, Safe Confirmation | Memperluas dukungan keselamatan dari keluarga ke komunitas dengan persetujuan berbagi. |

| P2 — Pengembangan lanjut | Anti-abuse moderation, integrasi lokasi presisi untuk mitra resmi, notifikasi resmi, offline guidance | Memerlukan backend aman, proses moderasi, validasi hukum/privasi, dan sumber data tepercaya. |



# 3. Target Audience & User Personas

## 3.1 Target Audience

Masyarakat umum dari berbagai rentang usia yang membutuhkan panduan awal ketika terjadi bencana, termasuk pengguna yang tidak terbiasa memakai aplikasi kompleks. Prototype difokuskan pada penggunaan melalui browser desktop maupun mobile; desain mobile-first diprioritaskan karena perangkat ponsel kemungkinan menjadi perangkat yang paling mudah dijangkau saat situasi darurat.

## 3.2 Persona A — Pengguna dalam Situasi Darurat

| Elemen | Deskripsi |

| --- | --- |

| Nama persona | Dina, 27 tahun (persona fiktif) |

| Konteks | Berada di rumah ketika air mulai masuk dan harus memastikan keluarganya aman. |

| Tujuan | Mengetahui tindakan pertama, menilai kondisi, dan menemukan informasi evakuasi yang tepercaya. |

| Pain points | Panik, tidak tahu prioritas, informasi online terlalu panjang, khawatir terhadap anggota keluarga. |

| Kebutuhan UX | Tombol darurat yang jelas, langkah pendek, bahasa sederhana, sumber informasi, dan opsi input suara. |



## 3.3 Persona B — Pendamping Anggota Keluarga

| Elemen | Deskripsi |

| --- | --- |

| Nama persona | Rizal, 34 tahun (persona fiktif) |

| Konteks | Bersama orang tua lanjut usia dan seorang anak saat peringatan bencana. |

| Tujuan | Menyusun prioritas bantuan dan memastikan kebutuhan penting tidak terlewat. |

| Pain points | Sulit mengingat kebutuhan semua anggota, waktu terbatas, rencana keluarga belum jelas. |

| Kebutuhan UX | Profil kebutuhan bantuan yang opsional, checklist, status anggota yang bisa diperbarui manual, dan petunjuk yang mudah dipahami. |



## 3.4 Persona C — Pengguna dengan Hambatan Akses

| Elemen | Deskripsi |

| --- | --- |

| Nama persona | Pak Arif, 61 tahun (persona fiktif) |

| Konteks | Tidak nyaman mengetik panjang dan membutuhkan teks yang jelas serta langkah sederhana. |

| Tujuan | Memahami tindakan penting tanpa harus membaca banyak informasi teknis. |

| Pain points | Teks kecil, istilah asing, menu bertingkat, dan input yang rumit. |

| Kebutuhan UX | Ukuran teks mudah dibaca, kontras kuat, navigasi konsisten, dukungan suara, dan kontrol yang besar. |



## 3.5 Prinsip Inklusivitas

- Jangan menjadikan input suara sebagai satu-satunya cara untuk berinteraksi.

- Sediakan pilihan “Saya tidak tahu” pada pertanyaan yang sulit dijawab.

- Kebutuhan disabilitas atau kondisi kesehatan dicatat hanya jika pengguna memilih untuk memasukkannya.

- Hindari mengasumsikan semua orang dapat berjalan cepat, membaca peta, atau menggunakan satu tangan.

# 4. Key Features & Functionality

## 4.1 Home Dashboard

- Menampilkan pilihan jenis kejadian: banjir, gempa, erupsi, kebakaran, longsor, dan “situasi lainnya”.

- Menyediakan CTA utama “Saya sedang dalam keadaan darurat” dan opsi “Cari informasi kesiapsiagaan”.

- Menampilkan pemberitahuan resmi hanya jika sumber, waktu, dan area cakupannya tersedia.

- Menampilkan akses cepat ke Family Safety dan Emergency Checklist tanpa memenuhi layar dengan informasi sekunder.

## 4.2 AI Situation Input

- Pengguna dapat mengetik atau memakai input suara untuk menjelaskan kondisi.

- Sistem menampilkan transkrip untuk dikoreksi sebelum dianalisis.

- Pertanyaan klarifikasi dibatasi pada informasi yang relevan, misalnya jenis bahaya, kondisi sekitar, dan apakah ada orang yang membutuhkan bantuan.

- Sistem tidak boleh menganggap lokasi atau detail yang tidak diberikan pengguna sebagai fakta.

## 4.3 AI Situation Assessment

- Merangkum informasi yang diberikan pengguna dengan bahasa sederhana.

- Menampilkan indikator kondisi berdasarkan aturan dan data yang tersedia; indikator bukan diagnosis atau kepastian keselamatan.

- Menghasilkan daftar tindakan yang diurutkan menjadi “Lakukan sekarang”, “Setelah lebih aman”, dan “Informasi tambahan”.

- Menampilkan alasan singkat untuk rekomendasi dan sumber resmi yang digunakan bila tersedia.

- Jika data tidak cukup atau saling bertentangan, sistem menyatakan keterbatasan dan meminta klarifikasi.

## 4.4 AI Emergency Mode

Fitur pembeda utama produk. Setelah pengguna memilih mode darurat atau sistem mengidentifikasi indikasi situasi berisiko, antarmuka menawarkan perpindahan ke tampilan darurat yang lebih sederhana. Untuk menghindari perubahan yang membingungkan, prototype menampilkan konfirmasi yang jelas dan menyediakan cara kembali jika pengguna tidak berada dalam keadaan darurat.

- Mengurangi elemen navigasi sekunder dan menonjolkan satu tindakan utama.

- Menggunakan teks besar, kontras tinggi, tombol besar, dan status langkah yang jelas.

- Membagi panduan menjadi langkah singkat dengan tombol “Selesai, lanjut” dan “Saya tidak bisa melakukan ini”.

- Tidak mengandalkan warna saja untuk menunjukkan tingkat urgensi; ikon dan label teks harus tersedia.

- Tidak menyatakan pengguna “aman” hanya karena semua langkah checklist telah selesai.

## 4.5 Family Safety

- Pengguna dapat menambahkan anggota keluarga dan kebutuhan bantuan secara opsional.

- Contoh kebutuhan: bantuan mobilitas, anak kecil, obat penting, atau kebutuhan komunikasi.

- Sistem menyusun checklist persiapan yang mempertimbangkan kebutuhan yang diinput, tanpa memprioritaskan nilai hidup seseorang secara otomatis.

- Status anggota keluarga diperbarui secara manual oleh pengguna; prototype tidak mengklaim pelacakan GPS real-time.

- Data keluarga harus dapat dihapus dan tidak dikumpulkan melebihi kebutuhan fitur.

## 4.6 Safe Route

- Menampilkan lokasi awal dan titik evakuasi hanya dari data yang telah diverifikasi atau data demo berlabel.

- Jika status rute tidak diketahui, tampilkan “Status rute belum terverifikasi” dan jangan memberi label “aman”.

- Menjelaskan alasan rekomendasi, jarak/waktu jika benar-benar tersedia, sumber, dan waktu pembaruan.

- Menyediakan alternatif teks untuk peta serta informasi aksesibilitas bila tersedia.

- Jika koneksi atau data rute tidak tersedia, arahkan pengguna untuk mengikuti petunjuk petugas dan sumber resmi; jangan mengarang rute.

## 4.7 Emergency Checklist

- Checklist dapat menyesuaikan kategori bencana dan kebutuhan yang diinput pengguna.

- Setiap item dapat ditandai selesai dan progres ditampilkan secara sederhana.

- Barang yang disarankan bersifat umum dan tidak boleh mengalihkan pengguna dari tindakan keselamatan langsung.

- Checklist bukan instruksi untuk kembali ke area berbahaya demi mengambil barang.

## 4.8 Safe Confirmation

- Setelah pengguna menyelesaikan alur, sistem menanyakan apakah pengguna dan anggota keluarga telah mencapai lokasi yang diarahkan petugas atau titik yang terverifikasi.

- Status “Saya sudah berada di tempat aman” adalah konfirmasi dari pengguna, bukan hasil deteksi otomatis.

- Sistem menampilkan langkah lanjutan yang relevan dan sumber resmi untuk pembaruan.

## 4.9 Official Information & Source Transparency

- Setiap informasi peringatan yang ditampilkan memiliki label sumber dan waktu pembaruan jika tersedia.

- Informasi yang tidak dapat diverifikasi diberi label “belum terverifikasi”.

- Prototype menggunakan data simulasi yang diberi label “DATA DEMO” dan tidak boleh disajikan seolah-olah kondisi real-time.

## 4.10 Privacy & Consent

- Minta izin sebelum mengakses mikrofon atau lokasi perangkat.

- Jelaskan tujuan penggunaan lokasi dan suara secara singkat.

- Hindari menyimpan transkrip darurat atau data anggota keluarga lebih lama dari yang diperlukan.

- Sediakan opsi untuk menghapus informasi keluarga dan riwayat input.

### 4.10.1 Optional Profile & Minimal Identity

Identitas profil bersifat opsional sejauh tidak dibutuhkan untuk keselamatan atau keamanan akun. Pengguna dapat memakai nama panggilan atau identitas pseudonim; nama lengkap bukan persyaratan untuk melihat panduan darurat atau membagikan status keselamatan.

Data seperti umur/tanggal lahir, foto profil, jenis kelamin, bio, dan informasi pribadi tambahan tidak wajib diisi. Formulir harus menandai setiap field dengan jelas sebagai “Opsional” dan menyediakan pilihan “Lewati untuk sekarang”.

Foto profil tidak boleh menjadi syarat untuk membuat atau melihat pin Global Safety Map. Pengguna dapat menggunakan avatar default. Jangan meminta tanggal lahir lengkap jika rentang usia sudah cukup untuk kebutuhan produk.

Tampilkan hanya identitas minimum pada pin publik, misalnya nama panggilan/pseudonim, status keselamatan, waktu pembaruan, dan area perkiraan. Foto profil dan umur tidak ditampilkan kepada publik secara default; pengguna harus memberi persetujuan terpisah bila ingin membagikannya.

Jangan pernah menampilkan alamat rumah, nomor telepon, email, tanggal lahir lengkap, atau identitas sensitif pada pin publik. Data profil harus dapat diedit dan dihapus, dengan penjelasan singkat tentang konsekuensi berbagi informasi.

## 4.11 Global Safety Map

Menampilkan peta global/berdasarkan area dengan pin pengguna yang memilih membagikan status saat bencana; fitur ini melengkapi Family Safety dan tidak terbatas pada daftar keluarga.

Setiap pin menggunakan status yang jelas: “Butuh bantuan”, “Sedang memeriksa kondisi”, “Sudah mengonfirmasi aman”, atau “Belum ada konfirmasi”. Status berasal dari laporan pengguna dan harus menampilkan waktu pembaruan.

Berbagi lokasi bersifat opt-in. Sebelum pin dipublikasikan, jelaskan siapa yang dapat melihatnya, jenis informasi yang dibagikan, dan berapa lama pin akan aktif. Sediakan tombol berhenti berbagi dan hapus laporan.

Default peta komunitas menggunakan area perkiraan atau pin yang digeneralisasi, bukan koordinat rumah yang presisi. Lokasi presisi hanya dibagikan melalui alur khusus yang disetujui pengguna kepada kontak tepercaya atau petugas/mitra resmi jika integrasi tersebut benar-benar tersedia.

Pin kedaluwarsa otomatis setelah periode yang ditetapkan produk atau ketika pengguna menghentikan berbagi. Pengguna dapat memperbarui status secara manual; sistem tidak boleh menyimpulkan “terjebak” hanya dari diam/tidak aktif.

Sediakan filter berdasarkan area dan status, legenda pin, alternatif daftar teks, serta penanda “laporan pengguna—belum diverifikasi” untuk menghindari kesan bahwa seluruh pin adalah data resmi.

Jika lokasi perangkat tidak tersedia atau izin ditolak, pengguna dapat memasukkan area secara manual atau memilih lokasi perkiraan. Peta tidak boleh memblokir akses ke panduan darurat.

## 4.12 Anti-Troll & Abuse Protection

Menyediakan tombol “Laporkan pin/laporan” dengan kategori seperti lokasi palsu, spam, laporan berulang, pelecehan, atau informasi yang menyesatkan. Pengguna yang dilaporkan tidak langsung ditampilkan identitas pelapornya.

Mendeteksi pola berisiko seperti pembuatan laporan berlebihan dalam waktu singkat, pin berpindah tidak wajar, duplikasi laporan, banyak laporan yang dibatalkan, atau akun yang terus-menerus dilaporkan. Sinyal ini digunakan untuk triase, bukan sebagai bukti otomatis.

Menerapkan rate limit, jeda sebelum publikasi untuk akun/laporan berisiko, verifikasi tambahan yang proporsional, serta pembatasan sementara terhadap spam. Jangan membuat hambatan berat bagi pengguna yang benar-benar sedang meminta pertolongan.

Menampilkan status moderasi yang proporsional: “sedang ditinjau”, “dibatasi sementara”, atau “dihapus setelah ditinjau”. Simpan jejak audit minimal untuk tindakan moderasi dan sediakan mekanisme banding.

Gunakan pendekatan bertingkat: laporan komunitas dan deteksi anomali → peninjauan → tindakan sesuai bukti. Hindari publikasi skor “troll” atau daftar hitam publik yang dapat memicu perundungan atau salah tuduh.

Untuk prototype lomba, gunakan akun dan laporan simulasi berlabel “DATA DEMO”; jangan mengklaim deteksi trolling berbasis AI sudah aktif bila backend/moderasi belum dibangun.

# 5. Technical & Product Requirements

## 5.1 Platform & Scope

Target deliverable lomba adalah prototype web UI/UX responsif. Implementasi backend dan integrasi layanan dapat menjadi fase lanjutan; semua layar demo harus membedakan data simulasi dengan data aktual.

| Area | Kebutuhan tahap prototype | Catatan implementasi lanjut |

| --- | --- | --- |

| Frontend | Figma prototype atau web prototype responsif; mobile-first. | HTML/CSS/JS atau framework sesuai kemampuan tim. |

| AI assessment | Alur simulasi berbasis skenario dan output terkurasi. | Integrasi model AI harus dibatasi oleh aturan keselamatan, pengujian, dan sumber yang disetujui. |

| Sumber bencana | Data demo berlabel atau contoh tampilan sumber resmi. | Integrasi hanya setelah API, lisensi, cakupan, dan frekuensi pembaruan diverifikasi. |

| Peta & rute | Peta statis/interaktif demo dengan label “simulasi”. | Butuh penyedia peta, data titik evakuasi resmi, dan status rute terkini. |

| Voice input | Mockup tombol mikrofon dan transkrip contoh bila belum terhubung. | Perlu izin browser, fallback input teks, dan penanganan kegagalan pengenalan suara. |

| Data keluarga | Data fiktif pada prototype. | Autentikasi, persetujuan, minimisasi data, enkripsi, dan kebijakan retensi. |

| Global Safety Map | Peta pin demo, status pengguna, filter area, timestamp, pilihan berbagi dan preview privasi. | Produksi memerlukan geospatial backend, consent management, expiry jobs, akses kontrol, dan validasi lokasi. |

| Anti-abuse & moderation | Mockup report pin, rate limit state, antrean moderasi dan status peninjauan. | Perlu aturan deteksi, logging minimal, moderator workflow, mekanisme banding, pengujian false positive/negative. |

| Location privacy | Pilihan lokasi perkiraan/presisi dan visibilitas berbagi. | Enkripsi, minimisasi, pemisahan lokasi presisi, kontrol retensi dan penghapusan. |



## 5.2 AI Output Contract

Output AI harus mengikuti format yang konsisten agar mudah dipahami dan dapat diuji. AI tidak boleh mengarang status peringatan, titik evakuasi, atau rute.

| Field | Deskripsi |

| --- | --- |

| Situation summary | Ringkasan singkat dari informasi yang benar-benar diberikan pengguna. |

| Missing information | Pertanyaan klarifikasi jika ada informasi penting yang belum diketahui. |

| Immediate actions | Langkah umum yang sesuai skenario dan telah ditinjau terhadap panduan keselamatan tepercaya. |

| Next steps | Langkah lanjutan setelah tindakan awal dilakukan atau pengguna berada di kondisi lebih aman. |

| Source & freshness | Sumber dan waktu pembaruan jika menggunakan informasi eksternal. |

| Confidence / limitation | Pernyataan keterbatasan; hindari skor kepastian yang menyesatkan. |

| Escalation | Arahkan ke petugas dan layanan resmi jika diperlukan; jangan mengklaim telah menghubungi mereka. |



## 5.3 Data Entities (Conceptual)

| Entitas | Atribut inti | Catatan |

| --- | --- | --- |

| User Session | session_id, created_at, consent_flags | Prototype dapat memakai sesi demo; data sensitif diminimalkan. |

| Situation Report | hazard_type, user_description, location_consent, created_at | Simpan hanya jika dibutuhkan dan disetujui. |

| Assessment | summary, action_steps, limitations, source_refs | Output harus dapat ditinjau dan diuji. |

| Family Member | display_name, support_needs_optional | Hindari data identitas sensitif yang tidak diperlukan. |

| Evacuation Point | name, location, source, verified_at | Data demo harus ditandai; titik nyata perlu verifikasi. |

| Checklist Item | label, category, completed | Status selesai bukan bukti bahwa situasi aman. |

| Global Safety Pin | pseudonymous_user_id, coarse_location, status, updated_at, expires_at, visibility_scope | Opt-in; area perkiraan untuk peta komunitas; status merupakan laporan pengguna. |

| Abuse Report | report_id, target_report_id, category, created_at, review_status | Identitas pelapor privat; akses moderator dibatasi; mendukung banding. |

| Moderation Event | event_id, report_id, action, reason_code, created_at | Audit minimal, retensi terbatas, tidak ditampilkan sebagai daftar hitam publik. |



## 5.4 Security & Reliability Requirements

- Gunakan HTTPS pada deployment.

- Validasi dan sanitasi input pengguna.

- Lindungi data lokasi, transkrip, dan informasi keluarga; batasi akses berdasarkan kebutuhan.

- Sediakan fallback jika AI, peta, mikrofon, atau koneksi gagal.

- Jangan menampilkan data pribadi dalam URL atau log yang dapat diakses publik.

- Sediakan halaman error yang menyatakan keterbatasan tanpa membuat klaim palsu.

Lokasi & Global Safety Map: simpan hanya data yang diperlukan (misalnya user_id pseudonim, area/lokasi yang dibagikan, status, waktu pembaruan, expiry_at, visibility_scope, consent_version). Pisahkan lokasi presisi dari data pin publik. Data profil opsional tidak boleh dikumpulkan secara default; pisahkan pengaturan visibilitas profil dari persetujuan berbagi lokasi. Fake Location Detector menyimpan indikator pemeriksaan dan hasil peninjauan minimum; jangan simpan riwayat koordinat presisi terus-menerus tanpa kebutuhan dan persetujuan yang jelas.

Anti-abuse: catat event moderasi minimum (report_id, kategori, waktu, status peninjauan, alasan tindakan) dengan akses terbatas dan retensi yang ditentukan. Jangan mengekspos IP, koordinat presisi, atau identitas pelapor pada antarmuka publik.

Sediakan kontrol hapus laporan dan pencabutan izin. Pastikan permintaan penghapusan atau penghentian berbagi menghentikan tampilan pin sesuai kebijakan retensi.

## 5.5 Accessibility Requirements

- Kontras teks dan latar memenuhi target aksesibilitas yang relevan.

- Semua kontrol utama dapat digunakan dengan keyboard dan memiliki fokus yang terlihat.

- Gunakan label teks selain warna atau ikon.

- Dukung pembesaran teks tanpa konten utama terpotong.

- Gunakan kalimat langsung, satu ide per instruksi, dan hindari jargon.

- Sediakan input teks sebagai alternatif input suara dan alternatif tekstual untuk peta.

# 6. User Flow

## 6.1 Main Emergency Flow

Home → pilih “Saya sedang dalam keadaan darurat” → pilih jenis kejadian / ceritakan kondisi → tinjau input → AI Situation Assessment → baca “Lakukan sekarang” → masuk AI Emergency Mode → buka Family Safety atau Safe Route bila relevan → checklist langkah → konfirmasi kondisi saat ini → tampilkan langkah berikutnya dan sumber resmi.

## 6.2 AI Assessment Flow

1. Terima input teks atau transkrip suara.

1. Tampilkan ulang ringkasan input agar pengguna dapat mengoreksi kesalahan.

1. Identifikasi informasi yang belum tersedia dan ajukan klarifikasi singkat jika diperlukan.

1. Susun ringkasan situasi, tindakan awal, keterbatasan, dan sumber bila tersedia.

1. Tampilkan rekomendasi sebagai langkah terpisah; pengguna tetap dapat memilih “Saya tidak bisa melakukan ini”.

1. Jika data kritis tidak tersedia, jangan menampilkan klaim lokasi atau rute aman; arahkan ke instruksi resmi.

## 6.3 Family Safety Flow

Family Safety → tambah anggota secara opsional → pilih kebutuhan bantuan yang relevan → simpan → saat skenario darurat, tampilkan checklist pendampingan → pengguna memperbarui status secara manual → konfirmasi anggota yang sudah bersama pengguna.

## 6.4 Global Safety Map Flow

Buka Global Safety Map → baca penjelasan privasi → izinkan lokasi atau pilih area manual → pilih status → tentukan cakupan dan presisi lokasi → tinjau preview pin → publikasikan → perbarui status atau hentikan berbagi. Pengguna lain dapat membuka pin, melihat status beserta waktu pembaruan, dan melaporkan penyalahgunaan.

## 6.5 Anti-Abuse Flow

Pengguna melaporkan pin/laporan → sistem melakukan rate limit dan pemeriksaan anomali → laporan masuk antrean peninjauan sesuai tingkat risiko → moderator atau aturan terverifikasi mengambil tindakan proporsional → pengguna dapat melihat status penanganan dan mengajukan banding bila dibatasi.

## 6.6 Safe Route Flow

Pilih “Temukan tempat evakuasi” → izinkan lokasi atau masukkan area secara manual → tampilkan titik/rute yang memiliki sumber dan status verifikasi → pengguna meninjau catatan rute → jika data tidak terverifikasi, tampilkan peringatan dan jangan merekomendasikannya sebagai rute aman.

## 6.7 Flow Diagram (Text)

HOME → SITUATION INPUT → REVIEW INPUT → AI ASSESSMENT → EMERGENCY MODE
↓
FAMILY SAFETY / SAFE ROUTE / CHECKLIST → USER CONFIRMATION → NEXT STEPS

Fallback: jika input tidak jelas, AI gagal, peta tidak tersedia, atau sumber tidak dapat diverifikasi, tampilkan status keterbatasan dan pilihan manual. Jangan mengisi data yang tidak diketahui dengan asumsi.

# 7. UI/UX Requirements dan Daftar Screen

## 7.1 Design Principles

- Mobile-first, tetapi tetap responsif untuk desktop.

- Prioritas visual: kondisi / tindakan utama → tindakan berikutnya → sumber / keterbatasan → navigasi sekunder.

- Gunakan warna urgensi secara konsisten, tetapi sertai dengan teks dan ikon.

- Hindari animasi yang mengganggu, countdown palsu, dan elemen dekoratif yang memperlambat pemahaman.

- Tampilkan loading, error, empty state, dan data demo secara konsisten.

## 7.2 Daftar 12 Screen Prototype

| No. | Nama Screen | Tujuan & komponen utama | Kriteria UX |

| --- | --- | --- | --- |

| 01 | Onboarding | Value proposition, penjelasan singkat, aksesibilitas, tombol Mulai. | Maksimal beberapa poin singkat; dapat dilewati. |

| 02 | Home Dashboard | Pilihan bencana, CTA darurat, akses informasi resmi, Family Safety. | CTA darurat paling menonjol; hindari terlalu banyak kartu. |

| 03 | Situation Input | Pilihan teks/suara, pilihan jenis kejadian, lokasi opsional. | Alternatif teks selalu tersedia; izin dijelaskan. |

| 04 | Review Input | Transkrip/teks, edit, konfirmasi, pertanyaan klarifikasi. | Pengguna dapat mengoreksi sebelum analisis. |

| 05 | AI Situation Assessment | Ringkasan, kondisi yang diketahui, informasi yang belum diketahui, sumber. | Jangan tampilkan status pasti jika bukti kurang. |

| 06 | AI Emergency Mode | Tindakan “Lakukan sekarang”, langkah progresif, tombol bantuan. | Satu tindakan utama per langkah; teks besar. |

| 07 | Family Safety | Daftar anggota, kebutuhan bantuan opsional, status manual. | Tidak mengklaim pelacakan real-time. |

| 08 | Safe Route | Peta/titik evakuasi, sumber, waktu pembaruan, catatan rute. | Rute tak terverifikasi tidak diberi label aman. |

| 09 | Emergency Checklist | Daftar barang/langkah sesuai skenario, progres. | Checklist tidak mendorong kembali ke lokasi berbahaya. |

| 10 | Safe Confirmation | Konfirmasi manual, langkah lanjutan, tautan sumber resmi. | Tidak menganggap checklist selesai berarti otomatis aman. |

| 11 | Global Safety Map | Peta pin global/area, filter status, legenda, timestamp, pilihan lihat daftar, CTA berbagi status. | Status laporan dibedakan dari data terverifikasi; lokasi presisi tidak terbuka secara default; ada fallback daftar teks. |

| 12 | Share Status & Report Abuse | Pengaturan persetujuan dan visibilitas pin, preview sebelum publikasi, expiry, tombol stop sharing, formulir laporan pin. | Bahasa privasi jelas; laporan bisa dibatalkan/dihapus; proses report tidak membuka identitas pelapor. |



## 7.3 Responsive & Interaction States

- Desktop: konten tindakan utama berada pada area fokus yang jelas; panel sumber dapat ditempatkan di sisi atau bawah.

- Mobile: satu kolom, tombol utama lebar, minim scroll sebelum tindakan pertama.

- Setiap tombol memiliki state normal, pressed, disabled, loading, success, dan error bila relevan.

- Form memiliki label, contoh input, pesan validasi, dan cara memperbaiki kesalahan.

- Jika browser tidak mendukung mikrofon atau lokasi ditolak, alur tetap dapat dilanjutkan secara manual.

- Global Safety Map menyediakan alternatif daftar, filter area/status, detail pin, dan alur pelaporan demo.

- Share Status menampilkan preview sebelum publikasi, persetujuan eksplisit, cakupan audiens, masa berlaku, serta kontrol berhenti berbagi.

- Micro-interaction memberi umpan balik pada pilihan, progres, dan perpindahan layar tanpa animasi berlebihan atau countdown palsu.

## 7.4 Visual Direction

| Elemen | Rekomendasi awal |

| --- | --- |

| Warna | Navy/putih untuk struktur; merah/oranye hanya untuk urgensi; hijau untuk status terkonfirmasi dengan label teks. |

| Tipografi | Sans-serif yang mudah dibaca; hierarki jelas; ukuran body nyaman di layar kecil. |

| Ikon | Ikon sederhana dan familiar, selalu didampingi label pada tindakan kritis. |

| Komponen | Emergency action card, status badge berlabel, checklist, source card, confirmation dialog. |

| Permukaan & interaksi | Glassmorphism ringan untuk panel non-darurat: latar transparan, blur secukupnya, border terang, dan bayangan lembut. Teks dan kontrol harus tetap terbaca; jangan memakai efek kaca pada area tindakan darurat bila mengurangi kontras. |

| Tone of voice | Tenang, langsung, tidak menghakimi, tidak menimbulkan kepanikan, dan tidak menjanjikan kepastian palsu. |



# 8. Success Metrics

| Metrik | Target awal untuk uji prototype | Metode |

| --- | --- | --- |

| Task completion | ≥ 80% peserta menyelesaikan tugas utama tanpa bantuan. | Usability testing berbasis skenario. |

| Time to first action | Mayoritas peserta menemukan tindakan utama dalam ≤ 15 detik pada skenario uji. | Catat waktu dari screen Home hingga tindakan pertama ditemukan. |

| Comprehension | ≥ 80% peserta dapat menjelaskan kembali tindakan pertama dengan benar. | Pertanyaan pasca-tugas. |

| Error recovery | Peserta dapat kembali dari input suara gagal ke input teks. | Uji skenario kegagalan mikrofon. |

| Source transparency | 100% screen data demo menandai data sebagai simulasi. | Audit desain dan checklist QA. |

| Accessibility review | Tidak ada kontrol utama yang hanya dapat dikenali melalui warna. | Review checklist aksesibilitas. |

| Trust calibration | Peserta memahami bahwa AI bukan pengganti petugas resmi. | Pertanyaan pemahaman setelah tugas. |

| Global Safety Map task success | ≥ 80% peserta dapat membagikan status dengan cakupan privasi yang benar pada uji prototype. | Usability testing berbasis skenario. |

| Abuse report comprehension | ≥ 80% peserta memahami cara melaporkan pin dan arti status “sedang ditinjau”. | Tugas pelaporan pin dan pertanyaan pasca-tugas. |



Target di atas merupakan target internal awal untuk pengujian prototype, bukan hasil penelitian yang sudah diperoleh. Angka perlu ditinjau setelah jumlah dan profil peserta uji ditentukan.

# 9. Constraints & Assumptions

## 9.1 Constraints

- Ruang lingkup lomba berfokus pada rancangan UI/UX dan demonstrasi prototype, bukan layanan darurat produksi.

- Akurasi rute sangat bergantung pada data resmi, pembaruan, kondisi lapangan, dan konektivitas.

- Input suara bergantung pada izin perangkat dan dukungan browser.

- Tidak semua pengguna memiliki koneksi stabil, GPS aktif, atau kemampuan menggunakan peta.

- Panduan bencana harus ditinjau berdasarkan sumber resmi yang relevan sebelum dipublikasikan.

## 9.2 Assumptions

- Pengguna memiliki akses ke browser web, setidaknya pada sebagian skenario.

- Untuk demo lomba, skenario, peta, dan anggota keluarga menggunakan data simulasi yang diberi label.

- Tim dapat melakukan uji prototype kecil untuk memvalidasi pemahaman alur.

- Integrasi API dan data resmi dianggap sebagai pekerjaan lanjutan, kecuali benar-benar telah tersedia dan diverifikasi.

## 9.3 Safety Boundaries

- Tidak memberi jaminan bahwa lokasi atau jalur tertentu aman.

- Tidak menyarankan pengguna mengabaikan instruksi petugas.

- Tidak mengarang nomor telepon darurat, status bencana, lokasi pengungsian, atau data real-time.

- Tidak mendorong pengguna mengambil barang jika hal itu meningkatkan bahaya.

- Untuk bahaya langsung, arahkan pengguna mengikuti instruksi petugas dan layanan darurat setempat.

# 10. Risks & Mitigations

| Risiko | Dampak | Mitigasi |

| --- | --- | --- |

| AI memberi saran salah atau terlalu umum | Pengguna salah memahami prioritas. | Batasi domain, gunakan panduan yang ditinjau, uji skenario, tampilkan batasan, dan eskalasi ke sumber resmi. |

| Rute tidak lagi aman | Pengguna diarahkan ke area berbahaya. | Tampilkan sumber dan waktu pembaruan; jangan menyebut aman jika status tidak terverifikasi. |

| Pengguna mengira demo adalah data live | Kepercayaan salah dan keputusan keliru. | Label “DATA DEMO” pada peta, peringatan, dan status. |

| UI terlalu ramai saat darurat | Tindakan penting sulit ditemukan. | Uji hirarki visual; satu tindakan utama per layar; kurangi navigasi sekunder. |

| Mikrofon atau internet gagal | Alur utama terhenti. | Sediakan input teks dan panduan statis terkurasi. |

| Data keluarga/lokasi terekspos | Risiko privasi. | Minimisasi data, persetujuan eksplisit, kontrol hapus, akses terbatas, dan retensi yang jelas. |

| Pengguna salah mengartikan status selesai sebagai aman | Pengguna berhenti waspada terlalu cepat. | Gunakan konfirmasi manual dan bahasa “langkah selesai”, bukan klaim keselamatan otomatis. |

| Informasi resmi terlambat diperbarui | Rekomendasi ketinggalan kondisi. | Tampilkan timestamp, sumber, dan peringatan jika data sudah lama atau tidak tersedia. |

| Lokasi pengguna terekspos atau dipakai untuk stalking | Bahaya privasi/fisik dan hilangnya kepercayaan. | Opt-in, area perkiraan sebagai default, cakupan audiens, masa kedaluwarsa, stop sharing, dan pemisahan lokasi presisi. |

| Trolling/laporan palsu membanjiri peta | Pengguna panik atau sulit menemukan permintaan bantuan yang valid. | Rate limit, deteksi anomali, pelaporan komunitas, peninjauan, label belum terverifikasi, dan audit minimal. |

| Sistem salah menandai pengguna sebagai troll | Pengguna yang butuh bantuan tertahan atau distigma. | Jangan gunakan label publik; perlakuan bertingkat, pemeriksaan manusia untuk tindakan berat, banding, dan uji false positive. |

| Pin lama dianggap kondisi terkini | Pengguna mengambil keputusan berdasarkan status yang usang. | Timestamp yang terlihat, expiry otomatis, minta konfirmasi ulang, dan status “belum ada konfirmasi”. |



# 11. Timeline & Roadmap

| Fase | Aktivitas | Output |

| --- | --- | --- |

| Fase 1 — Define | Tetapkan masalah, target user, tujuan, scope, dan batas keselamatan. | PRD dan problem statement. |

| Fase 2 — Research | Interview singkat/survei, susun persona, pain points, dan skenario. | Insight dan kebutuhan tervalidasi. |

| Fase 3 — Structure | Information architecture, user flow, low-fidelity wireframe. | Flow utama dan wireframe 12 screen, termasuk Global Safety Map dan Share Status & Report Abuse. |

| Fase 4 — Design | Design system, komponen, high-fidelity UI, responsive states. | UI final dan prototype interaktif. |

| Fase 5 — Validate | Uji tugas, catat kebingungan, revisi prioritas dan bahasa. | Temuan usability dan iterasi desain. |

| Fase 6 — Present | Susun problem-solution fit, demo skenario, metrik, risiko, roadmap. | Presentasi dan prototype siap lomba. |



## 11.1 Future Backlog

- Integrasi peringatan resmi dengan metadata sumber dan waktu pembaruan.

- Mode offline untuk panduan keselamatan yang telah ditinjau.

- Pengujian aksesibilitas dengan pengguna dari beragam rentang usia dan kebutuhan.

- Pengaturan notifikasi berbasis lokasi dengan persetujuan pengguna.

- Fitur berbagi status keluarga yang aman, hanya jika kebutuhan dan model privasinya sudah tervalidasi.

Integrasi produksi Global Safety Map dengan pin status berbagi berbasis persetujuan, area perkiraan, dan masa kedaluwarsa; prototype hanya menyimulasikan alur dan datanya.

Anti-abuse moderation workflow produksi: rate limit, pelaporan pin, antrean tinjauan, audit log minimal, dan banding; prototype hanya menyimulasikan pelaporan.

Uji false positive/false negative pada deteksi anomali dan evaluasi agar proteksi anti-spam tidak menghambat permintaan bantuan yang valid.

# 12. Acceptance Criteria

## 12.1 Main Flow

- Pengguna dapat memulai alur darurat dari Home tanpa harus membuat akun terlebih dahulu pada prototype.

- Pengguna dapat memasukkan kondisi lewat teks; input suara memiliki fallback yang jelas.

- Pengguna dapat meninjau dan mengoreksi input sebelum assessment ditampilkan.

- Assessment membedakan fakta dari input, informasi yang belum diketahui, dan rekomendasi.

- Emergency Mode menampilkan tindakan utama dalam format singkat dan dapat dipahami.

## 12.2 Family Safety & Checklist

- Pengguna dapat menambahkan atau melewati data anggota keluarga.

- Kebutuhan bantuan bersifat opsional dan dapat diedit.

- Checklist dapat ditandai selesai dan statusnya terlihat.

- UI tidak menyatakan lokasi atau anggota keluarga aman berdasarkan checklist semata.

Global Safety Map hanya menampilkan pin setelah persetujuan berbagi yang jelas; pengguna dapat memilih area perkiraan, melihat preview, mencabut izin, dan menghapus laporan. Profil publik menggunakan nama panggilan/pseudonim; umur dan foto profil opsional dan tersembunyi secara default. Pin menampilkan status verifikasi lokasi yang transparan; anomali tidak boleh otomatis dianggap bukti penipuan.

Pin menampilkan status dan waktu pembaruan; pin kedaluwarsa sesuai aturan dan status tidak aktif tidak otomatis diartikan sebagai terjebak atau aman.

Lokasi presisi tidak dipublikasikan secara default. Peta komunitas menampilkan area/pin perkiraan, kecuali pengguna secara eksplisit menyetujui alur berbagi presisi dengan penerima yang dijelaskan.

## 12.3 Safe Route & Sources

- Peta dan titik evakuasi demo diberi label simulasi.

- Titik/rute yang tidak terverifikasi tidak diberi label “aman” atau “direkomendasikan”.

- Informasi eksternal, bila ada, menampilkan sumber dan waktu pembaruan.

- Saat data lokasi/rute tidak tersedia, pengguna tetap mendapat alternatif teks dan arahan untuk mengikuti petugas resmi.

Pengguna dapat melaporkan pin yang diduga palsu atau spam; status laporan masuk ke alur peninjauan yang dapat didemokan.

Rate limit dan deteksi anomali tidak otomatis memberi label publik “troll”; tindakan moderasi tercatat secara terbatas dan memiliki proses peninjauan/banding.

Prototype membedakan moderasi simulasi dari sistem anti-abuse yang benar-benar berjalan.

## 12.4 Accessibility & Reliability

- Tombol utama dapat dikenali tanpa mengandalkan warna saja.

- Input teks tersedia sebagai alternatif suara.

- Error state menyampaikan masalah dan tindakan pemulihan yang jelas.

- Layout tetap terbaca pada ukuran layar mobile dan desktop yang diuji.

- Tidak ada klaim fitur real-time, pemantauan otomatis, atau integrasi layanan yang belum benar-benar diimplementasikan.

## 12.5 Definition of Done

- Dua belas screen utama terhubung melalui prototype interaktif, termasuk Global Safety Map dan Share Status & Report Abuse.

- Skenario demo end-to-end dapat diselesaikan tanpa dead end.

- Copywriting telah diperiksa agar singkat, tenang, dan tidak memberi jaminan palsu.

- Seluruh data simulasi diberi label yang terlihat.

- Global Safety Map mendukung filter status/area, tampilan pin dan daftar, waktu pembaruan, serta laporan demo.

- Share Status mewajibkan persetujuan eksplisit, menyediakan preview, pilihan area perkiraan, cakupan, masa berlaku, dan penghentian berbagi.

- Glassmorphism diterapkan pada permukaan non-darurat tanpa mengurangi keterbacaan, kontras, atau aksesibilitas.

- Setidaknya satu putaran usability testing dilakukan dan perubahan desain didokumentasikan.

- PRD, user flow, prototype, dan materi presentasi konsisten dalam istilah serta ruang lingkup fitur.

## Tambahan Acceptance Criteria — Fake Location Detector

- Prototype membedakan indikator lokasi yang belum diverifikasi, perlu verifikasi tambahan, dan sedang ditinjau; tidak mengklaim lokasi pasti asli hanya karena tidak ada indikator yang terdeteksi.

- Jika platform mendukung, pemeriksaan dapat menggunakan indikator mock location yang tersedia; pada web prototype, batasan deteksi aplikasi Fake GPS dijelaskan dengan jelas.

- Indikasi berisiko dapat memicu pembaruan lokasi, verifikasi tambahan, atau peninjauan sebelum pin dipublikasikan, tanpa menghalangi akses panduan dan jalur bantuan darurat.

- Pengguna dapat mengoreksi lokasi atau mengajukan peninjauan jika salah ditandai.

- Data demo dan status deteksi simulasi diberi label “DATA DEMO”; koordinat presisi dan detail metode deteksi tidak ditampilkan di peta publik.
