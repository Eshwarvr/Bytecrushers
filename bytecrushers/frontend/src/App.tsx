import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import OrgSetup from './pages/OrgSetup';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AssetManagement from './pages/AssetManagement';
import AssetDetails from './pages/AssetDetails';
import AllocationManagement from './pages/AllocationManagement';
import MaintenanceDashboard from './pages/MaintenanceDashboard';
import AuditCycles from './pages/AuditCycles';
import AuditorView from './pages/AuditorView';
import { ReportsPage } from './features/dashboard/components/ReportsPage';
import { ActivityLogsPage } from './features/dashboard/components/ActivityLogsPage';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Query initial active session status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Register listener to update token updates, signouts or signins
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase font-inter">
          Authenticating secure session...
        </p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={!session ? <ForgotPassword /> : <Navigate to="/" replace />} />

        {/* Protected Routes */}
        <Route path="/org-setup" element={session ? <OrgSetup /> : <Navigate to="/login" replace />} />
        <Route path="/dashboard" element={session ? <EmployeeDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/assets" element={session ? <AssetManagement /> : <Navigate to="/login" replace />} />
        <Route path="/assets/:id" element={session ? <AssetDetails /> : <Navigate to="/login" replace />} />
        <Route path="/workflows" element={session ? <AllocationManagement /> : <Navigate to="/login" replace />} />
        <Route path="/maintenance" element={session ? <MaintenanceDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/audit-cycles" element={session ? <AuditCycles /> : <Navigate to="/login" replace />} />
        <Route path="/auditor" element={session ? <AuditorView /> : <Navigate to="/login" replace />} />
        <Route path="/reports" element={session ? <ReportsPage /> : <Navigate to="/login" replace />} />
        <Route path="/activity-logs" element={session ? <ActivityLogsPage /> : <Navigate to="/login" replace />} />

        {/* Home Routing Portal */}
        <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
