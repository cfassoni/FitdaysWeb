import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
] as const;

interface LanguageSelectorProps {
  variant?: 'floating' | 'sidebar';
  isCollapsed?: boolean;
}

export default function LanguageSelector({ variant = 'sidebar', isCollapsed = false }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (code: 'en' | 'pt' | 'es') => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'floating') {
    return (
      <div className="absolute top-4 right-4 z-50" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/80 border border-border backdrop-blur-md shadow-sm hover:bg-card hover:text-foreground text-muted-foreground transition-all cursor-pointer text-sm font-medium focus:outline-none"
        >
          <span className="text-base">{currentLanguage.flag}</span>
          <span className="uppercase text-xs font-bold tracking-wider">{currentLanguage.code}</span>
          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-36 bg-card border border-border rounded-xl shadow-xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm transition-colors cursor-pointer hover:bg-muted ${
                  i18n.language === lang.code ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Sidebar Layout (Desktop/Mobile)
  return (
    <div className="relative" ref={dropdownRef}>
      {isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none"
          title={`Language: ${currentLanguage.name}`}
        >
          <span className="text-lg">{currentLanguage.flag}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full gap-2 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-sm font-medium focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0">{currentLanguage.flag}</span>
            <span className="text-sm">{currentLanguage.name}</span>
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {isOpen && (
        <div className={`absolute bottom-full mb-2 w-48 bg-card border border-border rounded-xl shadow-xl py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150 z-50 ${isCollapsed ? 'left-0' : 'left-0 right-0'}`}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm transition-colors cursor-pointer hover:bg-muted ${
                i18n.language === lang.code ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
