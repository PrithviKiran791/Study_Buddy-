import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '@/components/Toast';
import { ArrowLeft } from 'lucide-react';
import { LoaderOne } from '@/components/ui/loader';

export function LoginPopoverModel({ onClose, initialMode = 'login', onSuccess, inline = false }) {
  const { login, register, loginWithGoogle, loginWithGithub, resetPassword } = useAuth();
  
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleNameChange = (e) => setDisplayName(e.target.value);

  const formatAuthError = (err) => {
    const code = err.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Incorrect email or password.';
    } else if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists.';
    } else if (code === 'auth/weak-password') {
      return 'Password should be at least 6 characters.';
    } else if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    } else if (code === 'auth/too-many-requests') {
      return 'Too many attempts. Please try again later.';
    }
    return err.message || 'Authentication failed. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (mode !== 'reset' && !password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success('Welcome back to Study Buddy!');
        if (onSuccess) onSuccess();
      } else if (mode === 'register') {
        await register(email, password, displayName);
        toast.success('Account created successfully!');
        if (onSuccess) onSuccess();
      } else if (mode === 'reset') {
        await resetPassword(email);
        toast.success('Password reset email sent! Check your inbox.');
        setMode('login');
      }
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Signed in with Google!');
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithGithub();
      toast.success('Signed in with GitHub!');
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInLogin = () => {
    toast.error('LinkedIn authentication requires custom provider configuration in Firebase Console.');
  };

  const cardContent = (
    <div className={`relative w-full max-w-md ${inline ? 'mx-auto' : 'my-auto'}`}>
      <div className={`relative ${inline ? 'bg-neutral-950/90 dark:bg-black/95 backdrop-blur-xl border-neutral-800 shadow-2xl shadow-black/80' : 'bg-white dark:bg-black border-gray-300 dark:border-gray-800'} rounded-2xl shadow-2xl border transition-all`}>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-transparent hover:bg-neutral-800/60 rounded-lg text-sm p-1.5 inline-flex items-center transition-colors"
            >
              <svg
                aria-hidden="true"
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="sr-only">Close popup</span>
            </button>
          )}

          <div className="p-6 md:p-8">
            <div className="text-center">
              <p className="mb-2 text-2xl md:text-3xl font-bold leading-7 text-white">
                {mode === 'login' && 'Login to your account'}
                {mode === 'register' && 'Create your account'}
                {mode === 'reset' && 'Reset your password'}
              </p>
              <p className="mt-2 text-xs md:text-sm text-zinc-300">
                {mode === 'login' && 'Welcome back to Study Buddy! Access your study assistant.'}
                {mode === 'register' && 'Join Study Buddy to unlock persistent AI memory and notes.'}
                {mode === 'reset' && 'Enter your email address and we will send a reset link.'}
              </p>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-lg bg-neutral-900 border border-red-500/40 text-red-400 text-xs text-center font-medium">
                {errorMsg}
              </div>
            )}

            {mode !== 'reset' && (
              <div className="mt-6 flex flex-col gap-2.5">
                {/* Google Login Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800/80 p-2 text-xs md:text-sm font-semibold text-neutral-200 outline-none hover:text-white transition-all focus:ring-2 focus:ring-neutral-400 disabled:opacity-60 shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#fbc02d" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20 s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                    <path fill="#e53935" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                    <path fill="#4caf50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                    <path fill="#1565c0" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            )}

            {mode !== 'reset' && (
              <div className="flex w-full items-center gap-3 py-5 text-xs text-neutral-500">
                <div className="h-px w-full bg-neutral-800"></div>
                OR
                <div className="h-px w-full bg-neutral-800"></div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-3.5 mt-2">
              {mode === 'register' && (
                <div>
                  <label htmlFor="displayName" className="sr-only">Full Name</label>
                  <input
                    name="displayName"
                    type="text"
                    required
                    className="block w-full rounded-xl bg-neutral-900/90 border border-neutral-800 px-3.5 py-2.5 shadow-sm outline-none text-white text-sm focus:border-neutral-400 focus:ring-1 focus:ring-white placeholder-neutral-500 transition-colors"
                    placeholder="Full Name"
                    value={displayName}
                    onChange={handleNameChange}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-xl bg-neutral-900/90 border border-neutral-800 px-3.5 py-2.5 shadow-sm outline-none text-white text-sm focus:border-neutral-400 focus:ring-1 focus:ring-white placeholder-neutral-500 transition-colors"
                  placeholder="Email Address"
                  value={email}
                  onChange={handleEmailChange}
                />
              </div>

              {mode !== 'reset' && (
                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <input
                    name="password"
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    className="block w-full rounded-xl bg-neutral-900/90 border border-neutral-800 px-3.5 py-2.5 shadow-sm outline-none text-white text-sm focus:border-neutral-400 focus:ring-1 focus:ring-white placeholder-neutral-500 transition-colors"
                    placeholder="Password"
                    value={password}
                    onChange={handlePasswordChange}
                  />
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setErrorMsg(''); }}
                    className="text-xs font-semibold text-neutral-400 hover:text-white hover:underline transition-colors"
                  >
                    Reset your password?
                  </button>
                </div>
              )}

              {mode === 'reset' && (
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrorMsg(''); }}
                    className="text-xs font-semibold text-neutral-400 hover:text-white hover:underline flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-white hover:bg-neutral-200 text-black p-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-white transition-all duration-200 disabled:opacity-60 shadow-lg hover:shadow-white/10 active:scale-[0.99]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <LoaderOne className="p-0 scale-75" />
                    {mode === 'login' ? 'Signing in...' : mode === 'register' ? 'Creating account...' : 'Sending link...'}
                  </span>
                ) : (
                  <span>
                    {mode === 'login' ? 'Continue' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
                  </span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-neutral-400">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setErrorMsg(''); }}
                    className="font-bold text-white hover:text-neutral-200 hover:underline transition-colors"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrorMsg(''); }}
                    className="font-bold text-white hover:text-neutral-200 hover:underline transition-colors"
                  >
                    Log in
                  </button>
                </>
              )}
            </div>
        </div>
      </div>
    </div>
  );

  if (inline) {
    return <div className="w-full font-primarylw">{cardContent}</div>;
  }

  return (
    <div
      tabIndex="-1"
      className="bg-black/60 backdrop-blur-md overflow-y-auto overflow-x-hidden fixed inset-0 z-50 items-center justify-center flex font-primarylw p-4"
    >
      {cardContent}
    </div>
  );
}
