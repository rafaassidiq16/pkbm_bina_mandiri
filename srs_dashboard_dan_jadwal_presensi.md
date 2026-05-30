# SRS Mini: Modul Dashboard Terpadu dan Jadwal Mingguan
## Dashboard Multi-Role dan Integrasi Absensi Real-Time

> Dokumen ini menjadi acuan analisis sebelum implementasi pembaruan dashboard multi-role (Warga Belajar, Tutor, Admin TU, dan Pimpinan) serta halaman Jadwal Mingguan terintegrasi presensi. Dokumen ini mendefinisikan kebutuhan bisnis, hak akses, alur fungsional, relasi data, rancangan API, dan tahapan implementasi agar pengembangan berjalan terarah.

---

## 1. Latar Belakang

Saat ini, sistem e-learning PKBM Bina Mandiri sudah memiliki modul pembelajaran (materi, tugas, absensi) di dalam **Ruang Belajar**, namun:
- Dashboard warga belajar (siswa) masih terpisah-pisah untuk halaman materi, tugas, dan absensi, yang mengakibatkan **duplikasi navigasi dan membingungkan user**.
- Belum ada halaman **Jadwal Mingguan** terpusat bagi siswa untuk melihat agenda belajar harian sekaligus melakukan check-in kehadiran secara langsung ketika sesi dibuka oleh tutor.
- Tampilan dashboard untuk role non-siswa (Tutor, Admin TU, dan Pimpinan) masih berupa stub/sederhana dan kurang konsisten secara visual dengan dashboard warga belajar yang memiliki banner sambutan modern dan tata letak berbasis widget.

**Solusi yang diajukan:**
1. **Penyederhanaan Dashboard Siswa:** Mengubah dashboard utama menjadi pusat informasi cepat (widget-based) untuk rekap absensi, tugas, dan tagihan. Menghilangkan halaman materi, tugas, dan absensi terpisah di dashboard, lalu memindahkannya sepenuhnya ke dalam **Ruang Belajar** per mata pelajaran.
2. **Halaman Jadwal Mingguan:** Menyediakan halaman jadwal belajar mingguan yang dikelompokkan per hari. Jika tutor membuka sesi absensi untuk pelajaran tersebut, tombol **"Catat Presensi"** akan aktif secara real-time.
3. **Konsistensi Visual Multi-Role:** Merancang ulang dashboard Tutor, Admin TU, dan Pimpinan menggunakan layout seragam (Banner Sambutan + Info Card + Widget Relevan), sedangkan Super Admin tetap menggunakan dashboard teknis lama.

---

## 2. Hak Akses & Perilaku Menu

| Role | Dashboard Layout | Fitur Kunci di Dashboard | Navigasi Tambahan |
| :--- | :--- | :--- | :--- |
| **Warga Belajar (Siswa)** | Banner + Info Profil + Widget Ringkasan (Absensi, Tugas, Tagihan) | Akses cepat ke Ruang Belajar, Ujian, Tagihan, Profil. | Jadwal Mingguan, Ruang Belajar, Ujian, Tagihan |
| **Tutor** | Banner + Info Profil + Sesi Absensi Aktif + Ringkasan Mengajar | Buka/Tutup absensi real-time, ringkasan tugas belum dinilai. | Kelola Absensi, Materi & Tugas, Soal & Ujian |
| **Admin TU** | Banner + Info Profil + Statistik SPMB & Siswa | Verifikasi pendaftaran SPMB, kelola tagihan keuangan. | Verifikasi SPMB, Kelola Tagihan, Data Siswa |
| **Pimpinan** | Banner + Info Profil + Statistik Eksekutif (View Only) | Grafik tren kehadiran, ringkasan keuangan, jumlah siswa per jenjang. | Laporan Akademik, Laporan Keuangan |
| **Super Admin** | Dashboard teknis lama (tetap) | Kelola user, konfigurasi sistem, database, backup. | Menu Administrasi Sistem |

