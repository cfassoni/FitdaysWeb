import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormEvent } from 'react';
import { api } from '../lib/api';
import { TrendingUp, Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

interface ForgotPasswordProps {
  onGoToLogin: () => void;
  onGoToReset: (email?: string, code?: string) => void;
  initialEmail?: string;
}

export default function ForgotPassword({
  onGoToLogin,
  onGoToReset,
  initialEmail = '',
}: ForgotPasswordProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError(t('common.validation.invalidEmail'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await api.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || t('forgotPassword.errorDefault'));
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

        {isSubmitted ? (
          <div className="text-center py-4 space-y-6">
            <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                {t('forgotPassword.successTitle')}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('forgotPassword.successMessage')}
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={() => onGoToReset(email)}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="h-4 w-4" />
                <span>{t('forgotPassword.enterCodeButton')}</span>
              </button>

              <button
                type="button"
                onClick={onGoToLogin}
                className="w-full py-2.5 rounded-lg border border-border text-foreground hover:bg-muted text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t('forgotPassword.backToLogin')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col items-center mb-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
                {t('forgotPassword.title')}
              </h1>
              <p className="text-sm text-muted-foreground text-center">
                {t('forgotPassword.subtitle')}
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="forgot-email">
                  {t('forgotPassword.emailLabel')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isLoading}
                    placeholder={t('forgotPassword.emailPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('forgotPassword.sending')}</span>
                  </>
                ) : (
                  <span>{t('forgotPassword.sendButton')}</span>
                )}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => onGoToReset(email)}
                className="text-xs text-primary hover:underline font-medium cursor-pointer flex items-center gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>{t('forgotPassword.enterCodeButton')}</span>
              </button>

              <button
                type="button"
                onClick={onGoToLogin}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5 mt-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t('forgotPassword.backToLogin')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
