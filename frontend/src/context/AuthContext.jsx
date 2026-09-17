import { createContext, useContext, useEffect, useState } from 'react';
import API, { apiError } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    API.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const { data } = await API.post('/auth/login', credentials);
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const register = async (details) => {
    const { data } = await API.post('/auth/register', details);
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, register, logout, apiError }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);