---

## 3. Spesifikasi Fungsional Halaman

### 3.1 Dashboard Warga Belajar (Siswa)
- **Banner Sambutan:** Menampilkan sapaan *"Halo, [Nama Siswa]"* beserta tanggal hari ini.
- **Card Profil Singkat:** Menampilkan foto profil, NIS, Jenjang Paket (A/B/C), Rombel, dan Nomor Telepon. Tombol "Edit Profil" diletakkan di sebelah kanan.
- **Widget Statistik Kehadiran:** Menampilkan persentase kehadiran siswa (misal: `85%`).
- **Widget Statistik Tagihan:** Menampilkan jumlah tagihan yang belum lunas.
- **Widget Aksi Cepat (Quick Actions):** Shortcut langsung menuju halaman:
  - Jadwal Mingguan (Check-In Absensi)
  - Ruang Belajar (Buka Materi & Tugas)
  - Ikuti Ujian
  - Klub Minat
  - Bayar Tagihan
- **Tabel Data Diri Lengkap:** Menampilkan NIK, Tanggal Lahir, Jenis Kelamin, Nama Wali, dan Alamat dengan tombol "Edit Data Diri".

### 3.2 Halaman Jadwal Mingguan & Presensi (Siswa)
- **Pengelompokkan Jadwal:** Ditampilkan berdasarkan hari (Senin s.d. Sabtu).
- **Detail Pertemuan:** Menampilkan nama mata pelajaran, nama tutor, jam pelaksanaan, metode belajar (online/offline/hybrid), lokasi kelas (atau link meeting), dan informasi pertemuan ke-n.
- **Tombol Presensi Terintegrasi:**
  - **Kondisi 1: Sesi Absensi Belum Dibuka Tutor** $\rightarrow$ Tombol berwarna abu-abu bertuliskan *"Absensi Belum Dibuka"*.
  - **Kondisi 2: Sesi Absensi Aktif (Mandiri)** $\rightarrow$ Tombol berwarna hijau bertuliskan **"Catat Presensi"** aktif beserta countdown timer sisa waktu. Siswa dapat mengklik tombol ini untuk check-in.
  - **Kondisi 3: Sudah Check-In/Tercatat** $\rightarrow$ Tombol berubah menjadi label hijau bertuliskan **"Hadir ✓"** (atau status lain seperti Sakit/Izin/Alpa jika diinput oleh tutor).

### 3.3 Dashboard Tutor
- **Banner Sambutan:** Menampilkan sapaan tutor beserta NIP dan mata pelajaran pengampu.
- **Peringatan Sesi Aktif:** Banner alert berwarna kuning berkedip jika ada sesi absensi rombel yang sedang berjalan (aktif) lengkap dengan tombol *"Pantau Sekarang"*.
- **Widget Ringkasan Mengajar:**
  - Jumlah tugas siswa yang dikumpulkan dan belum dinilai (butuh koreksi).
  - Jadwal kelas mengajar hari ini.
  - Ringkasan kehadiran rata-rata siswa kelas pengampu.
- **Quick Actions:** Shortcut ke Kelola Absensi, Input Materi & Tugas, dan Bank Soal/Ujian.

### 3.4 Dashboard Admin TU
- **Statistik SPMB Cepat:** Jumlah total pendaftar baru, pendaftar menunggu verifikasi, diterima, dan ditolak.
- **Quick Actions:** Shortcut ke verifikasi SPMB, pengelolaan tagihan, dan data siswa.

### 3.5 Dashboard Pimpinan (View Only)
- **Statistik Eksekutif:** Grafik/Card jumlah warga belajar per jenjang (Paket A, Paket B, Paket C).
- **Ringkasan Keuangan Bulanan:** Menampilkan total tagihan terbit, total terbayar (pendapatan masuk), dan total tunggakan bulan berjalan.

---

## 4. Struktur Database Terkait

Fitur ini memanfaatkan tabel-tabel yang sudah ada di database `pkbm_bina_mandiri.sql`:

