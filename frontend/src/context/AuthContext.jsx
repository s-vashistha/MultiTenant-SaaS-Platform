import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,   setUser]   = useState(() => JSON.parse(localStorage.getItem('user')   || 'null'));
  const [tenant, setTenant] = useState(() => JSON.parse(localStorage.getItem('tenant') || 'null'));

  const login = useCallback(async (tenantSlug, email, password) => {
    const { data } = await api.post(`/auth/${tenantSlug}/login`, { email, password });
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user',         JSON.stringify(data.user));
    localStorage.setItem('tenant',       JSON.stringify(data.tenant));
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') });
    } catch {}
    localStorage.clear();
    setUser(null);
    setTenant(null);
  }, []);

  const can = useCallback((resource, action) => {
    const PERMISSIONS = {
      admin:   { users: ['read','write','delete'], analytics: ['read','write','delete'], roles: ['read','write'], billing: ['read','write'] },
      manager: { users: ['read','write'],          analytics: ['read'],                 roles: ['read'],          billing: ['read'] },
      viewer:  { users: ['read'],                  analytics: ['read'],                 roles: [],                billing: [] },
    };
    return (PERMISSIONS[user?.role]?.[resource] || []).includes(action);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, tenant, login, logout, can, isAdmin: user?.role === 'admin', isManager: user?.role === 'manager' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
