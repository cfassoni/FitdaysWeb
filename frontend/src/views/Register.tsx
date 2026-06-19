import { useState, useEffect } from 'react';
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
  Calendar,
  Ruler,
  Weight,
  Globe,
  Upload,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff
} from 'lucide-react';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onGoToLogin: () => void;
}

export default function Register({ onRegisterSuccess, onGoToLogin }: RegisterProps) {
  // Step tracking
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Step 1: Account Credentials
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Personal Details
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthday, setBirthday] = useState('');

  // Step 3: Physical & Extra
  const [heightCm, setHeightCm] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Detect language on mount
  useEffect(() => {
    const browserLang = navigator.language || 'en';
    // Format to lowercase/ISO standard matching validator, e.g. 'en-US' or 'en'
    setPreferredLanguage(browserLang);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      setError('Profile picture must be less than 4MB');
      return;
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    setProfilePic(file);
    setError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = (): boolean => {
    setError(null);
    if (!login || !email || !password) {
      setError('Please fill in all fields');
      return false;
    }
    const loginRegex = /^[a-z][a-z0-9]*$/;
    if (!loginRegex.test(login)) {
      setError('Username must start with a lowercase letter and contain only lowercase letters and numbers (no spaces or uppercase)');
      return false;
    }
    if (login.length < 3 || login.length > 50) {
      setError('Username must be between 3 and 50 characters');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    setError(null);
    if (!displayName || !gender || !birthday) {
      setError('Please fill in all personal details');
      return false;
    }
    if (displayName.trim().length < 1) {
      setError('Please enter a display name');
      return false;
    }
    const birthDate = new Date(birthday);
    const today = new Date();
    if (isNaN(birthDate.getTime())) {
      setError('Please enter a valid birthday');
      return false;
    }
    if (birthDate > today) {
      setError('Birthday cannot be in the future');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    setError(null);
    if (!heightCm || !targetWeightKg || !preferredLanguage) {
      setError('Please fill in physical details');
      return false;
    }
    const h = parseFloat(heightCm);
    const w = parseFloat(targetWeightKg);
    if (isNaN(h) || h < 40 || h > 300) {
      setError('Height must be a number between 40 and 300 cm');
      return false;
    }
    if (isNaN(w) || w < 10 || w > 500) {
      setError('Target weight must be a number between 10 and 500 kg');
      return false;
    }
    const langRegex = /^[a-zA-Z]{2}(-[a-zA-Z]{2,4})?$/;
    if (!langRegex.test(preferredLanguage)) {
      setError('Preferred language must be in ISO format (e.g. en, pt-br)');
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
      // 1. Register User
      await api.register(
        login,
        email,
        password,
        displayName,
        gender,
        birthday,
        parseFloat(heightCm),
        parseFloat(targetWeightKg),
        preferredLanguage
      );

      setSuccess(true);
      
      // 2. Auto-login
      try {
        await api.login(login, password);

        // 3. Upload profile picture if provided
        if (profilePic) {
          await api.uploadProfilePicture(profilePic);
        }

        setTimeout(() => {
          onRegisterSuccess();
        }, 1200);
      } catch (loginErr) {
        setError('Account created, but automatic sign in failed. Please log in manually.');
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
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl relative overflow-hidden transition-all">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-primary to-indigo-500 rounded-b-full" />

        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <TrendingUp className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Create your profile</h1>
          <p className="text-sm text-muted-foreground">Step {step} of 3 • {step === 1 ? 'Credentials' : step === 2 ? 'Personal Details' : 'Physical Setup'}</p>
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

        {success && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 animate-bounce" />
            <span>Account created successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* STEP 1: Account Credentials */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="login">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <UserIcon className="h-5 w-5" />
                  </span>
                  <input
                    id="login"
                    type="text"
                    autoComplete="username"
                    value={login}
                    onChange={e => setLogin(e.target.value.toLowerCase())}
                    disabled={isLoading || success}
                    placeholder="e.g. alice, bob2 (lowercase only)"
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
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isLoading || success}
                    placeholder="Min. 6 characters"
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
                  Full Name / Display Name
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
                    disabled={isLoading || success}
                    placeholder="How should we address you?"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    disabled={isLoading || success}
                    className={`py-3 rounded-lg border font-medium text-sm transition-all cursor-pointer ${
                      gender === 'male'
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-input bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    disabled={isLoading || success}
                    className={`py-3 rounded-lg border font-medium text-sm transition-all cursor-pointer ${
                      gender === 'female'
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-input bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="birthday">
                  Birthday
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                  </span>
                  <input
                    id="birthday"
                    type="date"
                    value={birthday}
                    onChange={e => setBirthday(e.target.value)}
                    disabled={isLoading || success}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Physical & Photo */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="heightCm">
                    Height (cm)
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
                      disabled={isLoading || success}
                      placeholder="e.g. 175"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="targetWeightKg">
                    Goal Weight (kg)
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
                      disabled={isLoading || success}
                      placeholder="e.g. 70"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="preferredLanguage">
                  Preferred Language
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                    <Globe className="h-5 w-5" />
                  </span>
                  <input
                    id="preferredLanguage"
                    type="text"
                    value={preferredLanguage}
                    onChange={e => setPreferredLanguage(e.target.value)}
                    disabled={isLoading || success}
                    placeholder="en, pt-br, es"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Profile Picture (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full border border-dashed border-border flex items-center justify-center overflow-hidden shrink-0 bg-muted">
                    {profilePicPreview ? (
                      <img src={profilePicPreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 rounded-lg border border-input bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer">
                      Select Image
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      disabled={isLoading || success}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-1">JPEG, PNG or WebP up to 4MB</p>
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
                disabled={isLoading || success}
                className="flex-1 py-2.5 rounded-lg border border-input bg-background text-foreground hover:bg-muted font-medium text-sm transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading || success}
                className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 ml-auto"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || success}
                className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ml-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>Submit Profile</span>
                )}
              </button>
            )}
          </div>

        </form>

        <div className="mt-6 text-center">
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
