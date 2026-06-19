import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import type { User } from '../lib/api';
import { formatDate } from '../lib/i18n';
import { 
  User as UserIcon, 
  Mail, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Ruler,
  Weight,
  Globe,
  Upload,
  Camera,
  Edit2
} from 'lucide-react';

interface ProfileProps {
  user: User | null;
  onProfileUpdated: (updatedUser: User) => void;
}

export default function Profile({ user, onProfileUpdated }: ProfileProps) {
  const { t, i18n } = useTranslation();
  const [login, setLogin] = useState(user?.login || '');
  const [email, setEmail] = useState(user?.email || '');
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
      setError('Profile picture must be less than 4MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
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
      setError(err.message || 'Failed to upload profile picture');
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!login || !email || !displayName || !gender || !birthday || !heightCm || !targetWeightKg || !preferredLanguage) {
      setError(t('common.required'));
      return;
    }

    const loginRegex = /^[a-z][a-z0-9]*$/;
    if (!loginRegex.test(login)) {
      setError(t('common.validation.usernameFormat'));
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
        login,
        email,
        display_name: displayName,
        gender,
        birthday,
        height_cm: h,
        target_weight_kg: w,
        preferred_language: preferredLanguage
      });
      
      onProfileUpdated(updatedUser);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile settings');
    } finally {
      setIsLoading(false);
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
                    {user?.display_name ? user.display_name.slice(0, 2).toUpperCase() : (user?.login ? user.login.slice(0, 2).toUpperCase() : 'US')}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-lg font-bold text-foreground">{user?.display_name || user?.login}</h2>
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
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 border-b border-border pb-1.5">{t('profile.sections.credentials')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="login">
                      {t('profile.fields.username')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                        <UserIcon className="h-4 w-4" />
                      </span>
                      <input
                        id="login"
                        type="text"
                        value={login}
                        onChange={e => setLogin(e.target.value.toLowerCase())}
                        disabled={isLoading}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="email">
                      {t('profile.fields.email')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal details */}
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 border-b border-border pb-1.5">{t('profile.sections.personal')}</h3>
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
                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="birthday">
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
                      <p className="text-xs text-muted-foreground mt-1.5 pl-1 animate-in fade-in duration-200">
                        {t('profile.fields.birthday')}: <span className="font-medium text-foreground">{formatDate(birthday)}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {t('profile.fields.gender')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGender('male')}
                        className={`py-2 rounded-lg border font-medium text-sm transition-all cursor-pointer ${
                          gender === 'male'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input bg-background text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {t('common.male')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('female')}
                        className={`py-2 rounded-lg border font-medium text-sm transition-all cursor-pointer ${
                          gender === 'female'
                            ? 'border-primary bg-primary/10 text-primary'
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
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 border-b border-border pb-1.5">{t('profile.sections.physical')}</h3>
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
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
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

      </div>
    </div>
  );
}
