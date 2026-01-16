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
      // Find Supabase auth token in localStorage (starts with 'sb-')
      const keys = Object.keys(localStorage);
      const authKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (authKey) {
        const cached = localStorage.getItem(authKey);
        if (cached) {
          const data = JSON.parse(cached);
          const session = data?.currentSession || data;
          if (session?.user) {
            return {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url
            };
          }
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
    return null;
  };

  const [user, setUser] = useState<User | null>(getCachedUser);
  const [loading, setLoading] = useState(!getCachedUser()); // Only show loading if no cache

  useEffect(() => {
    // 1. Get initial session (may already be loaded from cache)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { 
        id: session.user.id, 
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name,
        avatar_url: session.user.user_metadata?.avatar_url
      } : null);
      setLoading(false);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { 
        id: session.user.id, 
        email: session.user.email || '', 
        name: session.user.user_metadata?.full_name,
        avatar_url: session.user.user_metadata?.avatar_url
      } : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error("Error signing out:", error);
    } finally {
        localStorage.clear();
        setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};