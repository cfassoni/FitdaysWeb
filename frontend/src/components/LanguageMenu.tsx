import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { api, type User } from '../lib/api';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
] as const;

interface LanguageMenuProps {
  user: User | null;
  onUserUpdate?: (user: User) => void;
}

export default function LanguageMenu({ user, onUserUpdate }: LanguageMenuProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentLanguage = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Return focus to button when closed
  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    if (prevIsOpen.current && !isOpen) {
      buttonRef.current?.focus();
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(prev => !prev);

  const handleLanguageChange = async (code: 'en' | 'pt' | 'es') => {
    i18n.changeLanguage(code);
    setIsOpen(false);

    // Save language to localStorage as fallback/persistence
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('fitdays_lang', code);
    }

    // Persist to user profile if logged in
    if (user) {
      try {
        const updatedUser = await api.updateProfile({ preferred_language: code });
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
      } catch (error) {
        console.error('Failed to sync language preference to profile:', error);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    const activeIndex = LANGUAGES.findIndex(lang => document.activeElement === itemRefs.current[LANGUAGES.indexOf(lang)]);

    if (e.key === 'Escape') {
      setIsOpen(false);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      const nextIndex = (activeIndex + 1) % LANGUAGES.length;
      itemRefs.current[nextIndex]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      const prevIndex = (activeIndex - 1 + LANGUAGES.length) % LANGUAGES.length;
      itemRefs.current[prevIndex]?.focus();
      e.preventDefault();
    } else if (e.key === 'Tab') {
      // Loop focus inside languages
      if (e.shiftKey) {
        if (activeIndex === 0) {
          itemRefs.current[LANGUAGES.length - 1]?.focus();
          e.preventDefault();
        }
      } else {
        if (activeIndex === LANGUAGES.length - 1) {
          itemRefs.current[0]?.focus();
          e.preventDefault();
        }
      }
    }
  };

  return (
    <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('toolbar.currentLanguage', { lang: currentLanguage.name })}
        className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
        title={t('toolbar.toggleLanguage', { lang: currentLanguage.name })}
      >
        <Languages className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Flyout Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Languages"
          className="absolute right-0 mt-2 w-40 origin-top-right rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 z-50 focus:outline-hidden"
        >
          {LANGUAGES.map((lang, index) => (
            <button
              key={lang.code}
              ref={el => { itemRefs.current[index] = el; }}
              role="menuitem"
              type="button"
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm rounded-lg transition-colors cursor-pointer focus-visible:outline-hidden ${
                i18n.language === lang.code
                  ? 'text-primary font-semibold bg-primary/5 focus-visible:bg-primary/10'
                  : 'text-foreground hover:bg-muted focus-visible:bg-muted'
              }`}
            >
              <span className="text-base" aria-hidden="true">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
