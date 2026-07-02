// =======================================
// src/hooks/useAuth.js
// Login, Logout, Auth Handler
// =======================================

import { useState } from "react";
import api from "../services/api";

export default function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError("");

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.data.user));
      } else {
        setError("Email atau password salah.");
      }

      return res.data;
    } catch (err) {
      console.error(err);
      setError("Tidak dapat terhubung ke server.");
      return { success: false, message: "Gagal login" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return {
    login,
    logout,
    loading,
    error,
  };
}
