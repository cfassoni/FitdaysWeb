import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales/en.json';
import ptTranslations from '../locales/pt.json';
import esTranslations from '../locales/es.json';

const COOKIE_NAME = 'fitdays_lang';

// Cookie helper utilities
export function getLanguageCookie(): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${COOKIE_NAME}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export function setLanguageCookie(lang: string, days = 365): void {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_NAME}=${lang};expires=${date.toUTCString()};path=/;SameSite=Strict;Secure`;
}

// Detect client preferred language
export function detectLanguage(): string {
  // 1. Check persistent cookie first
  const cookieLang = getLanguageCookie();
  if (cookieLang && ['en', 'pt', 'es'].includes(cookieLang)) {
    return cookieLang;
  }

  // 2. Check browser navigator language
  const navLang = navigator.language || (navigator.languages && navigator.languages[0]) || '';
  const cleanLang = navLang.toLowerCase();

  if (cleanLang.startsWith('pt')) {
    return 'pt';
  }
  if (cleanLang.startsWith('es')) {
    return 'es';
  }

  // 3. Fallback to English
  return 'en';
}

const resources = {
  en: { translation: enTranslations },
  pt: { translation: ptTranslations },
  es: { translation: esTranslations },
};

const initialLang = detectLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      useSuspense: false,
    },
  });

// Keep cookie synced with language updates
i18n.on('languageChanged', (lng) => {
  setLanguageCookie(lng);
});

// Dynamic Date and Time Formatting Helpers
export function formatDate(date: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  let d: Date;
  if (typeof date === 'string') {
    // Check if it is a simple YYYY-MM-DD date-only string
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(date);
    }
  } else {
    d = date;
  }
  
  if (isNaN(d.getTime())) return '';
  
  // Use active i18n language locale
  return d.toLocaleDateString(i18n.language, options || {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateTime(date: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleString(i18n.language, options || {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default i18n;
