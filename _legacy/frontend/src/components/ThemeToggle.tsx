import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon } from 'lucide-react';
import IconButton from './IconButton';

interface ThemeToggleProps {
  variant?: 'icon' | 'full';
}

export default function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof localStorage === 'undefined') return 'light';
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    // Fallback to system preference
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const { t } = useTranslation();
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  const titleText = theme === 'light' ? t('toolbar.switchToDark') : t('toolbar.switchToLight');

  if (variant === 'icon') {
    return (
      <IconButton
        onClick={toggleTheme}
        title={titleText}
        aria-label={titleText}
      >
        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </IconButton>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
      title={titleText}
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-5 w-5" />
          <span className="text-sm font-medium">{t('toolbar.switchToDark')}</span>
        </>
      ) : (
        <>
          <Sun className="h-5 w-5" />
          <span className="text-sm font-medium">{t('toolbar.switchToLight')}</span>
        </>
      )}
    </button>
  );
}
