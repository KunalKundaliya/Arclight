import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const ROLES = {
  COORDINATOR: 'coordinator',
  INTERVIEWER: 'interviewer',
  CANDIDATE: 'candidate',
  GUEST: 'guest',
};

const DEMO_USERS = {
  [ROLES.COORDINATOR]: {
    id: 'user-coord',
    name: 'Maya Chen',
    role: ROLES.COORDINATOR,
    roleTitle: 'Placement Coordinator',
    email: 'maya.chen@arclight.io',
    avatar: 'MC',
    avatarBg: 'bg-indigo-600',
    department: 'Webster 2026 Campus Placement Cell',
    organization: 'ArcLight'
  },
  [ROLES.INTERVIEWER]: {
    id: 'int-01',
    name: 'Priya Nair',
    role: ROLES.INTERVIEWER,
    roleTitle: 'Senior Engineering Panel Lead',
    email: 'priya.nair@northstar.io',
    avatar: 'PN',
    avatarBg: 'bg-violet-600',
    department: 'Northstar Labs Engineering',
    organization: 'Northstar Labs'
  },
  [ROLES.CANDIDATE]: {
    id: 'cand-01',
    name: 'Aanya Shah',
    role: ROLES.CANDIDATE,
    roleTitle: 'Candidate — Software Engineering',
    email: 'aanya.shah@webster.edu',
    avatar: 'AS',
    avatarBg: 'bg-emerald-600',
    department: 'Computer Science & Engineering',
    organization: 'Webster University'
  }
};

export function AuthProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('aot_current_role') || ROLES.COORDINATOR;
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('aot_current_role') || ROLES.COORDINATOR;
    return DEMO_USERS[saved] || DEMO_USERS[ROLES.COORDINATOR];
  });

  const switchRole = (newRole) => {
    if (DEMO_USERS[newRole]) {
      setCurrentRole(newRole);
      setUser(DEMO_USERS[newRole]);
      localStorage.setItem('aot_current_role', newRole);
    }
  };

  const loginAs = (role) => {
    switchRole(role);
  };

  const logout = () => {
    setCurrentRole(ROLES.GUEST);
    setUser(null);
    localStorage.removeItem('aot_current_role');
  };

  return (
    <AuthContext.Provider value={{ currentRole, user, switchRole, loginAs, logout, DEMO_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
