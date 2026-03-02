import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { registerPushNotifications } from '../lib/notifications';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionVerified: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  sessionVerified: false,
  signOut: async () => {},
  refreshUser: async () => {},
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
  // If we have a cached user, skip ALL loading — render the app instantly
  const [loading, setLoading] = useState(!cachedUser);
  // If cached user exists, treat session as verified immediately — background refresh will update if needed
  const [sessionVerified, setSessionVerified] = useState(!!cachedUser);

  const fetchProfile = async (sessionUser: any): Promise<User> => {
    // ALWAYS try the DB first (it's the source of truth for role).
    // This prevents partners on new devices from being sent to onboarding
    // when is_partner metadata is missing from the session.
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 3000);
    });

    try {
      const queryPromise = supabase
        .from('profiles')
        .select('role, full_name, avatar_url')
        .eq('id', sessionUser.id)
        .single();
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data, error } = result as any;

      const profile = data as { role: 'user' | 'admin' | 'partner'; full_name?: string; avatar_url?: string } | null;

      // DB role is authoritative. If DB says 'partner', use it regardless of metadata.
      // Also accept metadata is_partner as a fallback for the very first login before profile row exists.
      const dbRole = profile?.role;
      const metaIsPartner = sessionUser.user_metadata?.is_partner === true;
      const role: 'user' | 'admin' | 'partner' = 
        dbRole === 'partner' || dbRole === 'admin' 
          ? dbRole 
          : metaIsPartner 
            ? 'partner' 
            : dbRole || 'user';

      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: profile?.full_name || sessionUser.user_metadata?.full_name,
        // Only use the avatar from the profiles DB table — never fall back to
        // sessionUser.user_metadata.avatar_url which is the Gmail/Google photo
        avatar_url: profile?.avatar_url || undefined,
        role,
        user_metadata: sessionUser.user_metadata
      };
    } catch (err: any) {
      // Even on failure, check user_metadata.is_partner so partners aren't wrongly assigned 'user'
      const fallbackRole: 'user' | 'partner' = sessionUser.user_metadata?.is_partner === true ? 'partner' : 'user';
      // On timeout/error, preserve the cached avatar_url instead of overwriting with Gmail photo
      const cachedAvatar = getCachedUser()?.avatar_url;
      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.user_metadata?.full_name,
        avatar_url: cachedAvatar || undefined,
        role: fallbackRole,
        user_metadata: sessionUser.user_metadata
      };
    }
  };


  // Refresh user profile from DB and update state + cache
  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userData = await fetchProfile(session.user);
        setUser(userData);
        cacheUser(userData);
        // Also update twilight_profile cache with timestamp
        try {
          localStorage.setItem('twilight_profile', JSON.stringify({
            full_name: userData.name,
            avatar_url: userData.avatar_url,
            _cachedAt: Date.now()
          }));
        } catch {}
      }
    } catch (err) {
      import.meta.env.DEV && console.warn('[Auth] refreshUser failed:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;

            if (mounted) {
                if (session?.user) {
                    const userData = await fetchProfile(session.user);
                    if (mounted) {
                        setUser(userData);
                        cacheUser(userData);
                        // Sync twilight_profile cache
                        try {
                          localStorage.setItem('twilight_profile', JSON.stringify({
                            full_name: userData.name,
                            avatar_url: userData.avatar_url,
                            _cachedAt: Date.now()
                          }));
                        } catch {}
                        setSessionVerified(true);
                        registerPushNotifications(userData.id).catch(() => {});
                    }
                } else {
                    if (mounted) {
                        setUser(null);
                        cacheUser(null);
                        setSessionVerified(true);
                    }
                }
            }
        } catch (error) {
            // On error, use cached user if available
            if (mounted) {
                const cached = getCachedUser();
                if (cached) {
                    setUser(cached);
                } else {
                    setUser(null);
                }
                setSessionVerified(true);
            }
        } finally {
            if (mounted) setLoading(false);
        }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // TOKEN_REFRESHED: Supabase just refreshed the JWT. The user hasn't changed.
      // KEEP the existing user object to avoid a costly re-fetch that can time out
      // and reset role/onboarding state. This is the key fix for the onboarding loop.
      if (_event === 'TOKEN_REFRESHED') return;

      if (session?.user) {
          const userData = await fetchProfile(session.user);
          if (mounted) {
              setUser(userData);
              cacheUser(userData);
              // Sync twilight_profile cache
              try {
                localStorage.setItem('twilight_profile', JSON.stringify({
                  full_name: userData.name,
                  avatar_url: userData.avatar_url,
                  _cachedAt: Date.now()
                }));
              } catch {}
              setLoading(false);
              setSessionVerified(true);
              if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
                registerPushNotifications(userData.id).catch(() => {});
              }
          }
      } else {
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
        try {
          const m = await import('../lib/encryption');
          m.clearEncryptionCache();
        } catch {}
        // Clear all twilight-related localStorage keys
        const keysToRemove = Object.keys(localStorage).filter(k => 
          k.startsWith('tw_') || k.startsWith('twilight')
        );
        keysToRemove.forEach(k => localStorage.removeItem(k));
        localStorage.removeItem('twilight-user-auth');
        localStorage.removeItem('twilight-cached-user');
        localStorage.removeItem('twilight_profile');
        setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, sessionVerified, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};