### 4.1 Tabel `pertemuan_belajar` (Jadwal & Agenda)
Menyimpan rencana pertemuan tatap muka/online.
- `id` (INT UNSIGNED, PK)
- `rombel_id` (INT UNSIGNED, FK to `rombel`)
- `mapel_id` (INT UNSIGNED, FK to `mata_pelajaran`)
- `tutor_id` (INT UNSIGNED, FK to `users`)
- `pertemuan_ke` (INT)
- `judul` (VARCHAR)
- `metode_belajar` (ENUM: 'online', 'offline', 'hybrid')
- `tanggal_pelaksanaan` (DATE)
- `is_published` (TINYINT)

### 4.2 Tabel `sesi_absensi` (Sesi Presensi Aktif)
Dibuat ketika tutor mengaktifkan absensi kelas.
- `id` (INT UNSIGNED, PK)
- `pertemuan_id` (INT UNSIGNED, FK to `pertemuan_belajar`)
- `tutor_id` (INT UNSIGNED, FK to `users`)
- `rombel_id` (INT UNSIGNED, FK to `rombel`)
- `mapel_id` (INT UNSIGNED, FK to `mata_pelajaran`)
- `tanggal` (DATE)
- `mode` (ENUM: 'manual', 'mandiri')
- `waktu_mulai` (DATETIME)
- `durasi_timer` (INT) -- durasi dalam detik (misal: 300)
- `status_sesi` (ENUM: 'aktif', 'selesai')

### 4.3 Tabel `rekaman_kehadiran` (Log Kehadiran Siswa)
- `id` (INT UNSIGNED, PK)
- `sesi_id` (INT UNSIGNED, FK to `sesi_absensi`)
- `warga_belajar_id` (INT UNSIGNED, FK to `warga_belajar`)
- `status` (ENUM: 'hadir', 'izin', 'sakit', 'alpa')
- `waktu_check_in` (DATETIME)
- `metode` (ENUM: 'manual_tutor', 'mandiri_wb')

---

## 5. Kebutuhan API (Backend)

### 5.1 API yang Sudah Tersedia (Tinggal Diintegrasikan)
- **Siswa**:
  - `GET /api/siswa/profil/saya` $\rightarrow$ Mendapatkan profil lengkap WB.
  - `GET /api/absensi/rekap/saya` $\rightarrow$ Rekap persentase kehadiran.
  - `GET /api/tagihan` $\rightarrow$ Mendapatkan status pembayaran aktif.
  - `POST /api/absensi/sesi/:sesiId/checkin` $\rightarrow$ Check-in mandiri siswa.
- **Tutor / Admin / Pimpinan**:
  - `GET /api/absensi/sesi-aktif` $\rightarrow$ Mendapatkan absensi berjalan.
  - `GET /api/spmb/statistik` $\rightarrow$ Statistik pendaftar SPMB.
  - `GET /api/siswa/statistik-jenjang` $\rightarrow$ Jumlah siswa per Paket.
  - `GET /api/tagihan/ringkasan-bulanan` $\rightarrow$ Keuangan pimpinan.

### 5.2 API Baru yang Harus Dibuat (Skala Ringan)

#### 1. GET `/api/akademik/jadwal/siswa`
- **Tujuan:** Mengambil jadwal belajar mingguan siswa yang login (berdasarkan rombelnya).
- **Respons:**
```json
{
  "success": true,
  "data": [
    {
      "pertemuan_id": 12,
      "hari": "Senin",
      "tanggal": "2026-05-25",
      "jam": "08:00 - 10:00",
      "mapel": "Bahasa Indonesia",
      "tutor": "Herizka Fauzia W ST",
      "metode": "hybrid",
      "lokasi": "Ruang R213",
      "pertemuan_ke": 4,
      "sesi_absensi": {
        "id": 45,
        "status_sesi": "aktif",
        "mode": "mandiri",
        "sisa_timer_detik": 240,
        "sudah_absen": false
      }
    }
  ]
}
```

