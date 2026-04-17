import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('edulib_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('edulib_token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(res => setUser(res.data.user))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await authAPI.login({ username, password });
    const { token, user } = res.data;
    localStorage.setItem('edulib_token', token);
    localStorage.setItem('edulib_user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (formData) => {
    const res = await authAPI.register(formData);
    const { token, user } = res.data;
    localStorage.setItem('edulib_token', token);
    localStorage.setItem('edulib_user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('edulib_token');
    localStorage.removeItem('edulib_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
