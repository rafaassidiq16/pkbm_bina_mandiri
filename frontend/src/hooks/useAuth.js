// ============================================================
// src/hooks/useAuth.js — Custom Hook untuk Autentikasi
// ============================================================
// Mengambil data user yang sedang login dari AuthContext.
// Gunakan hook ini di komponen mana pun yang butuh info user/role.
//
// Contoh penggunaan:
//   const { user, role, logout } = useAuth();
// ============================================================

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam <AuthProvider>');
  }
  return context;
}
