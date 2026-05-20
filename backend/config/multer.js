// ============================================================
// config/multer.js
// Konfigurasi Multer untuk menangani upload file
// Digunakan untuk: berkas SPMB, pengumpulan tugas siswa,
// dan upload materi oleh Tutor.
// ============================================================

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Tentukan lokasi penyimpanan dan nama file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Tentukan subfolder berdasarkan tujuan upload
    // req.uploadFolder diset oleh route sebelum middleware multer
    const folder = req.uploadFolder || 'umum';
    const uploadPath = path.join('uploads', folder);

    // Buat folder jika belum ada
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    // Format nama file: timestamp-namaasli.ext
    // Contoh: 1712345678901-ijazah.pdf
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${timestamp}-${sanitizedName}`);
  },
});

// Filter tipe file yang diizinkan
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Terima file
  } else {
    cb(new Error('Tipe file tidak diizinkan. Hanya JPG, PNG, PDF, DOC, DOCX, MP4.'), false);
  }
};

// Export instance multer dengan konfigurasi di atas
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Maksimum 10MB per file
  },
});

export default upload;
