import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
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
  // Keep loading=true until we verify the session from Supabase
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (sessionUser: any): Promise<User> => {
    console.log('[AUTH DEBUG] fetchProfile called for user:', sessionUser.id, sessionUser.email);
    
    // FAST PATH: Known admin emails - skip database query entirely
    const knownAdminEmails = ['adiroyboy2@gmail.com'];
    const isKnownAdmin = knownAdminEmails.includes(sessionUser.email?.toLowerCase());
    
    if (isKnownAdmin) {
      console.log('[AUTH DEBUG] Known admin detected - skipping DB query');
      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.user_metadata?.full_name,
        avatar_url: sessionUser.user_metadata?.avatar_url,
        role: 'admin'
      };
    }

    // For regular users, try to fetch profile with short timeout
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 2000);
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

      const profile = data as { role: 'user' | 'admin' } | null;

      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.user_metadata?.full_name,
        avatar_url: sessionUser.user_metadata?.avatar_url,
        role: profile?.role || 'user'
      };
    } catch (err: any) {
      console.warn("[AUTH DEBUG] Profile fetch failed, using default role:", err?.message);
      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.user_metadata?.full_name,
        avatar_url: sessionUser.user_metadata?.avatar_url,
        role: 'user'
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
                    }
                } else {
                    console.log('[AUTH DEBUG] No session, setting user to null');
                    if (mounted) {
                        setUser(null);
                        cacheUser(null);
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
      // On SIGN_OUT, session is null
      if (session?.user) {
          console.log('[AUTH DEBUG] Auth state changed - fetching profile...');
          const userData = await fetchProfile(session.user);
          if (mounted) {
              setUser(userData);
              cacheUser(userData);
              setLoading(false);
              console.log('[AUTH DEBUG] Auth state change complete, user:', userData);
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
        localStorage.removeItem('twilight-user-auth'); // Clear specific key
        // We might want to clear everything or just our keys
        // localStorage.clear(); 
        setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};