#### 2. GET `/api/tutor/dashboard-stats`
- **Tujuan:** Mengambil total tugas belum dinilai dan jadwal mengajar tutor hari ini.
- **Respons:**
```json
{
  "success": true,
  "data": {
    "tugas_belum_dinilai": 5,
    "jadwal_hari_ini": [
      {
        "pertemuan_id": 14,
        "rombel": "Paket C Kelas X-A",
        "mapel": "Matematika",
        "jam": "10:30 - 12:00",
        "metode": "online"
      }
    ]
  }
}
```

---

## 6. Rancangan UI/UX Frontend

### 6.1 Layout Jadwal Mingguan Siswa (Card Terintegrasi)
```text
+-------------------------------------------------------------------------+
| SENIN, 25 Mei 2026                                                      |
+-------------------------------------------------------------------------+
| [B. Indonesia] Pertemuan 4                                              |
| Tutor   : Herizka Fauzia W ST                                           |
| Waktu   : 08:00 - 10:00                                                 |
| Ruangan : R213 (Hybrid)                                                 |
|                                                                         |
|  [ KONDISI A: Belum Dibuka ]      [ KONDISI B: Aktif ]                   |
|  +--------------------------+     +----------------------------------+  |
|  |   Sesi Belum Aktif (x)   |     |  Catat Presensi (Aktif: 04:59)   |  |
|  +--------------------------+     +----------------------------------+  |
|                                                                         |
|  [ KONDISI C: Sudah Hadir ]                                             |
|  +--------------------------+                                           |
|  |         Hadir ✓          |                                           |
|  +--------------------------+                                           |
+-------------------------------------------------------------------------+
```

---

## 7. Validasi dan Error Handling

- **Batas Waktu Presensi:** Siswa tidak boleh diizinkan melakukan klik presensi jika sisa durasi timer di kolom `sesi_absensi.durasi_timer` sudah bernilai `0` (kadaluwarsa). Sistem backend wajib menolak request check-in dan mengembalikan status code `400 Bad Request` dengan pesan: *"Waktu check-in telah habis."*
- **Verifikasi Rombel:** Siswa hanya bisa check-in di kelas absensi yang sesuai dengan `rombel_id` pada profil dirinya.
- **Satu Kali Check-In:** Cegah duplikasi absensi dengan menggunakan mekanisme constraint unik pada tabel `rekaman_kehadiran` (`sesi_id`, `warga_belajar_id`).

---

## 8. Tahapan Eksistensi Rencana Kerja (Roadmap)

### Tahap 1: Persiapan Database
- Memastikan database `pkbm_bina_mandiri` telah dieksekusi dengan struktur tabel lengkap (`pertemuan_belajar`, `sesi_absensi`, `rekaman_kehadiran`).

### Tahap 2: Pengembangan Backend
- Tambahkan API router dan controller untuk:
  - `GET /api/akademik/jadwal/siswa` di `AkademikController.js`
  - `GET /api/tutor/dashboard-stats` di `UserController.js` atau controller relevan.

### Tahap 3: Restrukturisasi Frontend Siswa
- Hapus menu navigasi halaman Materi, Tugas, dan Absensi dari sidebar siswa.
- Buat halaman **Jadwal Mingguan** baru di `frontend/src/pages/siswa/JadwalSiswa.jsx`.
- Integrasikan widget absensi real-time di halaman Jadwal.

### Tahap 4: Redesain Dashboard Multi-Role (Tutor, Admin, Pimpinan)
- Integrasikan visual banner sambutan, layout widget, dan API statistik di:
  - `DashboardTutor.jsx`
  - `DashboardAdmin.jsx`
  - `DashboardPimpinan.jsx`

### Tahap 5: Pengujian (Testing)
- Uji alur dari pembukaan sesi oleh tutor hingga munculnya tombol presensi di akun siswa secara real-time.
