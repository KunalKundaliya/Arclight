import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import CoordinatorLayout from './layouts/CoordinatorLayout';
import InterviewerLayout from './layouts/InterviewerLayout';
import CandidateLayout from './layouts/CandidateLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';

// Coordinator Pages
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import RecruitmentDrivesPage from './pages/coordinator/RecruitmentDrivesPage';
import CandidatesPage from './pages/coordinator/CandidatesPage';
import InterviewersPage from './pages/coordinator/InterviewersPage';
import RoomsPage from './pages/coordinator/RoomsPage';
import SchedulerPage from './pages/coordinator/SchedulerPage';
import MasterCalendarPage from './pages/coordinator/MasterCalendarPage';
import PipelinePage from './pages/coordinator/PipelinePage';
import EvaluationsPage from './pages/coordinator/EvaluationsPage';
import NotificationsPage from './pages/coordinator/NotificationsPage';
import ReportsPage from './pages/coordinator/ReportsPage';
import SettingsPage from './pages/coordinator/SettingsPage';

// Interviewer Pages
import InterviewerDashboard from './pages/interviewer/InterviewerDashboard';
import InterviewerCalendarPage from './pages/interviewer/InterviewerCalendarPage';
import InterviewerAvailabilityPage from './pages/interviewer/InterviewerAvailabilityPage';
import InterviewDetailPage from './pages/interviewer/InterviewDetailPage';
import InterviewerEvaluationPage from './pages/interviewer/InterviewerEvaluationPage';
import InterviewerNotificationsPage from './pages/interviewer/InterviewerNotificationsPage';
import InterviewerProfilePage from './pages/interviewer/InterviewerProfilePage';

// Candidate Pages
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import CandidateInterviewsPage from './pages/candidate/CandidateInterviewsPage';
import CandidateBookingPage from './pages/candidate/CandidateBookingPage';
import CandidateInterviewDetailPage from './pages/candidate/CandidateInterviewDetailPage';
import CandidateCalendarPage from './pages/candidate/CandidateCalendarPage';
import CandidateProgressPage from './pages/candidate/CandidateProgressPage';
import CandidateNotificationsPage from './pages/candidate/CandidateNotificationsPage';
import CandidateProfilePage from './pages/candidate/CandidateProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="login" element={<LoginPage />} />
            </Route>

            {/* Coordinator Workspace Routes */}
            <Route path="/coordinator" element={<CoordinatorLayout />}>
              <Route index element={<CoordinatorDashboard />} />
              <Route path="drives" element={<RecruitmentDrivesPage />} />
              <Route path="candidates" element={<CandidatesPage />} />
              <Route path="interviewers" element={<InterviewersPage />} />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="scheduler" element={<SchedulerPage />} />
              <Route path="calendar" element={<MasterCalendarPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="evaluations" element={<EvaluationsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Interviewer Portal Routes */}
            <Route path="/interviewer" element={<InterviewerLayout />}>
              <Route index element={<InterviewerDashboard />} />
              <Route path="calendar" element={<InterviewerCalendarPage />} />
              <Route path="availability" element={<InterviewerAvailabilityPage />} />
              <Route path="interviews/:id" element={<InterviewDetailPage />} />
              <Route path="evaluations/:id" element={<InterviewerEvaluationPage />} />
              <Route path="notifications" element={<InterviewerNotificationsPage />} />
              <Route path="profile" element={<InterviewerProfilePage />} />
            </Route>

            {/* Candidate Portal Routes */}
            <Route path="/candidate" element={<CandidateLayout />}>
              <Route index element={<CandidateDashboard />} />
              <Route path="interviews" element={<CandidateInterviewsPage />} />
              <Route path="book/:roundId" element={<CandidateBookingPage />} />
              <Route path="interviews/:id" element={<CandidateInterviewDetailPage />} />
              <Route path="calendar" element={<CandidateCalendarPage />} />
              <Route path="progress" element={<CandidateProgressPage />} />
              <Route path="notifications" element={<CandidateNotificationsPage />} />
              <Route path="profile" element={<CandidateProfilePage />} />
            </Route>

            {/* Fallback to Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
