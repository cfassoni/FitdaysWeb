import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormEvent } from 'react';
import { api } from '../lib/api';
import { 
  TrendingUp, 
  Mail, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  RefreshCw 
} from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import OtpInput from '../components/OtpInput';

interface VerifyEmailProps {
  onGoToLogin: () => void;
  initialEmail?: string;
  initialCode?: string;
}

export default function VerifyEmail({
  onGoToLogin,
  initialEmail = '',
  initialCode = '',
}: VerifyEmailProps) {
  const { t } = useTranslation();

  // Parse URL search params if not provided
  const [email, setEmail] = useState(() => {
    if (initialEmail) return initialEmail;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('email') || '';
    }
    return '';
  });

  const [code, setCode] = useState(() => {
    if (initialCode) return initialCode;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('code') || '';
    }
    return '';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleAutoVerify = useCallback(async (verifyEmailVal: string, verifyCodeVal: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.verifyEmailLink(verifyEmailVal, verifyCodeVal);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || t('verifyEmail.errorTitle'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Auto-verify if both email and 6-digit code are present in URL on mount
  useEffect(() => {
    if (email && code && code.length === 6 && !isSuccess && !error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleAutoVerify(email, code);
    }
  }, [email, code, isSuccess, error, handleAutoVerify]);

  const handleManualVerify = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !code || code.length !== 6) {
      setError(t('common.required'));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.verifyCode(email, code);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || t('verifyEmail.errorTitle'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError(t('common.validation.invalidEmail'));
      return;
    }
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError(null);
    setResendMessage(null);

    try {
      await api.resendVerification(email);
      setResendMessage(t('verifyEmail.codeResent', { email }));
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative w-full">
      <LanguageSelector variant="floating" />
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-primary to-indigo-500 rounded-b-full" />

        {isSuccess ? (
          <div className="text-center py-4 space-y-6">
            <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {t('verifyEmail.successTitle')}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('verifyEmail.successMessage')}
              </p>
            </div>
            <button
              onClick={onGoToLogin}
              className="w-full py-3 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-colors cursor-pointer"
            >
              {t('verifyEmail.proceedToLogin')}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-col items-center mb-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
                {t('verifyEmail.title')}
              </h1>
              <p className="text-sm text-muted-foreground text-center">
                {t('verifyEmail.enterCodePrompt')}
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {resendMessage && (
              <div className="mb-6 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{resendMessage}</span>
              </div>
            )}

            <form onSubmit={handleManualVerify} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="verify-email">
                  {t('verifyEmail.emailLabel')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    id="verify-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isLoading || isResending}
                    placeholder={t('verifyEmail.emailPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3 text-center">
                  {t('verifyEmail.codeLabel')}
                </label>
                <OtpInput
                  length={6}
                  value={code}
                  onChange={setCode}
                  onComplete={completedCode => {
                    if (email) {
                      handleAutoVerify(email, completedCode);
                    }
                  }}
                  disabled={isLoading}
                  hasError={Boolean(error)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6 || !email}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('register.verifying')}</span>
                  </>
                ) : (
                  <span>{t('verifyEmail.verifyButton')}</span>
                )}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0 || !email}
                className="text-xs text-primary hover:underline font-medium cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isResending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span>
                  {resendCooldown > 0
                    ? `${t('verifyEmail.resendCode')} (${resendCooldown}s)`
                    : t('verifyEmail.resendCode')}
                </span>
              </button>

              <button
                type="button"
                onClick={onGoToLogin}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5 mt-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t('verifyEmail.backToLogin')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
