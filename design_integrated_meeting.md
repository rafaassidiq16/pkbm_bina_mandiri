# Rancangan Modul Pertemuan Terpadu (LMS-Style)

Dokumen ini merancang integrasi antara Materi Belajar, Tugas, dan Absensi ke dalam satu modul **Pertemuan** untuk meningkatkan pengalaman belajar Warga Belajar (WB).

## 1. Arsitektur Database (Konsep Dasar)

Untuk menyatukan data, kita memerlukan tabel induk yang mengikat komponen-komponen terpisah menjadi satu kesatuan sesi.

### Tabel Baru: `pertemuan_belajar`
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | Auto increment |
| `rombel_id` | INT (FK) | Relasi ke tabel rombel |
| `mapel_id` | INT (FK) | Relasi ke tabel mata_pelajaran |
| `tutor_id` | INT (FK) | Relasi ke tabel users (Tutor) |
| `pertemuan_ke` | INT | Nomor urut pertemuan (1, 2, 3...) |
| `judul` | VARCHAR | Judul topik bahasan |
| `deskripsi` | TEXT | Deskripsi atau instruksi dari tutor |
| `tanggal` | DATE | Tanggal pelaksanaan kelas |
| `is_published` | BOOLEAN | Status apakah sudah bisa dilihat siswa |

### Perubahan Relasi (Linking)
*   **Tabel `materi`**: Menambahkan kolom `pertemuan_id`.
*   **Tabel `tugas`**: Menambahkan kolom `pertemuan_id`.
*   **Tabel `sesi_absensi`**: Menambahkan kolom `pertemuan_id`.

---

## 2. Alur Pengguna (User Flow)

### A. Sisi Tutor (Pengelolaan Sesi)
Tutor tidak lagi mengisi data secara terpisah-pisah, melainkan dalam satu alur kerja:
1.  **Buat Pertemuan**: Tutor menentukan Topik dan Tanggal.
2.  **Lengkapi Sesi**: Dalam satu halaman yang sama, Tutor mengaktifkan Absensi, mengunggah file Materi, dan menulis instruksi Tugas.
3.  **Publish**: Sesi diterbitkan sehingga muncul di dashboard siswa.

### B. Sisi Siswa (Pengalaman Belajar)
Siswa mendapatkan navigasi yang lebih terarah:
1.  Siswa masuk ke menu **"Ruang Belajar"**.
2.  Siswa melihat daftar pertemuan secara kronologis (Pertemuan 1, 2, dst).
3.  Di setiap pertemuan, siswa langsung melihat status mereka:
    *   `[Icon Absen]` - Status: **Hadir**
    *   `[Icon Materi]` - **Unduh PDF**
    *   `[Icon Tugas]` - **Selesaikan Tugas**

---

## 3. Visualisasi Antarmuka (Mockup)

### Daftar Pertemuan (Siswa View)
Setiap baris mewakili satu paket pertemuan lengkap.

```text
+-----------------------------------------------------------+
| [Pertemuan 1] - Pengenalan IT dan Hardware                |
| Absensi: [HADIR]  |  Materi: [READY]  |  Tugas: [OK]      |
+-----------------------------------------------------------+
| [Pertemuan 2] - Dasar Sistem Operasi                      |
| Absensi: [KLIK!]  |  Materi: [READY]  |  Tugas: [BELUM]   |
| > Buka Detail Pertemuan untuk Belajar                     |
+-----------------------------------------------------------+
```

---

## 4. Rencana Implementasi Tahap Awal
1.  **Migrasi DB**: Menyiapkan tabel baru tanpa menghapus data lama.
2.  **API Integration**: Membuat endpoint `/api/pertemuan` yang melakukan JOIN ke 3 tabel terkait.
3.  **UI Tutor**: Membuat Dashboard khusus bagi Tutor untuk memanage "Paket Pertemuan".
4.  **UI Siswa**: Mengubah tampilan menu Sidebar agar lebih berorientasi pada "Pertemuan".

---
> [!IMPORTANT]
> Dokumen ini adalah **Rancangan Awal** untuk bahan diskusi dan **belum diimplementasikan** ke dalam sistem produksi.
