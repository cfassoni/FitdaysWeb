import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  History, 
  Upload, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import type { User } from '../lib/api';

interface SidebarProps {
  currentView: 'dashboard' | 'history' | 'import' | 'profile';
  onViewChange: (view: 'dashboard' | 'history' | 'import' | 'profile') => void;
  user: User | null;
  onLogout: () => void;
}

export default function Sidebar({ currentView, onViewChange, user, onLogout }: SidebarProps) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Detailed History', icon: History },
    { id: 'import', label: 'Import CSV Data', icon: Upload },
  ] as const;

  const handleNavClick = (view: 'dashboard' | 'history' | 'import' | 'profile') => {
    onViewChange(view);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">FitdaysWeb</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/55 backdrop-blur-xs" 
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-72 max-w-xs bg-card border-r border-border h-full p-6 shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">FitdaysWeb</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center w-full gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{t(`sidebar.${item.id}`)}</span>
                  </button>
                );
              })}
            </nav>

            {/* Footer / User / Theme info */}
            <div className="border-t border-border pt-4 mt-auto space-y-4">
              <button
                onClick={() => handleNavClick('profile')}
                className="flex items-center w-full gap-3 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer text-left focus:outline-none"
              >
                {user?.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt={user.display_name || user.login}
                    className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                    {user?.display_name ? user.display_name.slice(0, 2).toUpperCase() : (user?.login ? user.login.slice(0, 2).toUpperCase() : 'US')}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate leading-none mb-1">{user?.display_name || user?.login || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || 'email@example.com'}</p>
                </div>
              </button>

              <div className="flex flex-col gap-2">
                <ThemeToggle />
                <LanguageSelector />
                <button
                  onClick={onLogout}
                  className="flex items-center w-full gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span>{t('common.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col bg-card border-r border-border h-screen sticky top-0 transition-all duration-300 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border h-16">
          {!isCollapsed && (
            <div className="flex items-center gap-2 animate-in fade-in duration-300">
              <TrendingUp className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                FitdaysWeb
              </span>
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted border border-border bg-card shadow-xs absolute right-[-14px] top-4 cursor-pointer hidden md:block"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 mt-4">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in duration-200">{t(`sidebar.${item.id}`)}</span>}
              </button>
            );
          })}
        </nav>

        {/* User profile & controls */}
        <div className="p-4 border-t border-border space-y-3">
          <button
            onClick={() => onViewChange('profile')}
            className={`flex items-center w-full gap-3 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer text-left focus:outline-none ${isCollapsed ? 'justify-center' : ''}`}
            title="Edit Profile"
          >
            {user?.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={user.display_name || user.login}
                className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                {user?.display_name ? user.display_name.slice(0, 2).toUpperCase() : (user?.login ? user.login.slice(0, 2).toUpperCase() : 'US')}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in duration-200">
                <p className="text-sm font-semibold truncate leading-none mb-1">{user?.display_name || user?.login || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || 'email@example.com'}</p>
              </div>
            )}
          </button>

          <div className="flex flex-col gap-1.5 pt-2">
            <div className={isCollapsed ? 'flex justify-center' : ''}>
              {isCollapsed ? (
                <div title={t('sidebar.toggleTheme')}>
                  <ThemeToggle />
                </div>
              ) : (
                <ThemeToggle />
              )}
            </div>
            <div className={isCollapsed ? 'flex justify-center' : ''}>
              <LanguageSelector isCollapsed={isCollapsed} />
            </div>
            <button
              onClick={onLogout}
              className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? t('common.logout') : undefined}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="animate-in fade-in duration-200">{t('common.logout')}</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
