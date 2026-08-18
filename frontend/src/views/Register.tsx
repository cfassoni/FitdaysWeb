import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormEvent } from 'react';
import { api } from '../lib/api';
import { 
  TrendingUp, 
  Lock, 
  User as UserIcon, 
  Mail, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Ruler,
  Weight,
  Globe,
  Upload,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import { detectLanguage, formatDate } from '../lib/i18n';
import OtpInput from '../components/OtpInput';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onGoToLogin: () => void;
}

export default function Register({ onRegisterSuccess, onGoToLogin }: RegisterProps) {
  const { t, i18n } = useTranslation();
  // Step tracking: 1, 2, 3 or verification
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  
  // Step 1: Account Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Personal Details
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');

  const getDaysInMonth = (monthStr: string, yearStr: string) => {
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    if (!month) return 31;
    if (month === 2) {
      if (year && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
        return 29;
      }
      return 28;
    }
    if ([4, 6, 9, 11].includes(month)) {
      return 30;
    }
    return 31;
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

  const months = Array.from({ length: 12 }, (_, i) => {
    const value = String(i + 1).padStart(2, '0');
    const date = new Date(2026, i, 1);
    const label = new Intl.DateTimeFormat(i18n.language || 'en', { month: 'long' }).format(date);
    const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
    return { value, label: capitalizedLabel };
  });

  const daysCount = getDaysInMonth(birthMonth, birthYear);
  const days = Array.from({ length: daysCount }, (_, i) => String(i + 1).padStart(2, '0'));

  useEffect(() => {
    if (birthDay && birthMonth) {
      const maxDays = getDaysInMonth(birthMonth, birthYear);
      if (parseInt(birthDay, 10) > maxDays) {
        setBirthDay(String(maxDays).padStart(2, '0'));
      }
    }
  }, [birthMonth, birthYear, birthDay]);

  const birthday = (birthYear && birthMonth && birthDay) ? `${birthYear}-${birthMonth}-${birthDay}` : '';

  // Step 3: Physical & Extra
  const [heightCm, setHeightCm] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState(() => detectLanguage());

  useEffect(() => {
    if (i18n.language) {
      setPreferredLanguage(i18n.language);
    }
  }, [i18n.language]);

  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setError(t('profile.avatarPanel.photoErrorSize'));
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(t('profile.avatarPanel.photoErrorType'));
      return;
    }

    setProfilePic(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = (): boolean => {
    setError(null);
    if (!email || !password) {
      setError(t('common.required'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('common.validation.invalidEmail'));
      return false;
    }
    if (password.length < 6) {
      setError(t('common.validation.passwordLength'));
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    setError(null);
    if (!displayName || !gender || !birthday) {
      setError(t('common.required'));
      return false;
    }
    if (displayName.trim().length < 1) {
      setError(t('common.required'));
      return false;
    }
    const birthDate = new Date(birthday);
    const today = new Date();
    if (isNaN(birthDate.getTime())) {
      setError(t('common.required'));
      return false;
    }
    if (birthDate > today) {
      setError(t('common.validation.birthdayPast'));
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    setError(null);
    if (!heightCm || !targetWeightKg || !preferredLanguage) {
      setError(t('common.required'));
      return false;
    }
    const h = parseFloat(heightCm);
    const w = parseFloat(targetWeightKg);
    if (isNaN(h) || h < 40 || h > 300) {
      setError(t('common.validation.heightRange'));
      return false;
    }
    if (isNaN(w) || w < 10 || w > 500) {
      setError(t('common.validation.weightRange'));
      return false;
    }
    const langRegex = /^[a-zA-Z]{2}(-[a-zA-Z]{2,4})?$/;
    if (!langRegex.test(preferredLanguage)) {
      setError(t('common.validation.langFormat'));
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handlePrev = () => {
    setError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    setError(null);
    setIsLoading(true);

    try {
      // 1. Register User (creates user with email_confirmed=False and dispatches 6-digit code)
      await api.register(
        email,
        password,
        displayName,
        gender,
        birthday,
        parseFloat(heightCm),
        parseFloat(targetWeightKg),
        preferredLanguage
      );

      // Switch to Verification step
      setIsVerifying(true);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || t('register.errorRegisterFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || verificationCode;
    if (!code || code.length !== 6) {
      setError(t('common.required'));
      return;
    }

    setError(null);
    setResendSuccess(null);
    setIsLoading(true);

    try {
      // 1. Verify Code
      await api.verifyCode(email, code);
      setSuccess(true);

      // 2. Auto-login with verified email
      try {
        await api.login(email, password);

        // 3. Upload profile picture if provided
        if (profilePic) {
          await api.uploadProfilePicture(profilePic);
        }

        setTimeout(() => {
          onRegisterSuccess();
        }, 1000);
      } catch {
        setError(t('register.errorSignInFailed'));
        setSuccess(false);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || t('verifyEmail.errorTitle'));
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError(null);
    setResendSuccess(null);

    try {
      await api.resendVerification(email);
      setResendSuccess(t('register.codeResent'));
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsResending(false);
    }
  };

  const getStepTitle = () => {
    if (step === 1) return t('register.step1Title');
    if (step === 2) return t('register.step2Title');
    return t('register.step3Title');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative w-full">
      <LanguageSelector variant="floating" />
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl relative overflow-hidden transition-all">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-primary to-indigo-500 rounded-b-full" />

        {isVerifying ? (
          <div>
            <div className="flex flex-col items-center mb-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Mail className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
                {t('register.verificationTitle')}
              </h1>
              <p className="text-sm text-muted-foreground text-center">
                {t('register.verificationSubtitle', { email })}
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {resendSuccess && (
              <div className="mb-6 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 animate-bounce" />
                <span>{t('register.verificationSuccess')}</span>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3 text-center">
                  {t('register.enterCode')}
                </label>
                <OtpInput
                  length={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                  onComplete={completedCode => {
                    handleVerifyCode(completedCode);
                  }}
                  disabled={isLoading || success}
                  hasError={Boolean(error)}
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerifyCode()}
                disabled={isLoading || verificationCode.length !== 6 || success}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('register.verifying')}</span>
                  </>
                ) : (
                  <span>{t('register.verifyAndSignIn')}</span>
                )}
              </button>

              <div className="flex flex-col items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0 || success}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isResending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {resendCooldown > 0
                      ? `${t('register.resendCode')} (${resendCooldown}s)`
                      : t('register.resendCode')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsVerifying(false);
                    setError(null);
                  }}
                  disabled={isLoading || success}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1 mt-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>{t('register.changeEmail')}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col items-center mb-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">{t('register.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('register.progressText', { step, title: getStepTitle() })}</p>
            </div>

            {/* Step Progress Bar */}
            <div className="w-full bg-muted h-1 rounded-full mb-8 flex overflow-hidden">
              <div className={`bg-primary h-full transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* STEP 1: Account Credentials */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="email">
                      {t('register.emailLabel')}
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
                        disabled={isLoading}
                        placeholder={t('register.emailPlaceholder')}
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
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={isLoading}
                        placeholder={t('register.passwordPlaceholder')}
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Personal Details */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="displayName">
                      {t('register.displayNameLabel')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                        <UserIcon className="h-5 w-5" />
                      </span>
                      <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        disabled={isLoading}
                        placeholder={t('register.displayNamePlaceholder')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {t('register.genderLabel')}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        disabled={isLoading}
                        className={`py-3 rounded-lg border font-medium text-sm transition-all cursor-pointer ${
                          gender === 'male'
                            ? 'border-primary bg-primary/10 text-primary shadow-xs'
                            : 'border-input bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {t('common.male')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        disabled={isLoading}
                        className={`py-3 rounded-lg border font-medium text-sm transition-all cursor-pointer ${
                          gender === 'female'
                            ? 'border-primary bg-primary/10 text-primary shadow-xs'
                            : 'border-input bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {t('common.female')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="birthDay">
                      {t('register.birthdayLabel')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        id="birthDay"
                        value={birthDay}
                        onChange={e => setBirthDay(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">{t('common.day')}</option>
                        {days.map(d => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>

                      <select
                        id="birthMonth"
                        value={birthMonth}
                        onChange={e => setBirthMonth(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">{t('common.month')}</option>
                        {months.map(m => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>

                      <select
                        id="birthYear"
                        value={birthYear}
                        onChange={e => setBirthYear(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">{t('common.year')}</option>
                        {years.map(y => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    {birthday && (
                      <p className="text-xs text-muted-foreground mt-1.5 pl-1 animate-in fade-in duration-200">
                        {t('register.birthdayLabel')}: <span className="font-medium text-foreground">{formatDate(birthday)}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: Physical & Photo */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="heightCm">
                        {t('register.heightLabel')}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                          <Ruler className="h-5 w-5" />
                        </span>
                        <input
                          id="heightCm"
                          type="number"
                          step="0.1"
                          value={heightCm}
                          onChange={e => setHeightCm(e.target.value)}
                          disabled={isLoading}
                          placeholder={t('register.heightPlaceholder')}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="targetWeightKg">
                        {t('register.weightLabel')}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                          <Weight className="h-5 w-5" />
                        </span>
                        <input
                          id="targetWeightKg"
                          type="number"
                          step="0.1"
                          value={targetWeightKg}
                          onChange={e => setTargetWeightKg(e.target.value)}
                          disabled={isLoading}
                          placeholder={t('register.weightPlaceholder')}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="preferredLanguage">
                      {t('register.langLabel')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                        <Globe className="h-5 w-5" />
                      </span>
                      <select
                        id="preferredLanguage"
                        value={preferredLanguage}
                        onChange={e => setPreferredLanguage(e.target.value)}
                        disabled={isLoading}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 appearance-none cursor-pointer"
                      >
                        <option value="en">🇺🇸 English</option>
                        <option value="pt">🇧🇷 Português</option>
                        <option value="es">🇪🇸 Español</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {t('register.profilePicLabel')}
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full border border-dashed border-border flex items-center justify-center overflow-hidden shrink-0 bg-muted">
                        {profilePicPreview ? (
                          <img src={profilePicPreview} alt={t('register.photoPreviewAlt')} className="h-full w-full object-cover" />
                        ) : (
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <label className="flex-1 cursor-pointer">
                        <span className="inline-flex items-center px-4 py-2 rounded-lg border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer">
                          {t('register.selectImage')}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          disabled={isLoading}
                          className="hidden"
                        />
                        <p className="text-xs text-muted-foreground mt-1">{t('register.profilePicPlaceholder')}</p>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex gap-4 pt-4 border-t border-border mt-6">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-lg border border-input bg-background text-foreground hover:bg-muted font-medium text-sm transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{t('common.back')}</span>
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 ml-auto"
                  >
                    <span>{t('common.continue')}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ml-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{t('register.registering')}</span>
                      </>
                    ) : (
                      <span>{t('common.submit')}</span>
                    )}
                  </button>
                )}
              </div>

            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('register.haveAccount')}{' '}
                <button
                  onClick={onGoToLogin}
                  disabled={isLoading}
                  className="font-medium text-primary hover:underline hover:text-primary/90 cursor-pointer disabled:opacity-50"
                >
                  {t('register.signInLink')}
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
