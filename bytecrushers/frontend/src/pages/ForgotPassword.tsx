import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card rounded-2xl p-8 text-center relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-2xl text-purple-400 mb-4 border border-purple-500/20">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold font-outfit text-white">Reset Link Sent!</h2>
          <p className="text-sm text-muted-foreground mt-3 font-inter leading-relaxed">
            We have sent password reset instructions to <strong>{email}</strong>.
            Please check your inbox.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full mt-6 py-3 rounded-xl glowing-button text-sm font-semibold text-white cursor-pointer font-inter"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-2xl text-purple-400 mb-3 border border-purple-500/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold font-outfit text-white tracking-tight">Reset Password</h2>
          <p className="text-sm text-muted-foreground mt-2 font-inter">Enter your email and we'll send you recovery steps</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-inter">
            {error}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4 font-inter">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl glowing-button text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed mt-4 font-inter"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground font-inter">
          Remember your password?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
