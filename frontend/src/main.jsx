// ============================================================
// src/main.jsx — Entry Point Utama Aplikasi React
// ============================================================
// File ini adalah titik masuk pertama yang dipanggil oleh Vite.
// Tugasnya: merender komponen <App /> ke dalam <div id="root">
// yang ada di index.html.
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';

// BrowserRouter: menyediakan konteks routing berbasis URL browser
// (menggunakan History API, bukan hash #)
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';

// Import CSS global — styling dasar untuk seluruh aplikasi
import './index.css';

// Ambil elemen <div id="root"> dari index.html sebagai target render
const rootElement = document.getElementById('root');

// Buat root React dan render aplikasi
// React.StrictMode: mengaktifkan peringatan tambahan saat development
// BrowserRouter: membungkus App agar semua komponen bisa pakai useNavigate, Link, dll.
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
