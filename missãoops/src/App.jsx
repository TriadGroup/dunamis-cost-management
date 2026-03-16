import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Tasks from './views/Tasks';
import FieldOps from './views/FieldOps';
import LoginGateway from './views/LoginGateway';
import StudentLogin from './views/StudentLogin';
import StaffLogin from './views/StaffLogin';
import StudentDashboard from './views/StudentDashboard';
import AttendanceReview from './views/AttendanceReview';
import HeadsManagement from './views/HeadsManagement';
import AreasManagement from './views/AreasManagement';
import EngagementMetrics from './views/EngagementMetrics';
import AuditLogs from './views/AuditLogs';
import { AppProvider, useAppContext } from './context/AppContext';

// Simple Route Guard
const ProtectedStaffRoute = ({ children }) => {
  const { activeRole } = useAppContext();
  const allowedRoles = ['admin', 'coordinator', 'admin_master', 'head'];
  if (!activeRole || !allowedRoles.includes(activeRole)) return <Navigate to="/staff/login" replace />;
  return children;
};

const ProtectedStudentRoute = ({ children }) => {
  const { activeRole } = useAppContext();
  if (activeRole !== 'student') return <Navigate to="/student/login" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginGateway />} />
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/staff/login" element={<StaffLogin />} />

      <Route path="/student/dashboard" element={
        <ProtectedStudentRoute>
          <StudentDashboard />
        </ProtectedStudentRoute>
      } />

      <Route path="/staff" element={
        <ProtectedStaffRoute>
          <Layout />
        </ProtectedStaffRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="attendance" element={<AttendanceReview />} />
        <Route path="heads" element={<HeadsManagement />} />
        <Route path="areas" element={<AreasManagement />} />
        <Route path="metrics" element={<EngagementMetrics />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="field" element={<FieldOps />} />
      </Route>

      {/* Catch All redirect to gateway */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
