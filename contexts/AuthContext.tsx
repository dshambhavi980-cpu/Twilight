import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { registerPushNotifications } from '../lib/notifications';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionVerified: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  sessionVerified: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage cache to prevent flash
  const getCachedUser = (): User | null => {
    try {
      // Check for our cached user with role
      const cached = localStorage.getItem('twilight-cached-user');
      if (cached) {
        const userData = JSON.parse(cached) as User;
        if (userData?.id && userData?.role) {
          return userData;
        }
      }
    } catch (e) {
      // Ignore cache errors
      console.warn('Error reading from auth cache', e);
    }
    return null;
  };

  const cacheUser = (userData: User | null) => {
    try {
      if (userData) {
        localStorage.setItem('twilight-cached-user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('twilight-cached-user');
      }
    } catch (e) {
      console.warn('Error caching user', e);
    }
  };

  const cachedUser = getCachedUser();
  const [user, setUser] = useState<User | null>(cachedUser);
  // If we have a cached user, skip the loading screen entirely — render immediately
  const [loading, setLoading] = useState(!cachedUser);
  // Tracks whether supabase session has been verified (JWT is valid)
  const [sessionVerified, setSessionVerified] = useState(false);

  const fetchProfile = async (sessionUser: any): Promise<User> => {
    console.log('[AUTH DEBUG] fetchProfile called for user:', sessionUser.id, sessionUser.email);
    
    
    // For regular users, try to fetch profile with short timeout

    // For regular users, try to fetch profile with short timeout
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
    });

    try {
      const queryPromise = supabase
        .from('profiles')
        .select('role')
        .eq('id', sessionUser.id)
        .single();
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data, error } = result as any;
      
      console.log('[AUTH DEBUG] Profile query result:', { data, error });

      const profile = data as { role: 'user' | 'admin' | 'partner' } | null;

      // Use profile role, but if it's 'user', check user_metadata.is_partner as fallback
      // This handles the case where the profile trigger didn't set the partner role
      let role: 'user' | 'admin' | 'partner' = profile?.role || 'user';
      if (role === 'user' && sessionUser.user_metadata?.is_partner === true) {
        console.log('[AUTH DEBUG] Profile role is user but is_partner metadata found - using partner role');
        role = 'partner';
      }

      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.user_metadata?.full_name,
        avatar_url: sessionUser.user_metadata?.avatar_url,
        role,
        user_metadata: sessionUser.user_metadata
      };
    } catch (err: any) {
      console.warn("[AUTH DEBUG] Profile fetch failed, using default role:", err?.message);
      // Even on failure, check user_metadata.is_partner so partners aren't wrongly assigned 'user'
      const fallbackRole: 'user' | 'partner' = sessionUser.user_metadata?.is_partner === true ? 'partner' : 'user';
      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.user_metadata?.full_name,
        avatar_url: sessionUser.user_metadata?.avatar_url,
        role: fallbackRole,
        user_metadata: sessionUser.user_metadata
      };
    }
  };


  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
        console.log('[AUTH DEBUG] initAuth started');
        try {
            // Get initial session
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log('[AUTH DEBUG] getSession result:', { hasSession: !!session, error });
            if (error) throw error;

            if (mounted) {
                if (session?.user) {
                    console.log('[AUTH DEBUG] Session user found, fetching profile...');
                    const userData = await fetchProfile(session.user);
                    console.log('[AUTH DEBUG] Profile fetched, setting user:', userData);
                    if (mounted) {
                        setUser(userData);
                        cacheUser(userData);
                        console.log('[AUTH DEBUG] User set successfully');
                        setSessionVerified(true);
                        // Register for push notifications on mobile
                        registerPushNotifications(userData.id);
                    }
                } else {
                    console.log('[AUTH DEBUG] No session, setting user to null');
                    if (mounted) {
                        setUser(null);
                        cacheUser(null);
                        setSessionVerified(true);
                    }
                }
            }
        } catch (error) {
            console.error("[AUTH DEBUG] Auth initialization error:", error);
            // On error, use cached user if available
            if (mounted) {
                const cached = getCachedUser();
                if (cached) {
                    setUser(cached);
                } else {
                    setUser(null);
                }
            }
        } finally {
            console.log('[AUTH DEBUG] initAuth finally block, setting loading=false');
            if (mounted) setLoading(false);
        }
    };

    initAuth();

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AUTH DEBUG] onAuthStateChange event:', _event, 'hasSession:', !!session);

      // TOKEN_REFRESHED: Supabase just refreshed the JWT. The user hasn't changed.
      // KEEP the existing user object to avoid a costly re-fetch that can time out
      // and reset role/onboarding state. This is the key fix for the onboarding loop.
      if (_event === 'TOKEN_REFRESHED') {
        console.log('[AUTH DEBUG] Token refreshed - keeping existing user, no re-fetch');
        return;
      }

      // On SIGN_OUT, session is null
      if (session?.user) {
          console.log('[AUTH DEBUG] Auth state changed - fetching profile...');
          const userData = await fetchProfile(session.user);
          if (mounted) {
              setUser(userData);
              cacheUser(userData);
              setLoading(false);
              setSessionVerified(true);
              console.log('[AUTH DEBUG] Auth state change complete, user:', userData);
              if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
                registerPushNotifications(userData.id);
              }
          }
      } else {
          console.log('[AUTH DEBUG] Auth state changed - no session');
          if (mounted) {
            setUser(null);
            cacheUser(null);
            setLoading(false);
          }
      }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error("Error signing out:", error);
    } finally {
        localStorage.removeItem('twilight-user-auth');
        localStorage.removeItem('twilight-cached-user');
        localStorage.removeItem('twilight_profile');
        setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, sessionVerified, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};