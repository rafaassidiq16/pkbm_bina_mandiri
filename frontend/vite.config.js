import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/', // Penting agar asset dipanggil dengan path root yang benar saat build
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router-dom')) return 'router';
          if (id.includes('axios')) return 'axios';
          if (id.includes('react')) return 'react-vendor';
          return 'vendor';
        },
      },
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Sesuaikan dengan port backend kamu
        changeOrigin: true,
        secure: false, // Jika backend pakai HTTPS self-signed, bisa di-set false
      },
    },
  },
});
