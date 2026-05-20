-- ============================================================
-- database/schema.sql
-- DDL (Data Definition Language) — PKBM Bina Mandiri
-- Versi Lengkap: mencakup SEMUA modul sistem
--
-- Cara menjalankan:
--   mysql -u root -p pkbm_bina_mandiri < database/schema.sql
--
-- Urutan tabel PENTING karena ada FOREIGN KEY antar tabel.
-- Jangan mengubah urutan CREATE TABLE di bawah ini.
-- ============================================================
USE pkbm_bina_mandiripkbm_bina_mandiri;
SELECT email, role, LEFT(password_hash, 7) AS cek_hash FROM users;

SHOW FULL TABLES IN pkbm_bina_mandiri WHERE TABLE_TYPE = 'VIEW';
DESCRIBE v_spmb_statistik;
SHOW CREATE VIEW v_ringkasan_keuangan_bulanan;
SELECT TABLE_NAME, VIEW_DEFINITION, CHECK_OPTION, IS_UPDATABLE FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = 'pkbm_bina_mandiri';

 ALTER TABLE pembayaran
  ADD COLUMN status_konfirmasi 
    ENUM('menunggu','terkonfirmasi','ditolak') 
    NOT NULL DEFAULT 'terkonfirmasi'
  AFTER bukti_path;
  
  CREATE OR REPLACE VIEW v_spmb_statistik AS
SELECT
  COUNT(*)                                                   AS total_pendaftar,
  SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END)       AS pending,
  SUM(CASE WHEN status = 'diterima' THEN 1 ELSE 0 END)       AS diterima,
  SUM(CASE WHEN status = 'ditolak'  THEN 1 ELSE 0 END)       AS ditolak
FROM pendaftar_spmb;
  
  DESCRIBE pembayaran;
  SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW';
  
  
-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS pkbm_bina_mandiri
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pkbm_bina_mandiri;

-- ============================================================
-- BAGIAN 1: FONDASI — USER & AKADEMIK DASAR
-- Tabel-tabel inti yang menjadi acuan foreign key tabel lain.
-- ============================================================

