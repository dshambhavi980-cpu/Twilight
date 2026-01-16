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

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#121014] text-white p-6 text-center">
            <div>
                <span className="material-symbols-outlined text-4xl mb-4 text-red-500">error</span>
                <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
                <p className="text-white/60 mb-4 text-sm max-w-xs mx-auto">
                    {this.state.error?.message || "An unexpected error occurred."}
                </p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-[#984369] rounded-full text-sm font-bold"
                >
                    Reload App
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;