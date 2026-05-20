// ============================================================
// config/db.js
// Konfigurasi koneksi ke database MySQL menggunakan mysql2
// Menggunakan Pool Connection agar koneksi efisien dan bisa
// digunakan bersamaan oleh banyak request secara paralel.
// ============================================================

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Muat variabel dari file .env
dotenv.config();

// Buat pool koneksi (kumpulan koneksi siap pakai)
// Pool lebih efisien daripada membuka-tutup koneksi baru tiap request
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'pkbm_bina_mandiri',

  // Jumlah maksimum koneksi dalam pool
  connectionLimit: 10,

  // Kembalikan BigInt sebagai string agar aman di JSON
  supportBigNumbers: true,
  bigNumberStrings:  true,

  // Otomatis reconnect jika koneksi terputus
  waitForConnections: true,
  queueLimit: 0,
});

// Fungsi untuk menguji koneksi saat server pertama kali berjalan
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Koneksi database MySQL berhasil!');
    console.log(`   Host: ${process.env.DB_HOST} | DB: ${process.env.DB_NAME}`);
    connection.release(); // Kembalikan koneksi ke pool setelah selesai diuji
  } catch (error) {
    console.error('❌ Gagal konek ke database MySQL:', error.message);
    // Hentikan proses jika database tidak bisa diakses
    process.exit(1);
  }
};

// Export pool agar bisa dipakai di semua file model
export default pool;
