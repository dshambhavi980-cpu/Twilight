import React, { Component, ReactNode, ErrorInfo, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider, useData } from './contexts/DataContext';
import { CouplesProvider, useCouples } from './contexts/CouplesContext';
import { AdminProvider } from './contexts/AdminContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import { TutorialProvider } from './contexts/TutorialContext';
import { GlobalGameTutorial } from './components/tutorials/GlobalGameTutorial';
import UpdateModal from './components/UpdateModal';

// Lazy-loaded components for code splitting
const Welcome = React.lazy(() => import('./pages/Welcome'));
const Login = React.lazy(() => import('./pages/Login'));
const SignUp = React.lazy(() => import('./pages/SignUp'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const CalendarView = React.lazy(() => import('./pages/Calendar'));
const Insights = React.lazy(() => import('./pages/Insights'));
const LogDetails = React.lazy(() => import('./pages/LogDetails'));
const Settings = React.lazy(() => import('./pages/Settings'));
const CycleLengthSettings = React.lazy(() => import('./pages/CycleLengthSettings'));
const PeriodLengthSettings = React.lazy(() => import('./pages/PeriodLengthSettings'));
const EditProfile = React.lazy(() => import('./pages/EditProfile'));
const LogHistory = React.lazy(() => import('./pages/LogHistory'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const NotificationSettings = React.lazy(() => import('./pages/settings/NotificationSettings'));
const ThemeSettings = React.lazy(() => import('./pages/settings/ThemeSettings'));
const SharedCard = React.lazy(() => import('./pages/SharedCard'));
const LoveLock = React.lazy(() => import('./pages/LoveLock'));
const JoinPartner = React.lazy(() => import('./pages/JoinPartner'));
const Wellness = React.lazy(() => import('./pages/Wellness'));
const BreathingExercises = React.lazy(() => import('./pages/BreathingExercises'));
// Partner Pages Lazy Load
const PartnerLayout = React.lazy(() => import('./components/PartnerLayout'));
const PartnerDashboard = React.lazy(() => import('./pages/partner/PartnerDashboard'));
const PartnerCalendar = React.lazy(() => import('./pages/partner/PartnerCalendar'));
const PartnerInsights = React.lazy(() => import('./pages/partner/PartnerInsights'));
const PartnerLogs = React.lazy(() => import('./pages/partner/PartnerLogs'));
const PartnerProfile = React.lazy(() => import('./pages/partner/PartnerProfile'));
const PartnerNotifications = React.lazy(() => import('./pages/partner/PartnerNotifications'));
const PartnerWellness = React.lazy(() => import('./pages/partner/PartnerWellness'));


const PartnerLogin = React.lazy(() => import('./pages/partner/PartnerLogin'));
const PartnerSignUp = React.lazy(() => import('./pages/partner/PartnerSignUp'));
const PartnerForgotPassword = React.lazy(() => import('./pages/partner/PartnerForgotPassword'));
const PartnerAuthCallback = React.lazy(() => import('./pages/partner/PartnerAuthCallback'));

// Legal Pages Lazy Load
const TOS = React.lazy(() => import('./pages/legal/TOS'));
const PrivacyPolicy = React.lazy(() => import('./pages/legal/PrivacyPolicy'));

// Admin Pages Lazy Load
const AdminDashboard = React.lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminLogs = React.lazy(() => import('./pages/Admin/AdminLogs'));
const AdminProfile = React.lazy(() => import('./pages/Admin/AdminProfile'));

// Games Pages Lazy Load
const Games = React.lazy(() => import('./pages/Games'));
const TicTacToe = React.lazy(() => import('./pages/games/TicTacToe'));
const DotsBoxes = React.lazy(() => import('./pages/games/DotsBoxes'));
const ConnectFour = React.lazy(() => import('./pages/games/ConnectFour'));
const RockPaperScissors = React.lazy(() => import('./pages/games/RockPaperScissors'));
const HangmanGame = React.lazy(() => import('./pages/games/Hangman'));
const WordGuess = React.lazy(() => import('./pages/games/WordGuess'));
const TwentyQuestions = React.lazy(() => import('./pages/games/TwentyQuestions'));
const MemoryMatch = React.lazy(() => import('./pages/games/MemoryMatch'));
const TwoTruthsOneLie = React.lazy(() => import('./pages/games/TwoTruthsOneLie'));
const RiddleMe = React.lazy(() => import('./pages/games/RiddleMe'));
const StoryBuilder = React.lazy(() => import('./pages/games/StoryBuilder'));
const WouldYouRather = React.lazy(() => import('./pages/games/WouldYouRather'));
const TruthOrDare = React.lazy(() => import('./pages/games/TruthOrDare'));
const ThisOrThat = React.lazy(() => import('./pages/games/ThisOrThat'));
const LoveTrivia = React.lazy(() => import('./pages/games/LoveTrivia'));
const EmojiCharades = React.lazy(() => import('./pages/games/EmojiCharades'));
const NeverHaveIEver = React.lazy(() => import('./pages/games/NeverHaveIEver'));
const RapidFire = React.lazy(() => import('./pages/games/RapidFire'));
const SongLyrics = React.lazy(() => import('./pages/games/SongLyrics'));

// Loading spinner component
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#121014]">
    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// OAuth/Catch-all handler - waits for auth to complete before redirecting
const AuthAwareRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  // Wait for auth to finish loading before deciding where to go
  if (loading) return <LoadingScreen />;

  // Once loaded, redirect to appropriate place
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/users" replace />;
    }
    if (user.role === 'partner') {
      return <Navigate to="/partner/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Navigate to="/welcome" replace />;
};

// Role-based redirect for the home route
const RoleBasedHome: React.FC = () => {
  const { user, loading } = useAuth();
  const { isSupporter, loading: couplesLoading } = useCouples();

  if (loading || couplesLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/welcome" replace />;

  // Route based on role
  if (user.role === 'admin') {
    return <Navigate to="/admin/users" replace />;
  }
  if (user.role === 'partner') {
    return <Navigate to="/partner/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

// User-only route guard (redirects admins to admin dashboard)
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowIncomplete?: boolean }> = ({ children, allowIncomplete = false }) => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/welcome" replace />;

  // Admin users can access regular user routes (main dashboard)

  // Strict check: Partners should NOT see the main dashboard
  // They have their own dedicated section
  if (user.role === 'partner') {
    return <Navigate to="/partner/dashboard" replace />;
  }

  return <RequireOnboarding allowIncomplete={allowIncomplete}>{children}</RequireOnboarding>;
};

// Admin-only route guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

// Partner-only route guard
const PartnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { couple, isSupporter, isLoading: couplesLoading } = useCouples();

  if (loading || couplesLoading) return <LoadingScreen />;

  if (!user) return <Navigate to="/welcome" replace />;

  // Allow admins to access partner routes for testing/management
  if (user.role === 'admin') {
    return <>{children}</>;
  }

  // Partners can access routes even without a couple — pairing happens inside LoveLock

  // Strict check: non-partners who are NOT supporters (e.g. regular users trying to access partner routes)
  // should be sent back to their dashboard. 
  // BUT if they are role='partner', they belong here regardless of supporter status.
  if (user.role !== 'partner' && !isSupporter) {
    // If they are the menstruator, send them to main dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const RequireOnboarding: React.FC<{ children: React.ReactNode; allowIncomplete: boolean }> = ({ children, allowIncomplete }) => {
  const { user } = useAuth();
  const { cycleSettings, loading, error } = useData();

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121014] text-white p-6 text-center">
        <div>
          <span className="material-symbols-outlined text-4xl mb-4 text-red-500">wifi_off</span>
          <h1 className="text-xl font-bold mb-2">Connection Issue</h1>
          <p className="text-white/60 mb-4 text-sm max-w-xs mx-auto">
            {error.message || "Failed to load your data. Please check your connection."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#984369] rounded-full text-sm font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Admin users bypass onboarding entirely
  if (user?.role === 'admin') {
    return <>{children}</>;
  }

  // Partner users bypass onboarding - they don't track periods
  // Check both role AND user_metadata.is_partner for robustness
  if (user?.role === 'partner' || user?.user_metadata?.is_partner === true) {
    return <>{children}</>;
  }

  if (!cycleSettings.onboardingCompleted && !allowIncomplete) {
    return <Navigate to="/onboarding" />;
  }

  if (cycleSettings.onboardingCompleted && allowIncomplete) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Route for pages that should only be accessible when NOT logged in (Login, Signup, etc.)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  // If user is already logged in, redirect them away from public pages
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/users" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

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
  useEffect(() => {
    // Listen for Deep Links (OAuth Redirects)
    const handleDeepLink = async (url: string) => {
      try {
        const parsedUrl = new URL(url);

        // 1. Handle PKCE Flow (code in query params)
        const code = parsedUrl.searchParams.get('code');
        if (code) {
          console.log('[App] Deep link Code detected, exchanging for session...');
          await supabase.auth.exchangeCodeForSession(code);
          return;
        }

        // 2. Handle Implicit Flow (tokens in hash)
        if (parsedUrl.hash) {
          const hashContent = parsedUrl.hash.substring(1); // remove #
          const params = new URLSearchParams(hashContent);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('[App] Deep link Tokens detected, setting session...');
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      } catch (e) {
        console.error('[App] Error processing deep link', e);
      }
    };

    // Set up the listener
    const listener = CapacitorApp.addListener('appUrlOpen', (data) => {
      console.log('[App] App opened with URL:', data.url);
      // Only process if it matches our scheme/auth pattern
      if (data.url.includes('com.twilight.garden')) {
        handleDeepLink(data.url);
      }
    });

    return () => {
      listener.then(handle => handle.remove());
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CouplesProvider>
            <DataProvider>
              <TutorialProvider>
                <HashRouter>
                  <UpdateModal />
                  <GlobalGameTutorial />
                  <React.Suspense fallback={<LoadingScreen />}>
                    <Routes>
                    <Route path="/welcome" element={<PublicOnlyRoute><Welcome /></PublicOnlyRoute>} />
                    <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                    <Route path="/signup" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
                    <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />

                    {/* Dedicated Partner Auth Routes */}
                    <Route path="/partner/login" element={<PublicOnlyRoute><PartnerLogin /></PublicOnlyRoute>} />
                    <Route path="/partner/signup" element={<PublicOnlyRoute><PartnerSignUp /></PublicOnlyRoute>} />
                    <Route path="/partner/forgot-password" element={<PublicOnlyRoute><PartnerForgotPassword /></PublicOnlyRoute>} />

                    <Route path="/partner/auth-callback" element={<PartnerAuthCallback />} />

                    <Route path="/share/:code" element={<SharedCard />} />

                    {/* Legal Routes */}
                    <Route path="/tos" element={<TOS />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />

                    {/* Admin Routes - completely isolated with AdminProvider */}
                    <Route element={<AdminRoute><AdminProvider><AdminLayout /></AdminProvider></AdminRoute>}>
                      <Route path="/admin/users" element={<AdminDashboard />} />
                      <Route path="/admin/logs" element={<AdminLogs />} />
                      <Route path="/admin/profile" element={<AdminProfile />} />
                      <Route path="/admin/notes" element={<LoveLock />} />
                      <Route path="/admin/games" element={<Games />} />
                      <Route path="/admin/settings/theme" element={<ThemeSettings />} />
                      <Route path="/admin/settings/profile" element={<EditProfile />} />
                    </Route>

                    {/* Dedicated Partner Routes */}
                    <Route element={<PartnerRoute><PartnerLayout /></PartnerRoute>}>
                      <Route path="/partner/dashboard" element={<PartnerDashboard />} />
                      <Route path="/partner/calendar" element={<PartnerCalendar />} />
                      <Route path="/partner/insights" element={<PartnerInsights />} />
                      <Route path="/partner/logs" element={<PartnerLogs />} />
                      <Route path="/partner/wellness" element={<PartnerWellness />} />
                      <Route path="/partner/notes" element={<LoveLock />} />
                      <Route path="/partner/games" element={<Games />} />
                      <Route path="/partner/settings/theme" element={<ThemeSettings />} />
                      <Route path="/partner/profile" element={<PartnerProfile />} />
                    </Route>

                    {/* Legacy redirects - keeping clean */}
                    <Route path="/join-partner" element={<Navigate to="/partner/dashboard" replace />} />
                    <Route path="/partner" element={<Navigate to="/partner/dashboard" replace />} />

                    <Route path="/onboarding" element={
                      <ProtectedRoute allowIncomplete={true}>
                        <Onboarding />
                      </ProtectedRoute>
                    } />

                    {/* Root redirect - no layout, just redirect based on role */}
                    <Route path="/" element={<RoleBasedHome />} />

                    {/* User routes with user layout */}
                    <Route element={<Layout />}>
                      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
                      <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
                      <Route path="/log/details" element={<ProtectedRoute><LogDetails /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                      <Route path="/settings/cycle-length" element={<ProtectedRoute><CycleLengthSettings /></ProtectedRoute>} />
                      <Route path="/settings/period-length" element={<ProtectedRoute><PeriodLengthSettings /></ProtectedRoute>} />
                      <Route path="/settings/history" element={<ProtectedRoute><LogHistory /></ProtectedRoute>} />
                      <Route path="/settings/profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                      <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
                      <Route path="/settings/theme" element={<ProtectedRoute><ThemeSettings /></ProtectedRoute>} />
                      <Route path="/notes" element={<ProtectedRoute><LoveLock /></ProtectedRoute>} />
                      <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
                      <Route path="/wellness" element={<ProtectedRoute><Wellness /></ProtectedRoute>} />
                      <Route path="/breathing" element={<ProtectedRoute><BreathingExercises /></ProtectedRoute>} />
                    </Route>

                    {/* Standalone game routes (no bottom nav) */}
                    <Route path="/games/tictactoe" element={<ProtectedRoute><TicTacToe /></ProtectedRoute>} />
                    <Route path="/admin/games/tictactoe" element={<AdminRoute><TicTacToe /></AdminRoute>} />
                    <Route path="/partner/games/tictactoe" element={<PartnerRoute><TicTacToe /></PartnerRoute>} />
                    <Route path="/games/dots-boxes" element={<ProtectedRoute><DotsBoxes /></ProtectedRoute>} />
                    <Route path="/admin/games/dots-boxes" element={<AdminRoute><DotsBoxes /></AdminRoute>} />
                    <Route path="/partner/games/dots-boxes" element={<PartnerRoute><DotsBoxes /></PartnerRoute>} />
                    <Route path="/games/connect-four" element={<ProtectedRoute><ConnectFour /></ProtectedRoute>} />
                    <Route path="/admin/games/connect-four" element={<AdminRoute><ConnectFour /></AdminRoute>} />
                    <Route path="/partner/games/connect-four" element={<PartnerRoute><ConnectFour /></PartnerRoute>} />
                    <Route path="/games/rps" element={<ProtectedRoute><RockPaperScissors /></ProtectedRoute>} />
                    <Route path="/admin/games/rps" element={<AdminRoute><RockPaperScissors /></AdminRoute>} />
                    <Route path="/partner/games/rps" element={<PartnerRoute><RockPaperScissors /></PartnerRoute>} />
                    <Route path="/games/hangman" element={<ProtectedRoute><HangmanGame /></ProtectedRoute>} />
                    <Route path="/admin/games/hangman" element={<AdminRoute><HangmanGame /></AdminRoute>} />
                    <Route path="/partner/games/hangman" element={<PartnerRoute><HangmanGame /></PartnerRoute>} />
                    <Route path="/games/wordle" element={<ProtectedRoute><WordGuess /></ProtectedRoute>} />
                    <Route path="/admin/games/wordle" element={<AdminRoute><WordGuess /></AdminRoute>} />
                    <Route path="/partner/games/wordle" element={<PartnerRoute><WordGuess /></PartnerRoute>} />
                    <Route path="/games/20-questions" element={<ProtectedRoute><TwentyQuestions /></ProtectedRoute>} />
                    <Route path="/admin/games/20-questions" element={<AdminRoute><TwentyQuestions /></AdminRoute>} />
                    <Route path="/partner/games/20-questions" element={<PartnerRoute><TwentyQuestions /></PartnerRoute>} />
                    <Route path="/games/memory" element={<ProtectedRoute><MemoryMatch /></ProtectedRoute>} />
                    <Route path="/admin/games/memory" element={<AdminRoute><MemoryMatch /></AdminRoute>} />
                    <Route path="/partner/games/memory" element={<PartnerRoute><MemoryMatch /></PartnerRoute>} />
                    <Route path="/games/two-truths" element={<ProtectedRoute><TwoTruthsOneLie /></ProtectedRoute>} />
                    <Route path="/admin/games/two-truths" element={<AdminRoute><TwoTruthsOneLie /></AdminRoute>} />
                    <Route path="/partner/games/two-truths" element={<PartnerRoute><TwoTruthsOneLie /></PartnerRoute>} />
                    <Route path="/games/riddle-me" element={<ProtectedRoute><RiddleMe /></ProtectedRoute>} />
                    <Route path="/admin/games/riddle-me" element={<AdminRoute><RiddleMe /></AdminRoute>} />
                    <Route path="/partner/games/riddle-me" element={<PartnerRoute><RiddleMe /></PartnerRoute>} />
                    <Route path="/games/story-builder" element={<ProtectedRoute><StoryBuilder /></ProtectedRoute>} />
                    <Route path="/admin/games/story-builder" element={<AdminRoute><StoryBuilder /></AdminRoute>} />
                    <Route path="/partner/games/story-builder" element={<PartnerRoute><StoryBuilder /></PartnerRoute>} />
                    <Route path="/games/would-you-rather" element={<ProtectedRoute><WouldYouRather /></ProtectedRoute>} />
                    <Route path="/admin/games/would-you-rather" element={<AdminRoute><WouldYouRather /></AdminRoute>} />
                    <Route path="/partner/games/would-you-rather" element={<PartnerRoute><WouldYouRather /></PartnerRoute>} />

                    <Route path="/games/truth-dare" element={<ProtectedRoute><TruthOrDare /></ProtectedRoute>} />
                    <Route path="/admin/games/truth-dare" element={<AdminRoute><TruthOrDare /></AdminRoute>} />
                    <Route path="/partner/games/truth-dare" element={<PartnerRoute><TruthOrDare /></PartnerRoute>} />

                    <Route path="/games/this-or-that" element={<ProtectedRoute><ThisOrThat /></ProtectedRoute>} />
                    <Route path="/admin/games/this-or-that" element={<AdminRoute><ThisOrThat /></AdminRoute>} />
                    <Route path="/partner/games/this-or-that" element={<PartnerRoute><ThisOrThat /></PartnerRoute>} />

                    <Route path="/games/trivia" element={<ProtectedRoute><LoveTrivia /></ProtectedRoute>} />
                    <Route path="/admin/games/trivia" element={<AdminRoute><LoveTrivia /></AdminRoute>} />
                    <Route path="/partner/games/trivia" element={<PartnerRoute><LoveTrivia /></PartnerRoute>} />

                    <Route path="/games/emoji-charades" element={<ProtectedRoute><EmojiCharades /></ProtectedRoute>} />
                    <Route path="/admin/games/emoji-charades" element={<AdminRoute><EmojiCharades /></AdminRoute>} />
                    <Route path="/partner/games/emoji-charades" element={<PartnerRoute><EmojiCharades /></PartnerRoute>} />

                    <Route path="/games/never-have-i-ever" element={<ProtectedRoute><NeverHaveIEver /></ProtectedRoute>} />
                    <Route path="/admin/games/never-have-i-ever" element={<AdminRoute><NeverHaveIEver /></AdminRoute>} />
                    <Route path="/partner/games/never-have-i-ever" element={<PartnerRoute><NeverHaveIEver /></PartnerRoute>} />
                    <Route path="/games/rapid-fire" element={<ProtectedRoute><RapidFire /></ProtectedRoute>} />
                    <Route path="/admin/games/rapid-fire" element={<AdminRoute><RapidFire /></AdminRoute>} />
                    <Route path="/partner/games/rapid-fire" element={<PartnerRoute><RapidFire /></PartnerRoute>} />
                    <Route path="/games/song-lyrics" element={<ProtectedRoute><SongLyrics /></ProtectedRoute>} />
                    <Route path="/admin/games/song-lyrics" element={<AdminRoute><SongLyrics /></AdminRoute>} />
                    <Route path="/partner/games/song-lyrics" element={<PartnerRoute><SongLyrics /></PartnerRoute>} />

                    {/* Catch-all route - waits for auth then redirects appropriately */}
                    <Route path="*" element={<AuthAwareRedirect />} />
                    </Routes>
                  </React.Suspense>
              </HashRouter>
            </TutorialProvider>
          </DataProvider>
          </CouplesProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;