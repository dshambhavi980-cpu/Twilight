import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const PartnerLogin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Successful login
        // Check if they are a partner based on metadata or role
        const isPartner = data.user.user_metadata?.is_partner;
        
        // Redirect logic
        // If they are a partner, go to dashboard or join page
        // If they accidentally used this login but are a regular user, redirect to main dashboard
        if (isPartner) {
            navigate('/partner');
        } else {
            // Fallback for regular users who might be lost
            navigate('/dashboard'); 
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-dark text-white font-display">
      <div className="flex items-center p-4 pb-2 justify-between z-10">
        <button onClick={() => navigate('/welcome')} className="text-white flex size-12 items-center justify-center hover:bg-white/5 rounded-full">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-12">Partner Login</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
             <span className="material-symbols-outlined text-4xl text-blue-400">login</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-white/60 text-sm">Sign in to your supporter account</p>
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>}
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/70 ml-1">Email</label>
            <input name="email" type="email" required className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 focus:border-blue-500 outline-none transition-all" placeholder="your@email.com" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/70 ml-1">Password</label>
            <div className="relative">
              <input name="password" type={showPassword ? "text" : "password"} required className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 pr-12 focus:border-blue-500 outline-none transition-all" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                <span className="material-symbols-outlined">{showPassword ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>
            <div className="flex justify-end pt-1">
                <button type="button" onClick={() => navigate('/partner/forgot-password')} className="text-xs text-blue-400 hover:text-blue-300">Forgot Password?</button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full h-14 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold text-white transition-all shadow-lg shadow-blue-500/20 mt-6 flex items-center justify-center gap-2">
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            {!loading && <span className="material-symbols-outlined">login</span>}
          </button>
        </form>

        <div className="relative my-8 flex items-center gap-4 w-full max-w-md">
            <div className="h-px flex-1 bg-white/10"></div>
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">OR</span>
            <div className="h-px flex-1 bg-white/10"></div>
        </div>

        <button 
           onClick={async () => {
             const isCapacitor = window.location.href.includes("localhost") && (navigator.userAgent.includes("Android") || navigator.userAgent.includes("iPhone"));
             const redirectUrl = isCapacitor ? "com.twilight.garden://partner/auth-callback" : `${window.location.origin}/#/partner/auth-callback`;
             
             await supabase.auth.signInWithOAuth({
               provider: 'google',
               options: { redirectTo: redirectUrl }
             });
           }}
           className="w-full max-w-md flex items-center justify-center gap-2 h-14 rounded-xl bg-white hover:bg-gray-50 transition-colors text-[#121014] font-bold"
        >
             <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
             </svg>
             <span>Continue with Google</span>
        </button>

        <p className="mt-8 text-white/40 text-sm">
          New here? <button onClick={() => navigate('/partner/signup')} className="text-blue-400 hover:text-blue-300 font-semibold">Join as Partner</button>
        </p>
      </div>
    </div>
  );
};

export default PartnerLogin;
