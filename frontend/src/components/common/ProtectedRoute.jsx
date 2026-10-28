import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, currentRole, loading } = useAuth();

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

  // Allow coordinators (admin) to access any workspace for testing/supervision
  if (allowedRoles && !allowedRoles.includes(currentRole) && currentRole !== 'coordinator') {
    // If unauthorized for this section, redirect to their own portal
    if (currentRole === 'interviewer') return <Navigate to="/interviewer" replace />;
    if (currentRole === 'candidate') return <Navigate to="/candidate" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
