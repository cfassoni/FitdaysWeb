import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  History, 
  Upload, 
  X, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import packageJson from '../../package.json';

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

interface SidebarProps {
  currentView: 'dashboard' | 'history' | 'import' | 'profile';
  onViewChange: (view: 'dashboard' | 'history' | 'import' | 'profile') => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ currentView, onViewChange, isMobileOpen, onMobileClose }: SidebarProps) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Detailed History', icon: History },
    { id: 'import', label: 'Import CSV Data', icon: Upload },
  ] as const;

  const handleNavClick = (view: 'dashboard' | 'history' | 'import' | 'profile') => {
    onViewChange(view);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/55 backdrop-blur-xs" 
            onClick={onMobileClose}
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-72 max-w-xs bg-card border-r border-border h-full p-6 shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-8">
              <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Navigation</span>
              <button
                onClick={onMobileClose}
                className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted cursor-pointer"
                aria-label="Close menu"
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

            {/* Version Info */}
            <div className="border-t border-border pt-4 mt-auto">
              <div className="flex items-center justify-center gap-2 text-muted-foreground/60 text-xs">
                <a 
                  href={`https://github.com/cfassoni/FitdaysWeb/releases/tag/v${packageJson.version}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                  title="FitdaysWeb Releases"
                >
                  <GithubIcon className="h-4 w-4" />
                  <span className="font-mono">v{packageJson.version}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col bg-card border-r border-border h-full transition-all duration-300 relative ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted border border-border bg-card shadow-xs absolute right-[-14px] top-4 cursor-pointer z-30 hidden md:block"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

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

        {/* Version Info */}
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center justify-center gap-2 text-muted-foreground/60 text-xs">
            <a 
              href={`https://github.com/cfassoni/FitdaysWeb/releases/tag/v${packageJson.version}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              title="FitdaysWeb Releases"
            >
              <GithubIcon className="h-4 w-4" />
              {!isCollapsed && (
                <span className="font-mono animate-in fade-in duration-200">v{packageJson.version}</span>
              )}
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
