import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.target as HTMLFormElement;
    const inputEmail = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const fullName = (form.elements.namedItem('fullName') as HTMLInputElement).value;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: inputEmail,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      
      // If signup is successful, we expect an email to be sent with OTP (if configured)
      // We switch to verification mode
      if (data.user) {
         setEmail(inputEmail);
         setVerifying(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      if (error) throw error;

      if (data.session) {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (verifying) {
    return (
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#FDFCF8] dark:bg-background-dark font-display transition-colors duration-300">
        <div className="flex items-center bg-transparent p-4 pb-2 justify-between z-10">
            <button onClick={() => setVerifying(false)} className="text-[#121014] dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
            <h2 className="text-[#121014] dark:text-white text-lg font-bold flex-1 text-center pr-12">
            Verification
            </h2>
        </div>

        <div className="flex flex-col flex-1 items-center justify-center px-6 py-8 z-10">
            <div className="w-full max-w-md bg-white dark:bg-surface-dark/50 backdrop-blur-sm p-8 rounded-xl border border-gray-100 dark:border-white/5 shadow-xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                    </div>
                    <h1 className="text-[#121014] dark:text-white text-2xl font-bold mb-2">Check your email</h1>
                    <p className="text-gray-500 dark:text-[#A1A1AA] text-sm">
                        We sent a verification code to <br/><span className="font-semibold text-[#121014] dark:text-white">{email}</span>
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleVerifyOtp}>
                    {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm">
                        {error}
                    </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="text-gray-700 dark:text-[#D4D4D8] text-sm font-medium ml-1">Verification Code</label>
                        <input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full rounded-2xl text-[#121014] dark:text-white bg-gray-50 dark:bg-[#27272A] border border-gray-200 dark:border-none focus:ring-2 focus:ring-primary h-14 px-5 text-center text-xl tracking-widest placeholder:text-gray-400 dark:placeholder:text-[#71717A] transition-all"
                            placeholder="000000"
                            type="text"
                            maxLength={8}
                            required
                        />
                    </div>

                    <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-full shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                    >
                    <span>{loading ? 'Verifying...' : 'Verify Email'}</span>
                    </button>
                </form>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#FDFCF8] dark:bg-background-dark font-display transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center bg-transparent p-4 pb-2 justify-between z-10">
        <button onClick={() => navigate('/welcome')} className="text-[#121014] dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-[#121014] dark:text-white text-lg font-bold flex-1 text-center pr-12">
          Begin Your Journey
        </h2>
      </div>

      <div className="flex flex-col flex-1 items-center justify-start px-6 pt-6 pb-8 z-10">
        
        {/* Logo */}
        <div className="mb-6 relative">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
             <span className="material-symbols-outlined text-primary text-4xl">eco</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-[#121014] dark:text-white text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-500 dark:text-[#A1A1AA] text-sm">
            Join our community for<br/>personalized cycle insights.
          </p>
        </div>

        <div className="w-full max-w-md">
          <form className="space-y-5" onSubmit={handleSignup}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-gray-700 dark:text-[#D4D4D8] text-sm font-medium ml-1">Full Name</label>
              <input
                name="fullName"
                className="w-full rounded-2xl text-[#121014] dark:text-white bg-gray-50 dark:bg-[#27272A] border border-gray-200 dark:border-none focus:ring-2 focus:ring-primary h-14 px-5 placeholder:text-gray-400 dark:placeholder:text-[#71717A] text-base transition-all"
                placeholder="Enter your name"
                type="text"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-700 dark:text-[#D4D4D8] text-sm font-medium ml-1">Email Address</label>
              <input
                name="email"
                className="w-full rounded-2xl text-[#121014] dark:text-white bg-gray-50 dark:bg-[#27272A] border border-gray-200 dark:border-none focus:ring-2 focus:ring-primary h-14 px-5 placeholder:text-gray-400 dark:placeholder:text-[#71717A] text-base transition-all"
                placeholder="yourname@example.com"
                type="email"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-gray-700 dark:text-[#D4D4D8] text-sm font-medium ml-1">Create Password</label>
              <div className="relative">
                <input
                  name="password"
                  className="w-full rounded-2xl text-[#121014] dark:text-white bg-gray-50 dark:bg-[#27272A] border border-gray-200 dark:border-none focus:ring-2 focus:ring-primary h-14 pl-5 pr-12 placeholder:text-gray-400 dark:placeholder:text-[#71717A] text-base transition-all"
                  placeholder="........"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#71717A] hover:text-[#121014] dark:hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
              <p className="text-gray-400 dark:text-[#71717A] text-xs px-1">
                Must be at least 8 characters with a mix of letters and numbers.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-full shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group mt-4 active:scale-[0.98]"
            >
              <span>{loading ? 'Sending Code...' : 'Sign Up'}</span>
              {!loading && (
                <span className="material-symbols-outlined text-xl">
                  arrow_forward
                </span>
              )}
            </button>
          </form>

          <div className="relative my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200 dark:bg-[#3F3F46]"></div>
            <span className="text-xs font-semibold text-gray-400 dark:text-[#71717A] uppercase tracking-wider">OR SIGN UP WITH</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-[#3F3F46]"></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-white dark:bg-[#27272A] hover:bg-gray-50 dark:hover:bg-[#3F3F46] transition-colors border border-gray-200 dark:border-transparent hover:border-gray-300 dark:hover:border-[#52525B]"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
              <span className="text-[#121014] dark:text-white font-medium">Continue with Google</span>
            </button>
          </div>

          <p className="mt-8 text-center text-gray-500 dark:text-[#A1A1AA] text-sm">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline">
              Log In
            </button>
          </p>

          <div className="mt-8 text-center">
             <p className="text-gray-400 dark:text-[#52525B] text-xs">
               By signing up, you agree to our <a href="#" className="underline hover:text-gray-600 dark:hover:text-[#71717A]">Terms of Service</a><br/>
               and <a href="#" className="underline hover:text-gray-600 dark:hover:text-[#71717A]">Privacy Policy</a>.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
