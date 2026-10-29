import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

const AuthContext = createContext(null);

export const ROLES = {
  COORDINATOR: 'coordinator',
  INTERVIEWER: 'interviewer',
  CANDIDATE: 'candidate',
  GUEST: 'guest',
};

export const DEMO_PERSONAS = {
  [ROLES.COORDINATOR]: {
    id: 'usr-coord-1',
    name: 'Maya Chen',
    email: 'maya.chen@arclight.io',
    role: ROLES.COORDINATOR,
    roleTitle: 'Head of Campus Placement Operations',
    avatar: 'MC'
  },
  [ROLES.INTERVIEWER]: {
    id: 'usr-int-1',
    name: 'Priya Nair',
    email: 'priya.nair@apexdynamics.com',
    role: ROLES.INTERVIEWER,
    roleTitle: 'Senior Systems Architect (Apex Dynamics)',
    avatar: 'PN'
  },
  [ROLES.CANDIDATE]: {
    id: 'cand-01',
    name: 'Aanya Shah',
    email: 'aanya.shah@webster.edu',
    role: ROLES.CANDIDATE,
    roleTitle: 'Candidate (Webster 2026)',
    avatar: 'AS'
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_PERSONAS[ROLES.COORDINATOR]);
  const [currentRole, setCurrentRole] = useState(ROLES.COORDINATOR);
  const [loading, setLoading] = useState(true);

  const switchRole = (role) => {
    const target = DEMO_PERSONAS[role] || DEMO_PERSONAS[ROLES.COORDINATOR];
    setUser(target);
    setCurrentRole(role);
    localStorage.setItem('arclight_persona', role);
  };

  // Check token on initial load
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('arclight_token');
      const savedPersona = localStorage.getItem('arclight_persona');

      if (!token) {
        // Fall back to active persona so direct navigation never gets kicked out
        const defaultPersona = DEMO_PERSONAS[savedPersona] || DEMO_PERSONAS[ROLES.COORDINATOR];
        setUser(defaultPersona);
        setCurrentRole(defaultPersona.role);
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          setCurrentRole(res.user.role);
        } else {
          const defaultPersona = DEMO_PERSONAS[savedPersona] || DEMO_PERSONAS[ROLES.COORDINATOR];
          setUser(defaultPersona);
          setCurrentRole(defaultPersona.role);
        }
      } catch (err) {
        console.warn('Backend auth unreachable, falling back to demo persona session:', err.message);
        const defaultPersona = DEMO_PERSONAS[savedPersona] || DEMO_PERSONAS[ROLES.COORDINATOR];
        setUser(defaultPersona);
        setCurrentRole(defaultPersona.role);
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
      localStorage.setItem('arclight_persona', res.user.role);
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('arclight_token');
    localStorage.removeItem('arclight_persona');
    setUser(null);
    setCurrentRole(ROLES.GUEST);
  };

  return (
    <AuthContext.Provider value={{ user, currentRole, isAuthenticated: !!user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
