import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { tokens } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load, if a token exists, ask the API who we are.
  useEffect(() => {
    (async () => {
      if (tokens.access) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        } catch {
          tokens.clear();
        }
      }
      setLoading(false);
    })();
  }, []);

  // The API client fires this when a refresh fails (session fully expired).
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    tokens.set(data);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (form) => {
    const { data } = await api.post('/auth/register', form);
    tokens.set(data);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', { refreshToken: tokens.refresh });
    } catch { /* ignore: we clear locally anyway */ }
    tokens.clear();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
