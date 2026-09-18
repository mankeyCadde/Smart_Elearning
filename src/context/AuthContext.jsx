import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiFetch, setTokens, clearTokens, getCachedUser, setCachedUser } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getCachedUser());
  const [loading, setLoading] = useState(true);

  const hydrateUser = useCallback((data) => {
    setUser(data);
    setCachedUser(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!getCachedUser()) {
        setLoading(false);
        return;
      }
      try {
        const me = await apiFetch('/auth/me/');
        if (!cancelled) hydrateUser(me);
      } catch {
        if (!cancelled) {
          clearTokens();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [hydrateUser]);

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/auth/login/', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    setTokens(data.access, data.refresh);
    hydrateUser(data.user);
    return data.user;
  }, [hydrateUser]);

  const register = useCallback(async ({ fullName, email, password }, role = 'student') => {
    const query = role === 'instructor' ? '?role=instructor' : '';
    const data = await apiFetch(`/auth/register/${query}`, {
      method: 'POST',
      body: { fullName, email, password },
      auth: false,
    });
    setTokens(data.access, data.refresh);
    hydrateUser(data.user);
    return data.user;
  }, [hydrateUser]);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('sl_refresh');
    if (refresh) {
      try {
        await apiFetch('/auth/logout/', { method: 'POST', body: { refresh } });
      } catch {
        // Best effort — clear locally regardless.
      }
    }
    clearTokens();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (patch) => {
    const updated = await apiFetch('/auth/me/', { method: 'PATCH', body: patch });
    hydrateUser(updated);
    return updated;
  }, [hydrateUser]);

  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{ user, setUser, role, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);