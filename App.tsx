import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider, useData } from './contexts/DataContext';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import CalendarView from './pages/Calendar';
import Insights from './pages/Insights';
import LogDetails from './pages/LogDetails';
import Settings from './pages/Settings';
import CycleLengthSettings from './pages/CycleLengthSettings';
import PeriodLengthSettings from './pages/PeriodLengthSettings';
import EditProfile from './pages/EditProfile';
import LogHistory from './pages/LogHistory';
import ForgotPassword from './pages/ForgotPassword';
import NotificationSettings from './pages/settings/NotificationSettings';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowIncomplete?: boolean }> = ({ children, allowIncomplete = false }) => {
  const { user, loading: authLoading } = useAuth();
  
  // Return null instead of loading message to prevent flash
  if (authLoading) return null;
  if (!user) return <Navigate to="/welcome" />;
  
  return <RequireOnboarding allowIncomplete={allowIncomplete}>{children}</RequireOnboarding>;
};

const RequireOnboarding: React.FC<{ children: React.ReactNode; allowIncomplete: boolean }> = ({ children, allowIncomplete }) => {
    const { cycleSettings, loading } = useData();

    // Return null instead of loading message to prevent flash
    if (loading) return null;

    if (!cycleSettings.onboardingCompleted && !allowIncomplete) {
        return <Navigate to="/onboarding" />;
    }

    if (cycleSettings.onboardingCompleted && allowIncomplete) {
        // User is completed but trying to access onboarding -> go to dashboard
         return <Navigate to="/" />;
    }

    return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <HashRouter>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route path="/onboarding" element={
                <ProtectedRoute allowIncomplete={true}>
                    <Onboarding />
                </ProtectedRoute>
            } />
            
            <Route element={<Layout />}>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
              <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
              <Route path="/log/details" element={<ProtectedRoute><LogDetails /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/settings/cycle-length" element={<ProtectedRoute><CycleLengthSettings /></ProtectedRoute>} />
              <Route path="/settings/period-length" element={<ProtectedRoute><PeriodLengthSettings /></ProtectedRoute>} />
              <Route path="/settings/history" element={<ProtectedRoute><LogHistory /></ProtectedRoute>} />
              <Route path="/settings/profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
            </Route>
          </Routes>
        </HashRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;