import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../lib/api';
import { TrendingUp, Lock, User as UserIcon, Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onGoToLogin: () => void;
}

export default function Register({ onRegisterSuccess, onGoToLogin }: RegisterProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Register
      await api.register(username, email, password);
      setSuccess(true);
      
      // Auto-login after successful registration
      try {
        await api.login(username, password);
        // Add a slight delay to show success indicator before proceeding
        setTimeout(() => {
          onRegisterSuccess();
        }, 1000);
      } catch (loginErr) {
        // If auto-login fails, redirect to login page manually
        setError('Account created, but automatic login failed. Please sign in manually.');
        setSuccess(false);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Username or email might be taken.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-primary to-indigo-500 rounded-b-full" />

        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <TrendingUp className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">Start tracking your health journey today</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 animate-bounce" />
            <span>Account created successfully! Logging you in...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <UserIcon className="h-5 w-5" />
              </span>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={isLoading || success}
                placeholder="Choose a username"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <Mail className="h-5 w-5" />
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading || success}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading || success}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Registering account...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={onGoToLogin}
              disabled={isLoading || success}
              className="font-medium text-primary hover:underline hover:text-primary/90 cursor-pointer disabled:opacity-50"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
