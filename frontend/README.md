# Frontend — Educational ERP PKBM Bina Mandiri

Aplikasi web frontend untuk sistem Educational ERP PKBM Bina Mandiri,
mengintegrasikan **SIAKAD** (Sistem Informasi Akademik) dan **LMS** (Learning Management System)
dalam satu platform monolitik.

---

## 🗂️ Struktur Folder

```
frontend/
├── public/                      # Aset statis (favicon, gambar, manifest)
├── src/
│   ├── assets/
│   │   └── icons/               # Ikon SVG khusus aplikasi
│   ├── components/
│   │   ├── ProtectedRoute.jsx   # Guard akses berbasis role (RBAC)
│   │   ├── Sidebar.jsx          # Navigasi samping dinamis per role
│   │   └── Sidebar.css
│   ├── context/
│   │   └── AuthContext.jsx      # Context global sesi login (user, token)
│   ├── hooks/
│   │   └── useAuth.js           # Custom hook akses AuthContext
│   ├── pages/
│   │   ├── DashboardRouter.jsx  # Redirect otomatis berdasarkan role
│   │   ├── public/              # Halaman tanpa login
│   │   │   ├── LoginPage.jsx
│   │   │   ├── LoginPage.css
│   │   │   ├── DaftarSpmbPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── siswa/               # Halaman Warga Belajar
│   │   │   ├── DashboardSiswa.jsx
│   │   │   ├── DashboardSiswa.css
│   │   │   ├── MateriSiswa.jsx
│   │   │   ├── TugasSiswa.jsx
│   │   │   ├── AbsensiSiswa.jsx
│   │   │   ├── UjianSiswa.jsx
│   │   │   ├── KlubSiswa.jsx
│   │   │   └── TagihanSiswa.jsx
│   │   ├── admin/               # Halaman Admin TU & Keuangan
│   │   │   ├── DashboardAdmin.jsx
│   │   │   ├── SpmbAdmin.jsx
│   │   │   ├── SiswaAdmin.jsx
│   │   │   ├── TagihanAdmin.jsx
│   │   │   └── UserAdmin.jsx    # Khusus Super Admin
│   │   ├── tutor/               # Halaman Tutor / Pengajar
│   │   │   ├── DashboardTutor.jsx
│   │   │   ├── KelasTutor.jsx
│   │   │   ├── AbsensiTutor.jsx
│   │   │   └── UjianTutor.jsx
│   │   └── pimpinan/            # Halaman Pimpinan PKBM (view-only)
│   │       └── DashboardPimpinan.jsx
│   ├── services/
│   │   └── api.js               # Instance Axios + semua pemanggilan API
│   ├── utils/
│   │   └── formatters.js        # Utilitas format Rupiah, tanggal, timer
│   ├── App.jsx                  # Definisi semua rute (React Router v6)
│   ├── main.jsx                 # Entry point — render ke #root
│   └── index.css                # CSS global aplikasi
├── index.html                   # Template HTML Vite
├── vite.config.js               # Konfigurasi Vite
├── package.json
├── .env                         # Variabel environment (TIDAK di-commit)
└── .gitignore
```

---

## 🚀 Cara Menjalankan

### 1. Install dependensi
```bash
npm install
```

### 2. Konfigurasi environment
Salin contoh konfigurasi dan sesuaikan URL backend:
```bash
cp .env.example .env
# Edit VITE_API_URL sesuai alamat backend
```

### 3. Jalankan development server
```bash
npm run dev
```

### 4. Build untuk produksi
```bash
npm run build
```

---

## 👥 Role Pengguna & Rute Dashboard

| Role | Path Dashboard |
|------|---------------|
| `warga_belajar` | `/dashboard/siswa` |
| `admin` / `super_admin` | `/dashboard/admin` |
| `tutor` | `/dashboard/tutor` |
| `pimpinan` | `/dashboard/pimpinan` |

Akses rute diproteksi oleh `ProtectedRoute.jsx` menggunakan RBAC.

---

## 🛠️ Tech Stack

- **React 18** + **Vite 5**
- **React Router DOM v6** — client-side routing
- **Axios** — HTTP client ke backend API
- **Bootstrap Icons** — ikon antarmuka
- **WebSocket / SSE** — fitur real-time absensi mandiri

---

## 📝 Catatan Pengembangan

- Semua halaman menggunakan desain **mobile-first** (minimum 360px)
- Target performa: halaman utama WB < 3 detik pada jaringan 3G
- Komponen absensi real-time (`AbsensiTutor`, `AbsensiSiswa`) menggunakan
  WebSocket untuk update timer countdown dan daftar check-in tanpa refresh
- `UserAdmin.jsx` hanya dapat diakses oleh role `super_admin`
- `DashboardPimpinan.jsx` bersifat **view-only**, tanpa tombol aksi apapun
