import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

const AuthContext = createContext(null);

export const ROLES = {
  COORDINATOR: 'coordinator',
  INTERVIEWER: 'interviewer',
  CANDIDATE: 'candidate',
  GUEST: 'guest',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(ROLES.GUEST);
  const [loading, setLoading] = useState(true);

  // Check token on initial load
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('arclight_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          setCurrentRole(res.user.role);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Invalid token session, logging out:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.login({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('arclight_token', res.token);
      setUser(res.user);
      setCurrentRole(res.user.role);
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('arclight_token');
    setUser(null);
    setCurrentRole(ROLES.GUEST);
  };

  return (
    <AuthContext.Provider value={{ user, currentRole, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
