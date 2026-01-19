import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Singleton pattern to prevent multiple client instances
declare global {
  var __supabase: SupabaseClient<Database> | undefined;
}

function getSupabaseClient(): SupabaseClient<Database> {
  if (typeof window !== 'undefined' && window.__supabase) {
    return window.__supabase;
  }
  
  if (globalThis.__supabase) {
    return globalThis.__supabase;
  }

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'twilight-app',
      },
    },
  });

  // Store in globalThis for reuse
  globalThis.__supabase = client;
  
  // Also store in window for browser
  if (typeof window !== 'undefined') {
    (window as any).__supabase = client;
  }

  return client;
}

export const supabase = getSupabaseClient();
