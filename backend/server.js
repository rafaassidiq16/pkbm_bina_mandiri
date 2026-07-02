import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './config/db.js';

// ── Import semua routes ──────────────────────────────────────
import authRoutes from './routes/authRoutes.js';
import siswaRoutes from './routes/siswaRoutes.js';
import userRoutes from './routes/userRoutes.js';
import spmbRoutes from './routes/spmbRoutes.js';
import tagihanRoutes from './routes/tagihanRoutes.js';
import absensiRoutes from './routes/absensiRoutes.js';
import materiRoutes from './routes/materiRoutes.js';
import ujianRoutes from './routes/ujianRoutes.js';
import klubRoutes from './routes/klubRoutes.js';
import pertemuanRoutes from './routes/pertemuanRoutes.js';
import akademikRoutes from './routes/akademikRoutes.js';
import periodeUjianRoutes from './routes/periodeUjianRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, 'uploads');
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
  origin: allowedOrigins, // Daftar domain yang diizinkan
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Metode HTTP yang diizinkan
  credentials: true, // Mengizinkan pengiriman cookie atau header otentikasi
}));

// Logging untuk debugging CORS
app.use((req, res, next) => {
  console.log(`[CORS Debug] Origin: ${req.headers.origin}`);
  next();
});

// Tangani preflight request OPTIONS
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan folder uploads sebagai file statis
app.use('/uploads', express.static(uploadsDir));

// ============================================================
// ROUTES API  — semua diawali /api
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/siswa', siswaRoutes);
app.use('/api/spmb', spmbRoutes);
app.use('/api/tagihan', tagihanRoutes);
app.use('/api/absensi', absensiRoutes);
app.use('/api/lms', materiRoutes);
app.use('/api/ujian', ujianRoutes);
app.use('/api/klub', klubRoutes);
app.use('/api/pertemuan', pertemuanRoutes);
app.use('/api/akademik', akademikRoutes);
app.use('/api/periode-ujian', periodeUjianRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server PKBM Bina Mandiri berjalan normal.',
    timestamp: new Date().toISOString(),
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