-- ============================================================
-- TABEL: users
-- Akun login untuk semua role dalam sistem.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama_lengkap  VARCHAR(100)  NOT NULL,
  email         VARCHAR(100)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('super_admin','admin','tutor','warga_belajar','pimpinan') NOT NULL,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  foto_profil   VARCHAR(255)  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email    (email),
  INDEX idx_role     (role),
  INDEX idx_active   (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: tahun_ajaran
-- Tahun akademik aktif. Hanya satu yang boleh is_aktif = 1.
-- ============================================================
CREATE TABLE IF NOT EXISTS tahun_ajaran (
  id                INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama_tahun_ajaran VARCHAR(20)  NOT NULL COMMENT 'Contoh: 2025/2026',
  is_aktif          TINYINT(1)   NOT NULL DEFAULT 0,
  tanggal_mulai     DATE         NOT NULL,
  tanggal_selesai   DATE         NOT NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: rombel
-- Rombongan Belajar (kelas) per jenjang dan tahun ajaran.
-- ============================================================
CREATE TABLE IF NOT EXISTS rombel (
  id              INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama_rombel     VARCHAR(50)  NOT NULL COMMENT 'Contoh: Paket C - Kelas 1A',
  jenjang         ENUM('paket_a','paket_b','paket_c') NOT NULL,
  tahun_ajaran_id INT          UNSIGNED NOT NULL,
  tutor_wali_id   INT          UNSIGNED NULL COMMENT 'Tutor wali kelas',
  kapasitas       INT          NOT NULL DEFAULT 30,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id),
  FOREIGN KEY (tutor_wali_id)   REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_jenjang (jenjang),
  INDEX idx_ta      (tahun_ajaran_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: warga_belajar
-- Profil lengkap siswa. Terpisah dari tabel users.
-- Dibuat otomatis saat SPMB disetujui (pipeline integrasi).
-- ============================================================
CREATE TABLE IF NOT EXISTS warga_belajar (
  id              INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT           UNSIGNED NOT NULL UNIQUE,
  nis             VARCHAR(20)   NOT NULL UNIQUE COMMENT 'Nomor Induk Siswa, format: PKBM-TAHUN-XXXX',
  nik             VARCHAR(20)   NULL COMMENT 'Nomor Induk Kependudukan',
  jenjang         ENUM('paket_a','paket_b','paket_c') NOT NULL,
  tanggal_lahir   DATE          NOT NULL,
  jenis_kelamin   ENUM('L','P') NOT NULL,
  alamat          TEXT          NULL,
  nama_wali       VARCHAR(100)  NULL,
  no_telp         VARCHAR(20)   NULL,
  rombel_id       INT           UNSIGNED NULL,
  tahun_ajaran_id INT           UNSIGNED NULL,
  is_aktif        TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)         REFERENCES users(id),
  FOREIGN KEY (rombel_id)       REFERENCES rombel(id) ON DELETE SET NULL,
  FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id) ON DELETE SET NULL,
  INDEX idx_user    (user_id),
  INDEX idx_jenjang (jenjang),
  INDEX idx_aktif   (is_aktif)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: tutor
-- Profil tambahan untuk Tutor/Pengajar.
-- ============================================================
CREATE TABLE IF NOT EXISTS tutor (
  id             INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT          UNSIGNED NOT NULL UNIQUE,
  nip            VARCHAR(30)  NULL COMMENT 'Nomor Induk Pegawai (opsional)',
  spesialisasi   VARCHAR(100) NULL COMMENT 'Mapel yang diajarkan',
  no_telp        VARCHAR(20)  NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: mata_pelajaran
-- Daftar mapel yang tersedia per jenjang.
-- ============================================================
CREATE TABLE IF NOT EXISTS mata_pelajaran (
  id          INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama        VARCHAR(100) NOT NULL,
  kode        VARCHAR(20)  NOT NULL UNIQUE,
  jenjang     ENUM('paket_a','paket_b','paket_c','semua') NOT NULL DEFAULT 'semua',
  deskripsi   TEXT         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: rombel_mapel
-- Relasi many-to-many: Rombel mengajarkan Mapel tertentu,
-- diajarkan oleh Tutor tertentu.
-- ============================================================
CREATE TABLE IF NOT EXISTS rombel_mapel (
  id              INT      UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rombel_id       INT      UNSIGNED NOT NULL,
  mapel_id        INT      UNSIGNED NOT NULL,
  tutor_id        INT      UNSIGNED NULL COMMENT 'Tutor yang mengajar mapel ini di rombel ini',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (rombel_id) REFERENCES rombel(id) ON DELETE CASCADE,
  FOREIGN KEY (mapel_id)  REFERENCES mata_pelajaran(id),
  FOREIGN KEY (tutor_id)  REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_rombel_mapel (rombel_id, mapel_id)
) ENGINE=InnoDB;

-- ============================================================
-- BAGIAN 2: MODUL SPMB (Seleksi Penerimaan Murid/Warga Baru)
-- Pendaftaran publik tanpa login.
-- ============================================================

-- ============================================================
-- TABEL: pendaftar_spmb
-- Data calon Warga Belajar yang mengisi form pendaftaran.
-- ============================================================
CREATE TABLE IF NOT EXISTS pendaftar_spmb (
  id                 INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama_lengkap       VARCHAR(100)  NOT NULL,
  email              VARCHAR(100)  NOT NULL,
  nik                VARCHAR(20)   NULL COMMENT 'Nomor Induk Kependudukan calon WB',
  no_telp            VARCHAR(20)   NOT NULL,
  jenjang_daftar     ENUM('paket_a','paket_b','paket_c') NOT NULL,
  tanggal_lahir      DATE          NOT NULL,
  jenis_kelamin      ENUM('L','P') NOT NULL,
  alamat             TEXT          NOT NULL,
  nama_wali          VARCHAR(100)  NOT NULL,
  -- Status alur verifikasi
  status             ENUM('pending','diterima','ditolak') NOT NULL DEFAULT 'pending',
  catatan_verifikasi TEXT          NULL COMMENT 'Alasan penolakan atau catatan Admin',
  diverifikasi_oleh  INT           UNSIGNED NULL COMMENT 'user_id Admin yang memverifikasi',
  tanggal_verifikasi DATETIME      NULL,
  tahun_ajaran_id    INT           UNSIGNED NULL,
  -- Setelah diterima, akun WB yang dibuat disimpan di sini
  warga_belajar_id   INT           UNSIGNED NULL COMMENT 'Diisi otomatis saat pipeline SPMB berjalan',
  created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (diverifikasi_oleh) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tahun_ajaran_id)   REFERENCES tahun_ajaran(id) ON DELETE SET NULL,
  FOREIGN KEY (warga_belajar_id)  REFERENCES warga_belajar(id) ON DELETE SET NULL,
  INDEX idx_status  (status),
  INDEX idx_email   (email)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: berkas_spmb
-- File yang diupload calon siswa saat pendaftaran (KK, ijazah, foto).
-- ============================================================
CREATE TABLE IF NOT EXISTS berkas_spmb (
  id                INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pendaftar_id      INT          UNSIGNED NOT NULL,
  jenis_berkas      ENUM('kk','ijazah','foto','dokumen_lain') NOT NULL,
  nama_file         VARCHAR(255) NOT NULL,
  path_file         VARCHAR(500) NOT NULL,
  status_verifikasi ENUM('menunggu','valid','tidak_valid') NOT NULL DEFAULT 'menunggu',
  catatan           VARCHAR(255) NULL COMMENT 'Catatan Admin jika berkas tidak valid',
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (pendaftar_id) REFERENCES pendaftar_spmb(id) ON DELETE CASCADE,
  INDEX idx_pendaftar (pendaftar_id)
) ENGINE=InnoDB;

-- ============================================================
-- BAGIAN 3: MODUL KEUANGAN
-- Tagihan SPP dan pencatatan pembayaran.
-- ============================================================

-- ============================================================
-- TABEL: tagihan_siswa
-- Tagihan SPP atau modul per Warga Belajar.
-- ============================================================
CREATE TABLE IF NOT EXISTS tagihan_siswa (
  id               INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warga_belajar_id INT           UNSIGNED NOT NULL,
  jenis_tagihan    ENUM('spp','modul','lain_lain') NOT NULL DEFAULT 'spp',
  keterangan       VARCHAR(200)  NOT NULL COMMENT 'Contoh: SPP Bulan Juli 2025',
  jumlah           DECIMAL(12,2) NOT NULL,
  tanggal_jatuh_tempo DATE       NOT NULL,
  status           ENUM('belum_bayar','lunas','cicilan') NOT NULL DEFAULT 'belum_bayar',
  tahun_ajaran_id  INT           UNSIGNED NULL,
  dibuat_oleh      INT           UNSIGNED NULL COMMENT 'user_id Admin yang membuat tagihan',
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (warga_belajar_id) REFERENCES warga_belajar(id),
  FOREIGN KEY (tahun_ajaran_id)  REFERENCES tahun_ajaran(id) ON DELETE SET NULL,
  FOREIGN KEY (dibuat_oleh)      REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_wb     (warga_belajar_id),
  INDEX idx_status (status),
  INDEX idx_jatuh  (tanggal_jatuh_tempo)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: pembayaran
-- Setiap pembayaran yang dicatat untuk sebuah tagihan.
-- Satu tagihan bisa punya banyak pembayaran (cicilan).
-- ============================================================
CREATE TABLE IF NOT EXISTS pembayaran (
  id           INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tagihan_id   INT           UNSIGNED NOT NULL,
  jumlah_bayar DECIMAL(12,2) NOT NULL,
  tanggal_bayar DATE         NOT NULL,
  metode       ENUM('tunai','transfer','lain_lain') NOT NULL DEFAULT 'tunai',
  bukti_path   VARCHAR(500)  NULL COMMENT 'Path file foto bukti transfer',
  status_konfirmasi ENUM('menunggu','terkonfirmasi','ditolak') NOT NULL DEFAULT 'terkonfirmasi',
  keterangan   VARCHAR(255)  NULL,
  dicatat_oleh INT           UNSIGNED NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tagihan_id)   REFERENCES tagihan_siswa(id) ON DELETE CASCADE,
  FOREIGN KEY (dicatat_oleh) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tagihan    (tagihan_id),
  INDEX idx_tgl_bayar  (tanggal_bayar)
) ENGINE=InnoDB;

-- ============================================================
-- BAGIAN 4: MODUL ABSENSI DUAL-MODE
-- Manual oleh Tutor dan Mandiri oleh Warga Belajar.
-- ============================================================

-- ============================================================
-- TABEL: sesi_absensi
-- Header sesi absensi yang dibuka oleh Tutor untuk satu rombel.
-- Satu sesi = satu pertemuan di satu hari.
-- ============================================================
CREATE TABLE IF NOT EXISTS sesi_absensi (
  id             INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tutor_id       INT           UNSIGNED NOT NULL,
  rombel_id      INT           UNSIGNED NOT NULL,
  mapel_id       INT           UNSIGNED NULL COMMENT 'Mapel yang sedang diajarkan',
  tanggal        DATE          NOT NULL,
  -- Mode 'manual': Tutor mengisi; 'mandiri': WB check-in sendiri
  mode           ENUM('manual','mandiri') NOT NULL DEFAULT 'manual',
  waktu_mulai    DATETIME      NULL,
  waktu_selesai  DATETIME      NULL,
  -- Untuk mode mandiri: berapa detik WB punya waktu untuk check-in
  durasi_timer   INT           NULL COMMENT 'Durasi timer mandiri dalam detik (contoh: 300 = 5 menit)',
  status_sesi    ENUM('aktif','selesai') NOT NULL DEFAULT 'aktif',
  catatan        VARCHAR(255)  NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tutor_id)  REFERENCES users(id),
  FOREIGN KEY (rombel_id) REFERENCES rombel(id),
  FOREIGN KEY (mapel_id)  REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
  INDEX idx_rombel  (rombel_id),
  INDEX idx_tanggal (tanggal),
  INDEX idx_status  (status_sesi)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: rekaman_kehadiran
-- Detail kehadiran satu WB dalam satu sesi absensi.
-- Setiap WB hanya punya SATU rekaman per sesi (UNIQUE KEY).
-- ============================================================
CREATE TABLE IF NOT EXISTS rekaman_kehadiran (
  id               INT      UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sesi_id          INT      UNSIGNED NOT NULL,
  warga_belajar_id INT      UNSIGNED NOT NULL,
  status           ENUM('hadir','izin','sakit','alpa') NOT NULL DEFAULT 'alpa',
  waktu_check_in   DATETIME NULL COMMENT 'Diisi saat WB check-in mandiri atau saat Tutor submit',
  -- Metode: siapa yang mengisi rekaman ini
  metode           ENUM('manual_tutor','mandiri_wb') NOT NULL DEFAULT 'manual_tutor',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (sesi_id)          REFERENCES sesi_absensi(id) ON DELETE CASCADE,
  FOREIGN KEY (warga_belajar_id) REFERENCES warga_belajar(id),
  -- Constraint: satu WB hanya boleh punya satu catatan per sesi
  UNIQUE KEY uq_sesi_wb (sesi_id, warga_belajar_id),
  INDEX idx_wb (warga_belajar_id)
) ENGINE=InnoDB;

-- ============================================================
-- BAGIAN 5: MODUL KBM & LMS
-- Materi, tugas, forum, dan jadwal pertemuan.
-- ============================================================

-- ============================================================
-- TABEL: materi_pembelajaran
-- Konten yang diupload Tutor: dokumen, video, atau link.
-- Dikelompokkan per rombel dan mapel.
-- ============================================================
CREATE TABLE IF NOT EXISTS materi_pembelajaran (
  id          INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rombel_id   INT          UNSIGNED NOT NULL,
  mapel_id    INT          UNSIGNED NOT NULL,
  tutor_id    INT          UNSIGNED NOT NULL COMMENT 'Tutor yang mengupload',
  judul       VARCHAR(200) NOT NULL,
  deskripsi   TEXT         NULL,
  -- Tipe konten: file yang diupload, embed video YouTube, atau link eksternal
  tipe        ENUM('dokumen','video_link','link_eksternal') NOT NULL DEFAULT 'dokumen',
  path_file   VARCHAR(500) NULL COMMENT 'Diisi jika tipe = dokumen',
  url         VARCHAR(500) NULL COMMENT 'Diisi jika tipe = video_link atau link_eksternal',
  urutan      INT          NOT NULL DEFAULT 0 COMMENT 'Urutan tampilan materi dalam rombel',
  -- Visibilitas: apakah materi sudah bisa diakses WB atau masih tersembunyi
  is_published TINYINT(1)  NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (rombel_id) REFERENCES rombel(id) ON DELETE CASCADE,
  FOREIGN KEY (mapel_id)  REFERENCES mata_pelajaran(id),
  FOREIGN KEY (tutor_id)  REFERENCES users(id),
  INDEX idx_rombel    (rombel_id),
  INDEX idx_mapel     (mapel_id),
  INDEX idx_published (is_published)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: tugas
-- Penugasan yang diberikan Tutor kepada satu rombel.
-- ============================================================
CREATE TABLE IF NOT EXISTS tugas (
  id          INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rombel_id   INT          UNSIGNED NOT NULL,
  mapel_id    INT          UNSIGNED NOT NULL,
  tutor_id    INT          UNSIGNED NOT NULL,
  judul       VARCHAR(200) NOT NULL,
  deskripsi   TEXT         NOT NULL COMMENT 'Instruksi detail tugas',
  deadline    DATETIME     NOT NULL COMMENT 'Batas waktu pengumpulan',
  nilai_maks  DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  is_aktif    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (rombel_id) REFERENCES rombel(id) ON DELETE CASCADE,
  FOREIGN KEY (mapel_id)  REFERENCES mata_pelajaran(id),
  FOREIGN KEY (tutor_id)  REFERENCES users(id),
  INDEX idx_rombel   (rombel_id),
  INDEX idx_deadline (deadline)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: pengumpulan_tugas
-- File yang dikumpulkan WB untuk menjawab sebuah tugas.
-- Satu WB hanya bisa mengumpulkan SATU jawaban per tugas.
-- ============================================================
CREATE TABLE IF NOT EXISTS pengumpulan_tugas (
  id               INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tugas_id         INT           UNSIGNED NOT NULL,
  warga_belajar_id INT           UNSIGNED NOT NULL,
  path_file        VARCHAR(500)  NOT NULL COMMENT 'Path file yang dikumpulkan',
  nama_file        VARCHAR(255)  NOT NULL,
  catatan_siswa    TEXT          NULL COMMENT 'Catatan atau komentar dari WB',
  -- Kolom penilaian: diisi oleh Tutor
  nilai            DECIMAL(5,2)  NULL COMMENT 'Nilai yang diberikan Tutor (NULL = belum dinilai)',
  feedback_tutor   TEXT          NULL COMMENT 'Komentar/feedback dari Tutor',
  dinilai_at       DATETIME      NULL,
  status           ENUM('terkumpul','dinilai') NOT NULL DEFAULT 'terkumpul',
  submitted_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tugas_id)         REFERENCES tugas(id) ON DELETE CASCADE,
  FOREIGN KEY (warga_belajar_id) REFERENCES warga_belajar(id),
  -- Satu WB hanya boleh punya satu pengumpulan per tugas
  UNIQUE KEY uq_tugas_wb (tugas_id, warga_belajar_id),
  INDEX idx_tugas  (tugas_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: forum_diskusi
-- Thread diskusi per rombel dan mapel.
-- ============================================================
CREATE TABLE IF NOT EXISTS forum_diskusi (
  id          INT      UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rombel_id   INT      UNSIGNED NOT NULL,
  mapel_id    INT      UNSIGNED NOT NULL,
  user_id     INT      UNSIGNED NOT NULL COMMENT 'Bisa Tutor atau WB yang membuka thread',
  judul       VARCHAR(200) NOT NULL,
  isi         TEXT     NOT NULL,
  is_pinned   TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Thread yang di-pin Tutor',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (rombel_id) REFERENCES rombel(id) ON DELETE CASCADE,
  FOREIGN KEY (mapel_id)  REFERENCES mata_pelajaran(id),
  FOREIGN KEY (user_id)   REFERENCES users(id),
  INDEX idx_rombel (rombel_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: forum_balasan
-- Balasan/komentar pada sebuah thread forum.
-- ============================================================
CREATE TABLE IF NOT EXISTS forum_balasan (
  id         INT      UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  forum_id   INT      UNSIGNED NOT NULL,
  user_id    INT      UNSIGNED NOT NULL,
  isi        TEXT     NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (forum_id) REFERENCES forum_diskusi(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id),
  INDEX idx_forum (forum_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: jadwal_kbm
-- Jadwal pertemuan (sinkronus) yang dibuat Tutor.
-- ============================================================
CREATE TABLE IF NOT EXISTS jadwal_kbm (
  id           INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rombel_id    INT          UNSIGNED NOT NULL,
  mapel_id     INT          UNSIGNED NOT NULL,
  tutor_id     INT          UNSIGNED NOT NULL,
  judul        VARCHAR(200) NOT NULL COMMENT 'Topik pertemuan',
  waktu_mulai  DATETIME     NOT NULL,
  waktu_selesai DATETIME    NOT NULL,
  -- Jenis: online (ada link) atau tatap muka
  jenis        ENUM('online','tatap_muka') NOT NULL DEFAULT 'online',
  link_meeting VARCHAR(500) NULL COMMENT 'Link Zoom/Google Meet (jika online)',
  lokasi       VARCHAR(200) NULL COMMENT 'Ruangan (jika tatap muka)',
  catatan      TEXT         NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (rombel_id) REFERENCES rombel(id) ON DELETE CASCADE,
  FOREIGN KEY (mapel_id)  REFERENCES mata_pelajaran(id),
  FOREIGN KEY (tutor_id)  REFERENCES users(id),
  INDEX idx_rombel  (rombel_id),
  INDEX idx_waktu   (waktu_mulai)
) ENGINE=InnoDB;

-- ============================================================
-- BAGIAN 6: MODUL UJIAN ONLINE
-- Bank soal, paket ujian, pengerjaan, dan penilaian.
-- ============================================================

-- ============================================================
-- TABEL: bank_soal
-- Kumpulan soal yang bisa digunakan dalam berbagai paket ujian.
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_soal (
  id          INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mapel_id    INT          UNSIGNED NULL COMMENT 'NULL untuk soal asesmen bakat (lintas mapel)',
  tutor_id    INT          UNSIGNED NOT NULL COMMENT 'Tutor yang membuat soal',
  jenjang     ENUM('paket_a','paket_b','paket_c','semua') NOT NULL DEFAULT 'semua',
  -- Tipe soal
  tipe        ENUM('pilihan_ganda','essay') NOT NULL DEFAULT 'pilihan_ganda',
  -- Kategori: untuk membedakan soal akademik vs soal asesmen bakat minat
  kategori    ENUM('akademik','bakat_minat') NOT NULL DEFAULT 'akademik',
  pertanyaan  TEXT         NOT NULL,
  -- Untuk pilihan ganda: simpan pilihan sebagai JSON
  -- Contoh: [{"kunci":"A","teks":"Jakarta"},{"kunci":"B","teks":"Bandung"}]
  pilihan     JSON         NULL COMMENT 'Array pilihan jawaban, hanya untuk pilihan_ganda',
  kunci_jawaban VARCHAR(10) NULL COMMENT 'Kunci jawaban (A/B/C/D), hanya untuk pilihan_ganda',
  skor_benar  DECIMAL(5,2) NOT NULL DEFAULT 1.00 COMMENT 'Poin jika jawaban benar',
  -- Tag untuk asesmen bakat (dimensi yang diukur soal ini)
  tag_dimensi VARCHAR(50)  NULL COMMENT 'Contoh: logika, seni, sosial, sains',
  is_aktif    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
  FOREIGN KEY (tutor_id) REFERENCES users(id),
  INDEX idx_mapel    (mapel_id),
  INDEX idx_jenjang  (jenjang),
  INDEX idx_kategori (kategori)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: paket_ujian
-- Kumpulan soal yang dirakit menjadi satu ujian tertentu.
-- ============================================================
CREATE TABLE IF NOT EXISTS paket_ujian (
  id          INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rombel_id   INT          UNSIGNED NULL COMMENT 'NULL jika ujian untuk semua / asesmen bakat',
  mapel_id    INT          UNSIGNED NULL,
  tutor_id    INT          UNSIGNED NOT NULL,
  judul       VARCHAR(200) NOT NULL COMMENT 'Contoh: UTS Matematika Semester 1',
  deskripsi   TEXT         NULL,
  -- Jenis ujian
  jenis       ENUM('uh','uts','uas','bakat_minat','latihan') NOT NULL DEFAULT 'uh',
  durasi_menit INT         NOT NULL DEFAULT 60 COMMENT 'Durasi pengerjaan dalam menit',
  -- Opsi keacakan
  acak_soal   TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = urutan soal diacak per siswa',
  acak_pilihan TINYINT(1)  NOT NULL DEFAULT 0 COMMENT '1 = urutan pilihan jawaban diacak',
  nilai_lulus DECIMAL(5,2) NOT NULL DEFAULT 60.00,
  is_aktif    TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = ujian sudah dibuka untuk WB',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (rombel_id) REFERENCES rombel(id) ON DELETE CASCADE,
  FOREIGN KEY (mapel_id)  REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
  FOREIGN KEY (tutor_id)  REFERENCES users(id),
  INDEX idx_rombel (rombel_id),
  INDEX idx_jenis  (jenis)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: paket_ujian_soal
-- Relasi many-to-many: soal mana saja yang ada dalam satu paket ujian.
-- ============================================================
CREATE TABLE IF NOT EXISTS paket_ujian_soal (
  id            INT      UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  paket_ujian_id INT     UNSIGNED NOT NULL,
  soal_id       INT      UNSIGNED NOT NULL,
  nomor_urut    INT      NOT NULL DEFAULT 0 COMMENT 'Urutan soal dalam paket (bisa diacak saat tampil)',

  FOREIGN KEY (paket_ujian_id) REFERENCES paket_ujian(id) ON DELETE CASCADE,
  FOREIGN KEY (soal_id)        REFERENCES bank_soal(id) ON DELETE CASCADE,
  UNIQUE KEY uq_paket_soal (paket_ujian_id, soal_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: sesi_ujian
-- Rekaman satu kali pengerjaan ujian oleh satu WB.
-- Satu WB hanya boleh mengerjakan satu paket ujian satu kali.
-- ============================================================
CREATE TABLE IF NOT EXISTS sesi_ujian (
  id               INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  paket_ujian_id   INT           UNSIGNED NOT NULL,
  warga_belajar_id INT           UNSIGNED NOT NULL,
  waktu_mulai      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  waktu_selesai    DATETIME      NULL COMMENT 'Diisi saat WB submit atau waktu habis',
  -- Status pengerjaan
  status           ENUM('sedang_berjalan','selesai','timeout') NOT NULL DEFAULT 'sedang_berjalan',
  -- Nilai akhir: dihitung otomatis untuk pilgan, manual untuk essay
  nilai_total      DECIMAL(5,2)  NULL COMMENT 'Diisi setelah semua jawaban dinilai',
  is_lulus         TINYINT(1)    NULL COMMENT 'NULL = belum ada nilai, 1 = lulus, 0 = tidak lulus',
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (paket_ujian_id)   REFERENCES paket_ujian(id),
  FOREIGN KEY (warga_belajar_id) REFERENCES warga_belajar(id),
  UNIQUE KEY uq_paket_wb (paket_ujian_id, warga_belajar_id),
  INDEX idx_wb     (warga_belajar_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: jawaban_ujian
-- Jawaban WB untuk setiap soal dalam sesi ujian.
-- ============================================================
CREATE TABLE IF NOT EXISTS jawaban_ujian (
  id           INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sesi_ujian_id INT          UNSIGNED NOT NULL,
  soal_id      INT           UNSIGNED NOT NULL,
  -- Untuk pilihan ganda: isi dengan 'A'/'B'/'C'/'D'
  -- Untuk essay: isi dengan teks jawaban
  jawaban      TEXT          NULL,
  -- Penilaian: otomatis untuk pilgan, manual untuk essay
  skor         DECIMAL(5,2)  NULL COMMENT 'NULL = belum dinilai (essay)',
  -- Untuk asesmen bakat: dimensi yang dipilih oleh WB
  catatan_penilai TEXT       NULL COMMENT 'Catatan Tutor saat menilai essay',
  dinilai_at   DATETIME      NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (sesi_ujian_id) REFERENCES sesi_ujian(id) ON DELETE CASCADE,
  FOREIGN KEY (soal_id)       REFERENCES bank_soal(id),
  UNIQUE KEY uq_sesi_soal (sesi_ujian_id, soal_id),
  INDEX idx_sesi (sesi_ujian_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: hasil_asesmen_bakat
-- Skor per dimensi bakat WB setelah mengerjakan ujian bakat minat.
-- Digunakan untuk memberikan rekomendasi Klub Minat Bakat.
-- ============================================================
CREATE TABLE IF NOT EXISTS hasil_asesmen_bakat (
  id               INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sesi_ujian_id    INT           UNSIGNED NOT NULL UNIQUE,
  warga_belajar_id INT           UNSIGNED NOT NULL,
  -- Skor per dimensi (0-100)
  skor_logika      DECIMAL(5,2)  NOT NULL DEFAULT 0,
  skor_seni        DECIMAL(5,2)  NOT NULL DEFAULT 0,
  skor_sosial      DECIMAL(5,2)  NOT NULL DEFAULT 0,
  skor_sains       DECIMAL(5,2)  NOT NULL DEFAULT 0,
  skor_bahasa      DECIMAL(5,2)  NOT NULL DEFAULT 0,
  skor_olahraga    DECIMAL(5,2)  NOT NULL DEFAULT 0,
  dimensi_tertinggi VARCHAR(50)  NOT NULL COMMENT 'Dimensi dengan skor tertinggi',
  rekomendasi      TEXT          NULL COMMENT 'Teks rekomendasi klub yang dibuat sistem',
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (sesi_ujian_id)    REFERENCES sesi_ujian(id),
  FOREIGN KEY (warga_belajar_id) REFERENCES warga_belajar(id),
  INDEX idx_wb (warga_belajar_id)
) ENGINE=InnoDB;

-- ============================================================
-- BAGIAN 7: MODUL KLUB MINAT BAKAT
-- Kegiatan ekstrakurikuler lintas jenjang.
-- ============================================================

-- ============================================================
-- TABEL: klub_minat_bakat
-- Daftar klub yang tersedia di PKBM.
-- ============================================================
CREATE TABLE IF NOT EXISTS klub_minat_bakat (
  id           INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama         VARCHAR(100) NOT NULL,
  deskripsi    TEXT         NULL,
  kategori     VARCHAR(50)  NULL COMMENT 'Contoh: seni, olahraga, teknologi, bahasa',
  -- Pembimbing klub
  pembimbing_id INT         UNSIGNED NULL COMMENT 'user_id Tutor yang membimbing',
  kapasitas    INT          NOT NULL DEFAULT 20,
  is_aktif     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (pembimbing_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_aktif (is_aktif)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: anggota_klub
-- Pendaftaran WB ke klub. Lintas jenjang diizinkan.
-- ============================================================
CREATE TABLE IF NOT EXISTS anggota_klub (
  id               INT      UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  klub_id          INT      UNSIGNED NOT NULL,
  warga_belajar_id INT      UNSIGNED NOT NULL,
  tahun_ajaran_id  INT      UNSIGNED NOT NULL,
  status           ENUM('aktif','tidak_aktif') NOT NULL DEFAULT 'aktif',
  tanggal_daftar   DATE     NOT NULL,
  catatan          VARCHAR(255) NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (klub_id)          REFERENCES klub_minat_bakat(id) ON DELETE CASCADE,
  FOREIGN KEY (warga_belajar_id) REFERENCES warga_belajar(id),
  FOREIGN KEY (tahun_ajaran_id)  REFERENCES tahun_ajaran(id),
  -- WB hanya bisa daftar ke klub yang sama satu kali per tahun ajaran
  UNIQUE KEY uq_klub_wb_ta (klub_id, warga_belajar_id, tahun_ajaran_id),
  INDEX idx_klub (klub_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: jadwal_klub
-- Jadwal kegiatan untuk setiap klub.
-- ============================================================
CREATE TABLE IF NOT EXISTS jadwal_klub (
  id           INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  klub_id      INT          UNSIGNED NOT NULL,
  judul        VARCHAR(200) NOT NULL COMMENT 'Nama kegiatan / agenda',
  deskripsi    TEXT         NULL,
  waktu_mulai  DATETIME     NOT NULL,
  waktu_selesai DATETIME    NOT NULL,
  lokasi       VARCHAR(200) NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (klub_id) REFERENCES klub_minat_bakat(id) ON DELETE CASCADE,
  INDEX idx_waktu (waktu_mulai)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: absensi_klub
-- Kehadiran anggota di setiap jadwal kegiatan klub.
-- ============================================================
CREATE TABLE IF NOT EXISTS absensi_klub (
  id               INT      UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  jadwal_klub_id   INT      UNSIGNED NOT NULL,
  warga_belajar_id INT      UNSIGNED NOT NULL,
  status           ENUM('hadir','izin','alpa') NOT NULL DEFAULT 'alpa',
  catatan          VARCHAR(255) NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (jadwal_klub_id)   REFERENCES jadwal_klub(id) ON DELETE CASCADE,
  FOREIGN KEY (warga_belajar_id) REFERENCES warga_belajar(id),
  UNIQUE KEY uq_jadwal_wb (jadwal_klub_id, warga_belajar_id)
) ENGINE=InnoDB;

-- ============================================================
-- BAGIAN 8: MODUL PELATIHAN BAHASA ASING
-- Program khusus Bahasa Inggris, Jepang, dan Mandarin.
-- ============================================================

-- ============================================================
-- TABEL: pelatihan_bahasa
-- Program pelatihan bahasa yang tersedia, dikelompokkan per level.
-- ============================================================
CREATE TABLE IF NOT EXISTS pelatihan_bahasa (
  id           INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bahasa       ENUM('inggris','jepang','mandarin') NOT NULL,
  level        ENUM('pemula','menengah','lanjutan') NOT NULL DEFAULT 'pemula',
  nama         VARCHAR(100) NOT NULL COMMENT 'Contoh: English for Beginners',
  deskripsi    TEXT         NULL,
  pengajar_id  INT          UNSIGNED NULL COMMENT 'user_id Tutor yang mengajar',
  kapasitas    INT          NOT NULL DEFAULT 15,
  is_aktif     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (pengajar_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_bahasa (bahasa),
  INDEX idx_level  (level)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: peserta_pelatihan
-- WB yang terdaftar di satu program pelatihan bahasa.
-- ============================================================
CREATE TABLE IF NOT EXISTS peserta_pelatihan (
  id                   INT      UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pelatihan_id         INT      UNSIGNED NOT NULL,
  warga_belajar_id     INT      UNSIGNED NOT NULL,
  tahun_ajaran_id      INT      UNSIGNED NOT NULL,
  status               ENUM('aktif','lulus','tidak_aktif') NOT NULL DEFAULT 'aktif',
  tanggal_daftar       DATE     NOT NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (pelatihan_id)     REFERENCES pelatihan_bahasa(id) ON DELETE CASCADE,
  FOREIGN KEY (warga_belajar_id) REFERENCES warga_belajar(id),
  FOREIGN KEY (tahun_ajaran_id)  REFERENCES tahun_ajaran(id),
  UNIQUE KEY uq_pelatihan_wb (pelatihan_id, warga_belajar_id, tahun_ajaran_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: materi_bahasa
-- Konten belajar yang diupload untuk satu program pelatihan.
-- ============================================================
CREATE TABLE IF NOT EXISTS materi_bahasa (
  id             INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pelatihan_id   INT          UNSIGNED NOT NULL,
  judul          VARCHAR(200) NOT NULL,
  deskripsi      TEXT         NULL,
  tipe           ENUM('dokumen','video_link','link_eksternal') NOT NULL DEFAULT 'dokumen',
  path_file      VARCHAR(500) NULL,
  url            VARCHAR(500) NULL,
  urutan         INT          NOT NULL DEFAULT 0,
  is_published   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (pelatihan_id) REFERENCES pelatihan_bahasa(id) ON DELETE CASCADE,
  INDEX idx_pelatihan (pelatihan_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: proyek_bahasa
-- Proyek kolaboratif antar peserta dalam satu pelatihan.
-- ============================================================
CREATE TABLE IF NOT EXISTS proyek_bahasa (
  id             INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pelatihan_id   INT          UNSIGNED NOT NULL,
  judul          VARCHAR(200) NOT NULL,
  deskripsi      TEXT         NOT NULL COMMENT 'Deskripsi tema dan tujuan proyek',
  deadline       DATETIME     NOT NULL,
  status         ENUM('aktif','selesai') NOT NULL DEFAULT 'aktif',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (pelatihan_id) REFERENCES pelatihan_bahasa(id) ON DELETE CASCADE,
  INDEX idx_pelatihan (pelatihan_id)
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: kontribusi_proyek
-- Hasil/kontribusi yang dikumpulkan WB untuk satu proyek bahasa.
-- ============================================================
CREATE TABLE IF NOT EXISTS kontribusi_proyek (
  id               INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proyek_id        INT          UNSIGNED NOT NULL,
  warga_belajar_id INT          UNSIGNED NOT NULL,
  deskripsi        TEXT         NULL,
  path_file        VARCHAR(500) NULL COMMENT 'File hasil karya (opsional)',
  nilai            DECIMAL(5,2) NULL COMMENT 'Nilai dari pengajar',
  feedback         TEXT         NULL,
  submitted_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (proyek_id)        REFERENCES proyek_bahasa(id) ON DELETE CASCADE,
  FOREIGN KEY (warga_belajar_id) REFERENCES warga_belajar(id),
  INDEX idx_proyek (proyek_id)
) ENGINE=InnoDB;

-- ============================================================
-- BAGIAN 9: MODUL NOTIFIKASI
-- Log notifikasi dalam sistem untuk semua user.
-- ============================================================

-- ============================================================
-- TABEL: notifikasi
-- Pesan notifikasi yang dikirim ke user tertentu.
-- Contoh: "Tagihan SPP Anda sudah jatuh tempo."
-- ============================================================
CREATE TABLE IF NOT EXISTS notifikasi (
  id         INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          UNSIGNED NOT NULL COMMENT 'Penerima notifikasi',
  judul      VARCHAR(200) NOT NULL,
  pesan      TEXT         NOT NULL,
  tipe       ENUM('spmb','keuangan','kbm','absensi','ujian','sistem') NOT NULL DEFAULT 'sistem',
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user    (user_id),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB;

-- ============================================================
-- BAGIAN 10: AUDIT LOG
-- Rekaman aktivitas penting di sistem (untuk Super Admin).
-- ============================================================

-- ============================================================
-- TABEL: audit_log
-- Mencatat aktivitas kritis: login, hapus data, ubah role, dll.
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id         INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          UNSIGNED NULL COMMENT 'NULL jika aksi dilakukan sistem otomatis',
  aksi       VARCHAR(100) NOT NULL COMMENT 'Contoh: LOGIN, HAPUS_SISWA, UBAH_ROLE',
  target     VARCHAR(100) NULL COMMENT 'Entitas yang dikenai aksi (contoh: warga_belajar)',
  target_id  INT          UNSIGNED NULL COMMENT 'ID baris yang diubah/dihapus',
  detail     TEXT         NULL COMMENT 'Detail tambahan (JSON string)',
  ip_address VARCHAR(45)  NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user      (user_id),
  INDEX idx_aksi      (aksi),
  INDEX idx_created   (created_at)
) ENGINE=InnoDB;


-- ============================================================
-- ============================================================
-- SEED DATA AWAL
-- Data minimal agar sistem bisa langsung diuji setelah setup.
-- ============================================================
-- ============================================================

-- Tahun ajaran aktif
INSERT INTO tahun_ajaran (nama_tahun_ajaran, is_aktif, tanggal_mulai, tanggal_selesai)
VALUES ('2025/2026', 1, '2025-07-14', '2026-06-30');

-- Mata pelajaran standar per jenjang
-- Kode harus UNIQUE — pisahkan kode untuk jenjang berbeda
INSERT INTO mata_pelajaran (nama, kode, jenjang) VALUES
  ('Pendidikan Agama & Budi Pekerti', 'PAG-ALL',  'semua'),
  ('Bahasa Indonesia',                 'BIND-ALL', 'semua'),
  ('Matematika',                       'MTK-ALL',  'semua'),
  ('Ilmu Pengetahuan Alam',            'IPA-ALL',  'semua'),
  ('Ilmu Pengetahuan Sosial',          'IPS-ALL',  'semua'),
  ('Pendidikan Kewarganegaraan',       'PKN-ALL',  'semua'),
  ('Bahasa Inggris',                   'BING-B',   'paket_b'),
  ('Bahasa Inggris',                   'BING-C',   'paket_c'),
  ('Ekonomi',                          'EKO-C',    'paket_c'),
  ('Fisika',                           'FIS-C',    'paket_c'),
  ('Kimia',                            'KIM-C',    'paket_c'),
  ('Biologi',                          'BIO-C',    'paket_c');

-- Contoh rombel untuk tahun ajaran 2025/2026
INSERT INTO rombel (nama_rombel, jenjang, tahun_ajaran_id, kapasitas) VALUES
  ('Paket A - Kelas I',  'paket_a', 1, 25),
  ('Paket B - Kelas VII-A', 'paket_b', 1, 30),
  ('Paket B - Kelas VII-B', 'paket_b', 1, 30),
  ('Paket C - Kelas X-A',   'paket_c', 1, 30),
  ('Paket C - Kelas X-B',   'paket_c', 1, 30);

-- Akun Super Admin default
-- Password: Admin1234! (di-hash dengan bcrypt cost 10)
-- ⚠ GANTI PASSWORD INI SEGERA setelah pertama kali login!
INSERT INTO users (nama_lengkap, email, password_hash, role)
VALUES (
  'Super Administrator',
  'admin@pkbm-binamandiri.sch.id',
  '$2b$10$rOzJqX8Gq5Kf1L2N3M4P5uYK6bJ7cD8eE9fH0iG1jI2kK3lL4mM5n',
  'super_admin'
);

-- Contoh akun Tutor (untuk testing)
-- Password: Tutor1234!
INSERT INTO users (nama_lengkap, email, password_hash, role)
VALUES (
  'Budi Santoso, S.Pd',
  'budi.tutor@pkbm-binamandiri.sch.id',
  '$2b$10$rOzJqX8Gq5Kf1L2N3M4P5uYK6bJ7cD8eE9fH0iG1jI2kK3lL4mM5n',
  'tutor'
);

-- Profil tutor untuk akun di atas
INSERT INTO tutor (user_id, spesialisasi, no_telp)
VALUES (2, 'Matematika, IPA', '081234567890');

-- Contoh akun Admin TU (untuk testing)
-- Password: Admin1234!
INSERT INTO users (nama_lengkap, email, password_hash, role)
VALUES (
  'Siti Rahayu',
  'siti.admin@pkbm-binamandiri.sch.id',
  '$2b$10$rOzJqX8Gq5Kf1L2N3M4P5uYK6bJ7cD8eE9fH0iG1jI2kK3lL4mM5n',
  'admin'
);

-- Contoh klub minat bakat
INSERT INTO klub_minat_bakat (nama, deskripsi, kategori, kapasitas) VALUES
  ('Klub Robotika',       'Belajar dasar-dasar elektronik dan pemrograman robot sederhana.', 'teknologi', 15),
  ('Klub Seni Rupa',      'Menggambar, melukis, dan membuat kerajinan tangan.',               'seni',      20),
  ('Klub Futsal',         'Latihan futsal rutin setiap minggu.',                              'olahraga',  20),
  ('Klub Debat Bahasa',   'Melatih kemampuan berbicara dan berargumentasi.',                  'bahasa',    15);

-- Contoh program pelatihan bahasa asing
INSERT INTO pelatihan_bahasa (bahasa, level, nama, kapasitas) VALUES
  ('inggris', 'pemula',   'English for Beginners',         15),
  ('inggris', 'menengah', 'English Intermediate',          15),
  ('jepang',  'pemula',   'Nihongo Shokyuu (Level Dasar)', 10),
  ('mandarin','pemula',   'Hanyu Pǔtōnghuà - Dasar',       10);

USE pkbm_bina_mandiri;
 
-- ============================================================
-- BAGIAN 11: TRACKING PROGRES MATERI
-- Mencatat materi mana saja yang sudah dibuka/diselesaikan WB.
-- Dibutuhkan untuk fitur "Riwayat Belajar" dan progress bar.
-- ============================================================
 
-- ============================================================
-- TABEL: progres_materi
-- Rekaman setiap kali WB membuka/menyelesaikan sebuah materi.
-- ============================================================
CREATE TABLE IF NOT EXISTS progres_materi (
  id               INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warga_belajar_id INT          UNSIGNED NOT NULL,
  materi_id        INT          UNSIGNED NOT NULL,
  status           ENUM('dibuka','selesai') NOT NULL DEFAULT 'dibuka',
  dibuka_pada      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  selesai_pada     DATETIME     NULL,
 
  FOREIGN KEY (warga_belajar_id) REFERENCES warga_belajar(id) ON DELETE CASCADE,
  FOREIGN KEY (materi_id)        REFERENCES materi_pembelajaran(id) ON DELETE CASCADE,
  -- Satu WB hanya boleh punya satu rekaman progres per materi
  UNIQUE KEY uq_wb_materi (warga_belajar_id, materi_id),
  INDEX idx_wb     (warga_belajar_id),
  INDEX idx_materi (materi_id)
) ENGINE=InnoDB COMMENT='Tracking progres belajar WB per materi pembelajaran';
 
-- ============================================================
-- BAGIAN 12: NILAI & RAPOR
-- Rekaman nilai akhir per mata pelajaran per periode.
-- Terpisah dari jawaban_ujian agar rapor bisa diisi manual
-- oleh Tutor dan juga diisi otomatis dari rata-rata ujian.
-- ============================================================
 
-- ============================================================
-- TABEL: nilai_akhir
-- Nilai akhir WB per mata pelajaran dalam satu tahun ajaran.
-- Tutor menginput nilai UH rata-rata, UTS, UAS, dan nilai akhir.
-- Nilai akhir bisa dihitung otomatis atau diinput manual.
-- ============================================================
CREATE TABLE IF NOT EXISTS nilai_akhir (
  id               INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warga_belajar_id INT          UNSIGNED NOT NULL,
  mapel_id         INT          UNSIGNED NOT NULL,
  rombel_id        INT          UNSIGNED NOT NULL,
  tahun_ajaran_id  INT          UNSIGNED NOT NULL,
  tutor_id         INT          UNSIGNED NOT NULL COMMENT 'Tutor yang menginput nilai',
  -- Komponen penilaian
  nilai_uh         DECIMAL(5,2) NULL     COMMENT 'Rata-rata nilai ulangan harian',
  nilai_uts        DECIMAL(5,2) NULL     COMMENT 'Nilai ujian tengah semester',
  nilai_uas        DECIMAL(5,2) NULL     COMMENT 'Nilai ujian akhir semester',
  nilai_tugas      DECIMAL(5,2) NULL     COMMENT 'Rata-rata nilai tugas harian',
  nilai_akhir      DECIMAL(5,2) NULL     COMMENT 'Nilai akhir (dihitung atau diinput manual)',
  predikat         ENUM('A','B','C','D') NULL COMMENT 'A≥85, B≥70, C≥55, D<55',
  catatan_tutor    TEXT         NULL     COMMENT 'Catatan/deskripsi dari tutor untuk rapor',
  is_final         TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = nilai sudah dikunci/final',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NULL     ON UPDATE CURRENT_TIMESTAMP,
 
  FOREIGN KEY (warga_belajar_id) REFERENCES warga_belajar(id),
  FOREIGN KEY (mapel_id)         REFERENCES mata_pelajaran(id),
  FOREIGN KEY (rombel_id)        REFERENCES rombel(id),
  FOREIGN KEY (tahun_ajaran_id)  REFERENCES tahun_ajaran(id),
  FOREIGN KEY (tutor_id)         REFERENCES users(id),
  -- Satu WB hanya punya satu nilai akhir per mapel per tahun ajaran
  UNIQUE KEY uq_nilai (warga_belajar_id, mapel_id, tahun_ajaran_id),
  INDEX idx_wb     (warga_belajar_id),
  INDEX idx_rombel (rombel_id),
  INDEX idx_ta     (tahun_ajaran_id)
) ENGINE=InnoDB COMMENT='Nilai akhir per mata pelajaran per WB per tahun ajaran';
 
-- ============================================================
-- TABEL: rapor_periode
-- Header rapor: satu rekaman per WB per semester/periode.
-- Berisi ringkasan seperti total kehadiran dan catatan umum wali.
-- ============================================================
CREATE TABLE IF NOT EXISTS rapor_periode (
  id               INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warga_belajar_id INT          UNSIGNED NOT NULL,
  rombel_id        INT          UNSIGNED NOT NULL,
  tahun_ajaran_id  INT          UNSIGNED NOT NULL,
  semester         ENUM('1','2') NOT NULL COMMENT 'Semester 1 atau 2',
  total_hadir      INT          NOT NULL DEFAULT 0,
  total_izin       INT          NOT NULL DEFAULT 0,
  total_sakit      INT          NOT NULL DEFAULT 0,
  total_alpa       INT          NOT NULL DEFAULT 0,
  catatan_wali     TEXT         NULL     COMMENT 'Catatan wali kelas untuk rapor',
  status_rapor     ENUM('draft','final') NOT NULL DEFAULT 'draft',
  tanggal_cetak    DATETIME     NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NULL     ON UPDATE CURRENT_TIMESTAMP,
 
  FOREIGN KEY (warga_belajar_id) REFERENCES warga_belajar(id),
  FOREIGN KEY (rombel_id)        REFERENCES rombel(id),
  FOREIGN KEY (tahun_ajaran_id)  REFERENCES tahun_ajaran(id),
  UNIQUE KEY uq_rapor (warga_belajar_id, tahun_ajaran_id, semester),
  INDEX idx_wb  (warga_belajar_id),
  INDEX idx_ta  (tahun_ajaran_id)
) ENGINE=InnoDB COMMENT='Header rapor per WB per semester';
 
-- ============================================================
-- BAGIAN 13: AUTENTIKASI LANJUTAN
-- Token untuk fitur "Ingat Saya" (refresh token) dan
-- fitur reset password melalui email.
-- ============================================================
 
-- ============================================================
-- TABEL: refresh_token
-- Menyimpan refresh token JWT untuk sesi "Ingat Saya".
-- Satu user bisa punya lebih dari satu token (multi-device).
-- Token di-hash sebelum disimpan agar aman jika DB bocor.
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_token (
  id          INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          UNSIGNED NOT NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE COMMENT 'SHA-256 hash dari token asli',
  device_info VARCHAR(255) NULL     COMMENT 'Info browser/device (User-Agent)',
  ip_address  VARCHAR(45)  NULL,
  expires_at  DATETIME     NOT NULL COMMENT 'Waktu kedaluwarsa token',
  is_revoked  TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = token sudah dicabut (logout)',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user       (user_id),
  INDEX idx_token_hash (token_hash),
  INDEX idx_expires    (expires_at)
) ENGINE=InnoDB COMMENT='Refresh token JWT untuk sesi multi-device';
 
-- ============================================================
-- TABEL: reset_password_token
-- Token sementara untuk proses reset password via email.
-- Token hanya berlaku sekali dan kedaluwarsa dalam 1 jam.
-- ============================================================
CREATE TABLE IF NOT EXISTS reset_password_token (
  id          INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          UNSIGNED NOT NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE COMMENT 'SHA-256 hash dari token yang dikirim ke email',
  expires_at  DATETIME     NOT NULL COMMENT 'Kedaluwarsa 1 jam setelah dibuat',
  is_used     TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = sudah digunakan, tidak bisa dipakai lagi',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user    (user_id),
  INDEX idx_token   (token_hash),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB COMMENT='Token sementara untuk reset password via email';
 
-- ============================================================
-- BAGIAN 14: MODUL PENGUMUMAN
-- Informasi resmi yang disebarkan kepada kelompok user tertentu.
-- Contoh: pengumuman jadwal ujian, libur nasional, dll.
-- ============================================================
 
-- ============================================================
-- TABEL: pengumuman
-- Pengumuman yang dibuat oleh Admin atau Tutor.
-- Target penerima bisa: semua user, per jenjang, atau per rombel.
-- ============================================================
CREATE TABLE IF NOT EXISTS pengumuman (
  id              INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pembuat_id      INT          UNSIGNED NOT NULL COMMENT 'User yang membuat pengumuman',
  judul           VARCHAR(200) NOT NULL,
  isi             TEXT         NOT NULL,
  tipe_target     ENUM('semua','jenjang','rombel') NOT NULL DEFAULT 'semua'
                  COMMENT 'Kepada siapa pengumuman ini ditujukan',
  -- Diisi jika tipe_target = jenjang atau rombel
  target_jenjang  ENUM('paket_a','paket_b','paket_c') NULL,
  target_rombel_id INT         UNSIGNED NULL,
  -- Penjadwalan penerbitan
  is_published    TINYINT(1)   NOT NULL DEFAULT 0,
  published_at    DATETIME     NULL     COMMENT 'Waktu resmi diterbitkan',
  expired_at      DATETIME     NULL     COMMENT 'Pengumuman tidak ditampilkan setelah waktu ini',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NULL     ON UPDATE CURRENT_TIMESTAMP,
 
  FOREIGN KEY (pembuat_id)       REFERENCES users(id),
  FOREIGN KEY (target_rombel_id) REFERENCES rombel(id) ON DELETE SET NULL,
  INDEX idx_published  (is_published),
  INDEX idx_expired    (expired_at),
  INDEX idx_jenjang    (target_jenjang)
) ENGINE=InnoDB COMMENT='Pengumuman resmi dari Admin atau Tutor';
 
-- ============================================================
-- TABEL: pengumuman_dibaca
-- Menandai pengumuman yang sudah dibaca oleh user tertentu.
-- Digunakan untuk fitur "tanda baca" dan badge notifikasi.
-- ============================================================
CREATE TABLE IF NOT EXISTS pengumuman_dibaca (
  id             INT      UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pengumuman_id  INT      UNSIGNED NOT NULL,
  user_id        INT      UNSIGNED NOT NULL,
  dibaca_pada    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
  FOREIGN KEY (pengumuman_id) REFERENCES pengumuman(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)       REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_baca (pengumuman_id, user_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB COMMENT='Rekaman user yang sudah membaca pengumuman';
 
-- ============================================================
-- BAGIAN 15: CATATAN PERKEMBANGAN ANGGOTA KLUB
-- Tutor/pembina klub mencatat perkembangan tiap anggota.
-- Dibutuhkan sesuai roadmap: "catatan perkembangan anggota".
-- ============================================================
 
-- ============================================================
-- TABEL: catatan_anggota_klub
-- Catatan progres/perkembangan per WB dalam satu klub.
-- Bisa berupa catatan skill, sikap, atau pencapaian tertentu.
-- ============================================================
CREATE TABLE IF NOT EXISTS catatan_anggota_klub (
  id               INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  klub_id          INT          UNSIGNED NOT NULL,
  warga_belajar_id INT          UNSIGNED NOT NULL,
  tutor_id         INT          UNSIGNED NOT NULL COMMENT 'Pembina yang menulis catatan',
  catatan          TEXT         NOT NULL,
  periode          VARCHAR(20)  NULL COMMENT 'Contoh: Mei 2026, Semester 1',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
  FOREIGN KEY (klub_id)          REFERENCES klub_minat_bakat(id) ON DELETE CASCADE,
  FOREIGN KEY (warga_belajar_id) REFERENCES warga_belajar(id),
  FOREIGN KEY (tutor_id)         REFERENCES users(id),
  INDEX idx_klub (klub_id),
  INDEX idx_wb   (warga_belajar_id)
) ENGINE=InnoDB COMMENT='Catatan perkembangan anggota klub oleh pembina';
 
-- ============================================================
-- BAGIAN 16: VIEWS UNTUK DASHBOARD PIMPINAN
-- View siap pakai untuk query dashboard eksekutif.
-- Pimpinan hanya perlu SELECT dari view ini (view-only access).
-- ============================================================
 
-- ============================================================
-- VIEW: v_ringkasan_wb_per_jenjang
-- Jumlah Warga Belajar aktif dikelompokkan per jenjang.
-- Digunakan di: widget statistik dashboard Pimpinan.
-- ============================================================
CREATE OR REPLACE VIEW v_ringkasan_wb_per_jenjang AS
SELECT
  wb.jenjang,
  COUNT(*) AS total_wb_aktif
FROM warga_belajar wb
WHERE wb.is_aktif = 1
GROUP BY wb.jenjang;
 
-- ============================================================
-- VIEW: v_ringkasan_keuangan_bulanan
-- Rekapitulasi total tagihan vs total pembayaran per bulan.
-- Digunakan di: grafik keuangan dashboard Pimpinan.
-- ============================================================
CREATE OR REPLACE VIEW v_ringkasan_keuangan_bulanan AS
SELECT
  DATE_FORMAT(ts.tanggal_jatuh_tempo, '%Y-%m') AS bulan,
  SUM(ts.jumlah)                                AS total_tagihan,
  COALESCE(SUM(p.jumlah_bayar), 0)              AS total_terbayar,
  SUM(ts.jumlah) - COALESCE(SUM(p.jumlah_bayar), 0) AS total_tunggakan
FROM tagihan_siswa ts
LEFT JOIN pembayaran p ON p.tagihan_id = ts.id AND p.status_konfirmasi = 'terkonfirmasi'
GROUP BY DATE_FORMAT(ts.tanggal_jatuh_tempo, '%Y-%m')
ORDER BY bulan DESC;
 
-- ============================================================
-- VIEW: v_tingkat_kehadiran_per_rombel
-- Rata-rata tingkat kehadiran (%) per rombel.
-- Digunakan di: tabel ringkasan kehadiran dashboard Pimpinan.
-- ============================================================
CREATE OR REPLACE VIEW v_tingkat_kehadiran_per_rombel AS
SELECT
  r.id          AS rombel_id,
  r.nama_rombel,
  r.jenjang,
  COUNT(rk.id)                                                    AS total_rekaman,
  SUM(CASE WHEN rk.status = 'hadir' THEN 1 ELSE 0 END)           AS total_hadir,
  ROUND(
    SUM(CASE WHEN rk.status = 'hadir' THEN 1 ELSE 0 END)
    / NULLIF(COUNT(rk.id), 0) * 100
  , 2)                                                            AS persen_kehadiran
FROM rombel r
LEFT JOIN sesi_absensi sa  ON sa.rombel_id = r.id
LEFT JOIN rekaman_kehadiran rk ON rk.sesi_id = sa.id
GROUP BY r.id, r.nama_rombel, r.jenjang;
 
-- ============================================================
-- VIEW: v_spmb_statistik
-- Statistik pendaftar SPMB: total, pending, diterima, ditolak.
-- Digunakan di: widget ringkasan SPMB Admin TU & Pimpinan.
-- ============================================================
CREATE OR REPLACE VIEW v_spmb_statistik AS
SELECT
  COUNT(*)                                                          AS total_pendaftar,
  SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END)       AS pending,
  SUM(CASE WHEN status = 'diterima' THEN 1 ELSE 0 END)       AS diterima,
  SUM(CASE WHEN status = 'ditolak'  THEN 1 ELSE 0 END)       AS ditolak
FROM pendaftar_spmb;
 
-- ============================================================
-- VIEW: v_tunggakan_per_wb
-- Daftar WB yang masih memiliki tunggakan SPP/modul.
-- Digunakan di: laporan tunggakan Admin Keuangan & Pimpinan.
-- ============================================================
CREATE OR REPLACE VIEW v_tunggakan_per_wb AS
SELECT
  wb.id          AS warga_belajar_id,
  u.nama_lengkap,
  wb.nis,
  wb.jenjang,
  ts.id          AS tagihan_id,
  ts.jenis_tagihan,
  ts.jumlah,
  ts.tanggal_jatuh_tempo,
  ts.status      AS status_tagihan,
  DATEDIFF(CURDATE(), ts.tanggal_jatuh_tempo) AS hari_terlambat
FROM tagihan_siswa ts
JOIN warga_belajar wb ON wb.id = ts.warga_belajar_id
JOIN users u          ON u.id  = wb.user_id
WHERE ts.status IN ('belum_bayar', 'sebagian')
ORDER BY hari_terlambat DESC;
 
-- ============================================================
-- VIEW: v_progres_belajar_wb
-- Ringkasan progres belajar: berapa materi sudah selesai
-- vs total materi yang tersedia di rombel WB.
-- Digunakan di: halaman profil WB dan laporan Tutor.
-- ============================================================
CREATE OR REPLACE VIEW v_progres_belajar_wb AS
SELECT
  wb.id          AS warga_belajar_id,
  u.nama_lengkap,
  wb.jenjang,
  wb.rombel_id,
  COUNT(DISTINCT mp.id)                                              AS total_materi,
  COUNT(DISTINCT CASE WHEN pm.status = 'selesai' THEN pm.materi_id END) AS materi_selesai,
  ROUND(
    COUNT(DISTINCT CASE WHEN pm.status = 'selesai' THEN pm.materi_id END)
    / NULLIF(COUNT(DISTINCT mp.id), 0) * 100
  , 2)                                                              AS persen_progres
FROM warga_belajar wb
JOIN users u ON u.id = wb.user_id
-- Materi yang relevan: yang ada di rombel WB ini
LEFT JOIN materi_pembelajaran mp
  ON mp.rombel_id = wb.rombel_id AND mp.is_published = 1
LEFT JOIN progres_materi pm
  ON pm.materi_id = mp.id AND pm.warga_belajar_id = wb.id
WHERE wb.is_aktif = 1
GROUP BY wb.id, u.nama_lengkap, wb.jenjang, wb.rombel_id;
 
-- ============================================================
-- BAGIAN 17: SEED DATA LANJUTAN
-- Data contoh untuk tabel-tabel baru di atas.
-- ============================================================
 
-- Contoh pengumuman awal sistem
INSERT INTO pengumuman (pembuat_id, judul, isi, tipe_target, is_published, published_at)
VALUES
  (
    1,
    'Selamat Datang di Ekosistem Digital PKBM Bina Mandiri',
    'Assalamu''alaikum Warga Belajar, Tutor, dan seluruh keluarga besar PKBM Bina Mandiri.\n\nKami dengan bangga memperkenalkan platform digital resmi kami. Melalui platform ini, Anda dapat mengakses materi pembelajaran, mengumpulkan tugas, melakukan absensi mandiri, mengerjakan ujian online, dan masih banyak lagi.\n\nSilakan login menggunakan kredensial yang telah diberikan. Jika mengalami kendala, hubungi staf TU kami.\n\nSalam sukses,\nManajemen PKBM Bina Mandiri',
    'semua',
    1,
    NOW()
  ),
  (
    3, -- Siti Admin
    'Panduan Pengisian SPMB Online Tahun Ajaran 2025/2026',
    'Kepada calon Warga Belajar PKBM Bina Mandiri,\n\nPenerimaan Siswa/Warga Belajar Baru (SPMB) kini dapat dilakukan secara online. Siapkan dokumen berikut sebelum mendaftar:\n1. Foto/scan KTP atau Kartu Keluarga (KK)\n2. Ijazah terakhir atau Surat Keterangan\n3. Pas foto ukuran 3x4 (format JPG/PNG)\n4. Akta Kelahiran (jika ada)\n\nBatas pendaftaran: 30 Juni 2026.\n\nHubungi staf TU untuk informasi lebih lanjut.',
    'semua',
    1,
    NOW()
  );
 
