// ============================================================
// server.js
// Entry point aplikasi backend PKBM Bina Mandiri.
// Menggabungkan semua konfigurasi, middleware, dan routes.
// ============================================================

import express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';
import { testConnection } from './config/db.js';

// ── Import semua routes ──────────────────────────────────────
import authRoutes    from './routes/authRoutes.js';
import siswaRoutes   from './routes/siswaRoutes.js';
import userRoutes    from './routes/userRoutes.js';
import spmbRoutes    from './routes/spmbRoutes.js';
import tagihanRoutes from './routes/tagihanRoutes.js';
import absensiRoutes from './routes/absensiRoutes.js';
import materiRoutes  from './routes/materiRoutes.js';
import ujianRoutes   from './routes/ujianRoutes.js';
import klubRoutes    from './routes/klubRoutes.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  'http://localhost:5173,http://localhost:5174'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ============================================================
// MIDDLEWARE GLOBAL
// ============================================================
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS.`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan folder uploads sebagai file statis
// Akses: http://localhost:3000/uploads/spmb/namafile.pdf
app.use('/uploads', express.static('uploads'));

// ============================================================
// ROUTES API  — semua diawali /api
// ============================================================
app.use('/api/auth',    authRoutes);     // Login & cek token
app.use('/api/users',   userRoutes);     // Manajemen akun (Super Admin)
app.use('/api/siswa',   siswaRoutes);    // Data Warga Belajar
app.use('/api/spmb',    spmbRoutes);     // Pendaftaran & verifikasi SPMB
app.use('/api/tagihan', tagihanRoutes);  // Keuangan: tagihan & pembayaran
app.use('/api/absensi', absensiRoutes);  // Absensi dual-mode
app.use('/api/lms',     materiRoutes);   // KBM: materi, tugas, jadwal
app.use('/api/ujian',   ujianRoutes);    // Bank soal & ujian online
app.use('/api/klub',    klubRoutes);     // Klub minat bakat

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    success:     true,
    message:     'Server PKBM Bina Mandiri berjalan normal.',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================
// HANDLER 404
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.',
  });
});

// ============================================================
// START SERVER
// ============================================================
const startServer = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀 Server : http://localhost:${PORT}`);
    console.log(`📡 Mode   : ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health : http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
