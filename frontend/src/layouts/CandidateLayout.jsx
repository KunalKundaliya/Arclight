import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import TopNavbar from '../components/common/TopNavbar';
import { useAuth, ROLES } from '../context/AuthContext';

export default function CandidateLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentRole, switchRole } = useAuth();

  useEffect(() => {
    if (currentRole !== ROLES.CANDIDATE) {
      switchRole(ROLES.CANDIDATE);
    }
  }, [currentRole, switchRole]);

  return (
    <div className="min-h-screen bg-[#fafafd] text-slate-800 flex font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-60">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
