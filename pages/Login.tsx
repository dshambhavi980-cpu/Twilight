import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-dark font-display">
      <div className="flex items-center bg-transparent p-4 pb-2 justify-between z-10">
        <button onClick={() => navigate('/welcome')} className="text-white flex size-12 shrink-0 items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-white/90 text-sm font-medium tracking-[0.2em] uppercase flex-1 text-center pr-12">
          Twilight Garden
        </h2>
      </div>

      <div className="flex flex-col flex-1 items-center justify-center px-6 py-8 z-10">
        <div className="w-24 h-24 mb-8 relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
          <div
            className="relative w-full h-full rounded-full border border-primary/30 flex items-center justify-center overflow-hidden bg-surface-dark"
          >
            <span className="material-symbols-outlined text-primary text-5xl">eco</span>
          </div>
        </div>

        <div className="max-w-md w-full text-center mb-10">
          <h1 className="text-white text-[32px] font-bold leading-tight tracking-tight mb-3">Welcome Back</h1>
          <p className="text-white/60 text-base font-normal leading-relaxed px-4">
            Find your flow. Please log in to your sanctuary.
          </p>
        </div>

        <div className="w-full max-w-md bg-surface-dark/50 backdrop-blur-sm p-8 rounded-xl border border-white/5 shadow-2xl">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm mb-4">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-white/80 text-sm font-medium ml-1">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl pointer-events-none">
                  mail
                </span>
                <input
                  name="email"
                  className="w-full rounded-xl text-white border border-white/10 bg-surface-dark focus:outline-none focus:ring-1 focus:ring-primary/50 h-14 pl-12 pr-4 placeholder:text-white/30 text-base font-normal transition-all"
                  placeholder="Your email"
                  type="email"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-white/80 text-sm font-medium">Password</label>
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-primary text-xs font-semibold hover:underline">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl pointer-events-none">
                  lock
                </span>
                <input
                  name="password"
                  className="w-full rounded-xl text-white border border-white/10 bg-surface-dark focus:outline-none focus:ring-1 focus:ring-primary/50 h-14 pl-12 pr-4 placeholder:text-white/30 text-base font-normal transition-all"
                  placeholder="Your password"
                  type="password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group mt-2"
            >
              <span>{loading ? 'Logging in...' : 'Log In'}</span>
              {!loading && (
                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              )}
            </button>
          </form>

          <div className="relative my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/5"></div>
            <span className="text-xs font-medium text-white/30 whitespace-nowrap">OR CONTINUE WITH</span>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button className="flex items-center justify-center gap-3 h-12 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md">
              <span className="material-symbols-outlined text-white text-xl">brand_family</span>
              <span className="text-white/80 text-sm font-medium">Google</span>
            </button>
          </div>
        </div>

        <p className="mt-8 text-white/40 text-sm">
          New to the garden?{' '}
          <button onClick={() => navigate('/signup')} className="text-primary font-bold hover:underline ml-1">
            Create an account
          </button>
        </p>
      </div>

      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[30%] bg-primary/10 blur-[120px] rounded-full z-0"></div>
      <div className="fixed bottom-[-5%] left-[-5%] w-[50%] h-[40%] bg-primary/5 blur-[100px] rounded-full z-0"></div>
    </div>
  );
};

export default Login;