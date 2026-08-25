import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormEvent } from 'react';
import { api } from '../lib/api';
import { 
  TrendingUp, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import OtpInput from '../components/OtpInput';

interface ResetPasswordProps {
  onResetSuccess: () => void;
  onGoToLogin: () => void;
  onGoToForgotPassword?: () => void;
  initialToken?: string;
  initialEmail?: string;
  initialCode?: string;
}

export default function ResetPassword({
  onResetSuccess,
  onGoToLogin,
  onGoToForgotPassword,
  initialToken = '',
  initialEmail = '',
  initialCode = '',
}: ResetPasswordProps) {
  const { t } = useTranslation();

  // Parse URL search params
  const [token] = useState(() => {
    if (initialToken) return initialToken;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });

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

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If a direct magic token is present in URL, validate it on mount
  const [isValidatingToken, setIsValidatingToken] = useState(Boolean(token));
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const checkToken = async () => {
      try {
        const res = await api.validateResetToken(token, initialEmail || undefined);
        if (isMounted) {
          if (!res.valid) {
            setIsTokenInvalid(true);
            setError(t('resetPassword.invalidToken'));
          } else if (res.email) {
            setEmail(res.email);
          }
        }
      } catch {
        if (isMounted) {
          setIsTokenInvalid(true);
          setError(t('resetPassword.invalidToken'));
        }
      } finally {
        if (isMounted) {
          setIsValidatingToken(false);
        }
      }
    };

    checkToken();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!token && (!email || !code)) {
      setError(t('common.required'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('resetPassword.passwordLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const tokenOrCode = token || code;
      await api.resetPassword({
        tokenOrCode,
        email: email || undefined,
        newPassword,
      });

      // Successful reset auto-logs the user in
      onResetSuccess();
    } catch (err: any) {
      setError(err.message || t('common.error'));
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

        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <TrendingUp className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
            {t('resetPassword.title')}
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            {t('resetPassword.subtitle')}
          </p>
        </div>

        {isValidatingToken ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : isTokenInvalid ? (
          <div className="text-center py-4 space-y-4">
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-sm text-left">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error || t('resetPassword.invalidToken')}</span>
            </div>
            <div className="pt-2 space-y-2">
              {onGoToForgotPassword && (
                <button
                  type="button"
                  onClick={onGoToForgotPassword}
                  className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-colors cursor-pointer"
                >
                  {t('resetPassword.requestNewLink')}
                </button>
              )}
              <button
                type="button"
                onClick={onGoToLogin}
                className="w-full py-2.5 rounded-lg border border-border text-foreground hover:bg-muted text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t('resetPassword.backToLogin')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {error && (
              <div className="mb-6 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Show email and code fields only if no direct magic token was provided */}
              {!token && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="reset-email">
                      {t('resetPassword.emailLabel')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                        <Mail className="h-5 w-5" />
                      </span>
                      <input
                        id="reset-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={isLoading}
                        placeholder={t('resetPassword.emailPlaceholder')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 text-center">
                      {t('resetPassword.codeLabel')}
                    </label>
                    <OtpInput
                      length={6}
                      value={code}
                      onChange={setCode}
                      disabled={isLoading}
                      hasError={Boolean(error)}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="new-password">
                  {t('resetPassword.newPasswordLabel')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder={t('resetPassword.newPasswordPlaceholder')}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="confirm-password">
                  {t('resetPassword.confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || (!token && code.length !== 6) || !newPassword || !confirmPassword}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('resetPassword.resetting')}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>{t('resetPassword.resetButton')}</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onGoToLogin}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t('resetPassword.backToLogin')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
