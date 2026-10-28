import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, currentRole, loading, switchRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If navigating across portals, auto-align active persona seamlessly
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    if (allowedRoles.includes('coordinator')) {
      if (typeof switchRole === 'function') switchRole('coordinator');
      return children;
    }
    if (currentRole === 'coordinator') {
      return children;
    }
    if (currentRole === 'interviewer') return <Navigate to="/interviewer" replace />;
    if (currentRole === 'candidate') return <Navigate to="/candidate" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
