import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import type { User } from '../lib/api';
import { formatDate } from '../lib/i18n';
import { 
  Mail, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Ruler, 
  Weight, 
  Globe, 
  Upload, 
  Camera, 
  Edit2, 
  Pencil, 
  X, 
  ShieldAlert, 
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Shield
} from 'lucide-react';
import OtpInput from '../components/OtpInput';

interface ProfileProps {
  user: User | null;
  onProfileUpdated: (updatedUser: User) => void;
}

export default function Profile({ user, onProfileUpdated }: ProfileProps) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState(user?.email || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [gender, setGender] = useState<'male' | 'female'>(user?.gender as 'male' | 'female' || 'male');
  
  const [birthDay, setBirthDay] = useState(() => {
    const parts = (user?.birthday || '').split('-');
    return parts[2] || '';
  });
  const [birthMonth, setBirthMonth] = useState(() => {
    const parts = (user?.birthday || '').split('-');
    return parts[1] || '';
  });
  const [birthYear, setBirthYear] = useState(() => {
    const parts = (user?.birthday || '').split('-');
    return parts[0] || '';
  });

  const [heightCm, setHeightCm] = useState(user?.height_cm ? String(user.height_cm) : '');
  const [targetWeightKg, setTargetWeightKg] = useState(user?.target_weight_kg ? String(user.target_weight_kg) : '');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferred_language || 'en');

  // OTP Modal State for pending email verification
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyModalCode, setVerifyModalCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifyModalError, setVerifyModalError] = useState<string | null>(null);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBirthDay(String(maxDays).padStart(2, '0'));
      }
    }
  }, [birthMonth, birthYear, birthDay]);

  const birthday = (birthYear && birthMonth && birthDay) ? `${birthYear}-${birthMonth}-${birthDay}` : '';

  const [isLoading, setIsLoading] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setError(null);
    setIsPhotoLoading(true);

    try {
      const updatedUser = await api.uploadProfilePicture(file);
      onProfileUpdated(updatedUser);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || t('profile.uploadPhotoError'));
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!email || !displayName || !gender || !birthday || !heightCm || !targetWeightKg || !preferredLanguage) {
      setError(t('common.required'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('common.validation.invalidEmail'));
      return;
    }

    const birthDate = new Date(birthday);
    const today = new Date();
    if (isNaN(birthDate.getTime()) || birthDate > today) {
      setError(t('common.validation.birthdayPast'));
      return;
    }

    const h = parseFloat(heightCm);
    const w = parseFloat(targetWeightKg);
    if (isNaN(h) || h < 40 || h > 300) {
      setError(t('common.validation.heightRange'));
      return;
    }

    if (isNaN(w) || w < 10 || w > 500) {
      setError(t('common.validation.weightRange'));
      return;
    }

    const langRegex = /^[a-zA-Z]{2}(-[a-zA-Z]{2,4})?$/;
    if (!langRegex.test(preferredLanguage)) {
      setError(t('common.validation.langFormat'));
      return;
    }

    setIsLoading(true);

    try {
      const updatedUser = await api.updateProfile({
        email,
        display_name: displayName,
        gender,
        birthday,
        height_cm: h,
        target_weight_kg: w,
        preferred_language: preferredLanguage
      });
      
      onProfileUpdated(updatedUser);
      setIsEditingEmail(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || t('profile.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendPendingCode = async () => {
    if (!user?.pending_email || resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    setResendMessage(null);

    try {
      await api.resendVerification(user.pending_email);
      setResendMessage(t('profile.codeSent', { email: user.pending_email }));
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsResending(false);
    }
  };

  const handleCancelPendingEmail = async () => {
    setError(null);
    try {
      await api.cancelEmailChange();
      const me = await api.getMe();
      onProfileUpdated(me);
      setEmail(me.email);
      setIsEditingEmail(false);
      setShowVerifyModal(false);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    }
  };

  const handleVerifyPendingEmailCode = async (codeToVerify?: string) => {
    const code = codeToVerify || verifyModalCode;
    if (!code || code.length !== 6 || !user?.pending_email) return;

    setIsVerifyingCode(true);
    setVerifyModalError(null);

    try {
      await api.verifyCode(user.pending_email, code);
      const me = await api.getMe();
      onProfileUpdated(me);
      setEmail(me.email);
      setShowVerifyModal(false);
      setVerifyModalCode('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setVerifyModalError(err.message || t('verifyEmail.errorTitle'));
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Data Deletion Modal state
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [deleteDataPassword, setDeleteDataPassword] = useState('');
  const [showDeleteDataPassword, setShowDeleteDataPassword] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [deleteDataError, setDeleteDataError] = useState<string | null>(null);
  const [deleteDataSuccess, setDeleteDataSuccess] = useState<string | null>(null);

  // Account Deletion Modal state
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [showDeleteAccountPassword, setShowDeleteAccountPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  const handleDeleteUserData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteDataPassword) return;
    setIsDeletingData(true);
    setDeleteDataError(null);
    try {
      await api.deleteUserData(deleteDataPassword);
      setShowDeleteDataModal(false);
      setDeleteDataPassword('');
      setDeleteDataSuccess(t('profile.dataManagement.dataDeleteSuccess'));
      setTimeout(() => setDeleteDataSuccess(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('profile.dataManagement.genericError');
      if (msg.toLowerCase().includes('password')) {
        setDeleteDataError(t('profile.dataManagement.invalidPassword'));
      } else {
        setDeleteDataError(msg);
      }
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteAccountPassword) return;
    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      await api.deleteAccount(deleteAccountPassword);
      setShowDeleteAccountModal(false);
      setDeleteAccountPassword('');
      window.dispatchEvent(new CustomEvent('auth-session-expired'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('profile.dataManagement.genericError');
      if (msg.toLowerCase().includes('password')) {
        setDeleteAccountError(t('profile.dataManagement.invalidPassword'));
      } else {
        setDeleteAccountError(msg);
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('profile.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('profile.subtitle')}</p>
        </div>

        {/* Pending Email Alert Banner */}
        {user?.pending_email && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5 text-amber-700 dark:text-amber-400 text-sm font-medium">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{t('profile.pendingEmailNotice', { email: user.pending_email })}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setVerifyModalError(null);
                  setShowVerifyModal(true);
                }}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {t('profile.enterVerificationCode')}
              </button>
              <button
                type="button"
                onClick={handleResendPendingCode}
                disabled={isResending || resendCooldown > 0}
                className="px-3 py-1.5 bg-background border border-border text-foreground text-xs font-medium rounded-lg hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                {isResending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                <span>
                  {resendCooldown > 0
                    ? `${t('profile.resendVerificationCode')} (${resendCooldown}s)`
                    : t('profile.resendVerificationCode')}
                </span>
              </button>
              <button
                type="button"
                onClick={handleCancelPendingEmail}
                className="px-3 py-1.5 bg-destructive/10 border border-destructive/25 text-destructive text-xs font-medium rounded-lg hover:bg-destructive/20 transition-colors cursor-pointer"
              >
                {t('profile.cancelEmailChange')}
              </button>
            </div>
          </div>
        )}

        {resendMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm animate-in fade-in duration-200">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{resendMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-sm animate-in fade-in duration-200">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm animate-in fade-in duration-200">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{t('profile.successMsg')}</span>
          </div>
        )}

        {/* Profile Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Avatar Edit Panel */}
          <div className="lg:col-span-1 bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xs">
            <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
              <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-primary/20 bg-muted flex items-center justify-center relative">
                {isPhotoLoading ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : user?.profile_image_url ? (
                  <img src={user.profile_image_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-primary">
                    {user?.display_name ? user.display_name.slice(0, 2).toUpperCase() : user?.email.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-lg font-bold text-foreground">{user?.display_name || user?.email}</h2>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{user?.email}</p>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isPhotoLoading}
              className="px-4 py-2 rounded-lg border border-input bg-background hover:bg-muted text-sm font-medium text-foreground transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isPhotoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>{t('profile.avatarPanel.changePhoto')}</span>
            </button>
          </div>

          {/* Form Panel */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-xs">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Account details */}
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 border-b border-border pb-1.5">
                  {t('profile.sections.credentials')}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="email">
                      {t('profile.fields.email')}
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        readOnly={!isEditingEmail}
                        onChange={e => setEmail(e.target.value)}
                        disabled={isLoading}
                        className={`w-full pl-9 pr-10 py-2 rounded-lg border text-sm transition-all ${
                          isEditingEmail
                            ? 'border-primary bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                            : 'border-input bg-muted/50 text-foreground cursor-default'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditingEmail) {
                            setEmail(user?.email || '');
                            setIsEditingEmail(false);
                          } else {
                            setIsEditingEmail(true);
                          }
                        }}
                        title={isEditingEmail ? t('common.cancel') : t('profile.editEmail')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        {isEditingEmail ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal details */}
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 border-b border-border pb-1.5">
                  {t('profile.sections.personal')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="displayName">
                      {t('profile.fields.displayName')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                        <Edit2 className="h-4 w-4" />
                      </span>
                      <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        disabled={isLoading}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="birthDay">
                      {t('profile.fields.birthday')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        id="birthDay"
                        value={birthDay}
                        onChange={e => setBirthDay(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 cursor-pointer"
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
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 cursor-pointer"
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
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 cursor-pointer"
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
                      <p className="text-xs text-muted-foreground mt-1.5 pl-1">
                        {t('profile.fields.birthday')}: <span className="font-medium text-foreground">{formatDate(birthday)}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {t('profile.fields.gender')}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        disabled={isLoading}
                        className={`py-2 rounded-lg border font-medium text-sm transition-all cursor-pointer ${
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
                        className={`py-2 rounded-lg border font-medium text-sm transition-all cursor-pointer ${
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
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="preferredLanguage">
                      {t('profile.fields.language')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                        <Globe className="h-4 w-4" />
                      </span>
                      <select
                        id="preferredLanguage"
                        value={preferredLanguage}
                        onChange={e => setPreferredLanguage(e.target.value)}
                        disabled={isLoading}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 appearance-none cursor-pointer"
                      >
                        <option value="en">🇺🇸 English</option>
                        <option value="pt">🇧🇷 Português</option>
                        <option value="es">🇪🇸 Español</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical specifications */}
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 border-b border-border pb-1.5">
                  {t('profile.sections.physical')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="heightCm">
                      {t('profile.fields.height')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                        <Ruler className="h-4 w-4" />
                      </span>
                      <input
                        id="heightCm"
                        type="number"
                        step="0.1"
                        value={heightCm}
                        onChange={e => setHeightCm(e.target.value)}
                        disabled={isLoading}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="targetWeightKg">
                      {t('profile.fields.weight')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                        <Weight className="h-4 w-4" />
                      </span>
                      <input
                        id="targetWeightKg"
                        type="number"
                        step="0.1"
                        value={targetWeightKg}
                        onChange={e => setTargetWeightKg(e.target.value)}
                        disabled={isLoading}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('common.saving')}</span>
                    </>
                  ) : (
                    <span>{t('common.save')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Data Management & Privacy Section (GDPR / LGPD Compliance) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{t('profile.dataManagement.title')}</h2>
              <p className="text-xs text-muted-foreground">{t('profile.dataManagement.subtitle')}</p>
            </div>
          </div>

          {deleteDataSuccess && (
            <div className="mb-6 flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs animate-in fade-in duration-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{deleteDataSuccess}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Option A: Delete Health Data */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-background/50 hover:bg-muted/20 transition-colors">
              <div className="space-y-1 max-w-xl">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-amber-500" />
                  {t('profile.dataManagement.deleteDataTitle')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('profile.dataManagement.deleteDataDesc')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteDataPassword('');
                  setDeleteDataError(null);
                  setShowDeleteDataModal(true);
                }}
                className="px-4 py-2 rounded-lg border border-amber-500/40 hover:border-amber-500 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-xs self-start sm:self-center"
              >
                {t('profile.dataManagement.deleteDataBtn')}
              </button>
            </div>

            {/* Option B: Delete Account */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/25 bg-destructive/5 hover:bg-destructive/10 transition-colors">
              <div className="space-y-1 max-w-xl">
                <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {t('profile.dataManagement.deleteAccountTitle')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('profile.dataManagement.deleteAccountDesc')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteAccountPassword('');
                  setDeleteAccountError(null);
                  setShowDeleteAccountModal(true);
                }}
                className="px-4 py-2 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-xs self-start sm:self-center"
              >
                {t('profile.dataManagement.deleteAccountBtn')}
              </button>
            </div>
          </div>
        </div>

        {/* Modal for Option A: Delete User Data */}
        {showDeleteDataModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setShowDeleteDataModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-5">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {t('profile.dataManagement.deleteDataModalTitle')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('profile.dataManagement.deleteDataModalDesc')}
                </p>
              </div>

              <div className="mb-4 p-3 bg-muted/50 border border-border rounded-lg text-xs text-muted-foreground">
                ℹ️ {t('profile.dataManagement.deleteDataKeepNote')}
              </div>

              {deleteDataError && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{deleteDataError}</span>
                </div>
              )}

              <form onSubmit={handleDeleteUserData} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t('profile.dataManagement.passwordPrompt')}
                  </label>
                  <div className="relative">
                    <input
                      type={showDeleteDataPassword ? 'text' : 'password'}
                      value={deleteDataPassword}
                      onChange={e => setDeleteDataPassword(e.target.value)}
                      placeholder={t('profile.dataManagement.passwordPlaceholder')}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground pr-10 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeleteDataPassword(!showDeleteDataPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                    >
                      {showDeleteDataPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteDataModal(false)}
                    className="flex-1 py-2.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground text-sm font-medium cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isDeletingData || !deleteDataPassword}
                    className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDeletingData ? <Loader2 className="h-4 w-4 animate-spin" /> : t('profile.dataManagement.confirmDeleteDataBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Option B: Delete Account */}
        {showDeleteAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-card border border-destructive/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-5">
                <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-destructive mb-1">
                  {t('profile.dataManagement.deleteAccountModalTitle')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('profile.dataManagement.deleteAccountModalDesc')}
                </p>
              </div>

              {deleteAccountError && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{deleteAccountError}</span>
                </div>
              )}

              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t('profile.dataManagement.passwordPrompt')}
                  </label>
                  <div className="relative">
                    <input
                      type={showDeleteAccountPassword ? 'text' : 'password'}
                      value={deleteAccountPassword}
                      onChange={e => setDeleteAccountPassword(e.target.value)}
                      placeholder={t('profile.dataManagement.passwordPlaceholder')}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground pr-10 focus:outline-hidden focus:ring-2 focus:ring-destructive"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeleteAccountPassword(!showDeleteAccountPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                    >
                      {showDeleteAccountPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteAccountModal(false)}
                    className="flex-1 py-2.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground text-sm font-medium cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isDeletingAccount || !deleteAccountPassword}
                    className="flex-1 py-2.5 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDeletingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : t('profile.dataManagement.confirmDeleteAccountBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Verifying Pending Email */}
        {showVerifyModal && user?.pending_email && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">
                  {t('profile.verifyModalTitle')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('profile.verifyModalSubtitle', { email: user.pending_email })}
                </p>
              </div>

              {verifyModalError && (
                <div className="mb-6 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-lg text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{verifyModalError}</span>
                </div>
              )}

              <div className="space-y-6">
                <OtpInput
                  length={6}
                  value={verifyModalCode}
                  onChange={setVerifyModalCode}
                  onComplete={completedCode => {
                    handleVerifyPendingEmailCode(completedCode);
                  }}
                  disabled={isVerifyingCode}
                  hasError={Boolean(verifyModalError)}
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    className="flex-1 py-2.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground text-sm font-medium cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyPendingEmailCode()}
                    disabled={isVerifyingCode || verifyModalCode.length !== 6}
                    className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isVerifyingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : t('verifyEmail.verifyButton')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
