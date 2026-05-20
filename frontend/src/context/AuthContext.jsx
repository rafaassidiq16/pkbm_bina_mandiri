// ============================================================
// src/context/AuthContext.jsx — Context Autentikasi Global
// ============================================================
// Menyimpan state user yang sedang login (token, role, data profil).
// Membungkus seluruh aplikasi di main.jsx agar semua komponen
// dapat mengakses data sesi via useAuth().
//
// State yang disimpan:
//   user   : objek data user { id, nama, role, ... }
//   token  : JWT token dari backend
//   login  : fungsi untuk menyimpan sesi setelah login berhasil
//   logout : fungsi untuk menghapus sesi dan redirect ke /
// ============================================================

import { createContext, useState, useCallback } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => {
    const saved = localStorage.getItem('pkbm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('pkbm_token') || null);

  const login = useCallback((userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('pkbm_user',  JSON.stringify(userData));
    localStorage.setItem('pkbm_token', jwtToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pkbm_user');
    localStorage.removeItem('pkbm_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
