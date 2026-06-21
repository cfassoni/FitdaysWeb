import { Menu, Bug } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';
import IconButton from './IconButton';
import ThemeToggle from './ThemeToggle';
import LanguageMenu from './LanguageMenu';
import UserMenu from './UserMenu';
import type { User } from '../lib/api';

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

interface TopToolbarProps {
  user: User | null;
  onLogout: () => void;
  onEditProfile: () => void;
  onUserUpdate?: (user: User) => void;
  onMobileMenuToggle: () => void;
}

export default function TopToolbar({
  user,
  onLogout,
  onEditProfile,
  onUserUpdate,
  onMobileMenuToggle,
}: TopToolbarProps) {
  const { t } = useTranslation();
  const GITHUB_REPO = 'https://github.com/cfassoni/FitdaysWeb';
  const GITHUB_ISSUES = 'https://github.com/cfassoni/FitdaysWeb/issues';

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 md:px-6 sticky top-0 z-40">
      {/* Left Area: Mobile menu toggle + Logo */}
      <div className="flex items-center gap-3">
        <IconButton
          onClick={onMobileMenuToggle}
          title={t('toolbar.toggleMenu')}
          aria-label={t('toolbar.toggleMenu')}
          className="flex md:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </IconButton>
        
        <Logo />
      </div>

      {/* Right Area: Controls (ordered from rightmost inward: User, Theme, Language, Bug, GitHub) */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* GitHub link */}
        <a
          href={GITHUB_REPO}
          target="_blank"
          rel="noopener noreferrer"
          title={t('toolbar.supportUs')}
          aria-label={t('toolbar.openGithub')}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
        >
          <GithubIcon />
        </a>

        {/* Bug icon link */}
        <a
          href={GITHUB_ISSUES}
          target="_blank"
          rel="noopener noreferrer"
          title={t('toolbar.reportBug')}
          aria-label={t('toolbar.openIssues')}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
        >
          <Bug className="h-5 w-5" />
        </a>

        {/* Language selector flyout */}
        <LanguageMenu
          user={user}
          onUserUpdate={onUserUpdate}
        />

        {/* Theme Toggle */}
        <ThemeToggle variant="icon" />

        {/* User profile avatar / dropdown */}
        <UserMenu
          user={user}
          onLogout={onLogout}
          onEditProfile={onEditProfile}
        />
      </div>
    </header>
  );
}
