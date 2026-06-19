import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormEvent } from 'react';
import { api } from '../lib/api';
import { TrendingUp, Lock, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

interface LoginProps {
  onLoginSuccess: () => void;
  onGoToRegister: () => void;
}

export default function Login({ onLoginSuccess, onGoToRegister }: LoginProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(t('common.required'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await api.login(username, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || t('login.errorDefault'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative w-full">
      <LanguageSelector variant="floating" />
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-primary to-indigo-500 rounded-b-full" />

        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <TrendingUp className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">{t('login.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="username">
              {t('login.username')}
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
                disabled={isLoading}
                placeholder={t('login.usernamePlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="password">
              {t('login.password')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('login.signingIn')}</span>
              </>
            ) : (
              <span>{t('login.signIn')}</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t('login.noAccount')}{' '}
            <button
              onClick={onGoToRegister}
              disabled={isLoading}
              className="font-medium text-primary hover:underline hover:text-primary/90 cursor-pointer disabled:opacity-50"
            >
              {t('login.signUp')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
