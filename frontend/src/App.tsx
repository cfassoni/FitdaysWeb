import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, removeAuthToken, getAuthToken } from './lib/api';
import type { User } from './lib/api';
import Sidebar from './components/Sidebar';
import TopToolbar from './components/TopToolbar';
import Login from './views/Login';
import Register from './views/Register';
import Dashboard from './views/Dashboard';
import History from './views/History';
import Import from './views/Import';
import Profile from './views/Profile';
import SharedReports from './views/SharedReports';
import GuestSharedReport from './views/GuestSharedReport';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'import' | 'profile' | 'shared_links'>('dashboard');
  const [lastSyncedLang, setLastSyncedLang] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [sharedLinksCount, setSharedLinksCount] = useState<number>(0);

  // Sync preferred language from logged-in user profile
  useEffect(() => {
    if (user?.preferred_language) {
      let lang = user.preferred_language.toLowerCase();
      if (lang.startsWith('pt')) lang = 'pt';
      else if (lang.startsWith('es')) lang = 'es';
      else lang = 'en';

      if (lastSyncedLang !== lang) {
        i18n.changeLanguage(lang);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLastSyncedLang(lang);
      }
    } else if (!user) {
      if (lastSyncedLang !== null) {
        setLastSyncedLang(null);
      }
    }
  }, [user, lastSyncedLang, i18n]);

  const checkAuth = async () => {
    const token = getAuthToken();
    if (!token) {
      setIsCheckingAuth(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const currentUser = await api.getMe();
      setUser(currentUser);
      setIsAuthenticated(true);
      
      // Fetch initial shared links count
      const links = await api.getSharedLinks();
      const activeCount = links.filter(l => !l.expires_at || new Date(l.expires_at) > new Date()).length;
      setSharedLinksCount(activeCount);
    } catch {
      // Token is invalid/expired
      removeAuthToken();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();

    const handleExpired = () => {
      setIsAuthenticated(false);
      setUser(null);
      setCurrentView('dashboard');
    };

    window.addEventListener('auth-session-expired', handleExpired);
    return () => {
      window.removeEventListener('auth-session-expired', handleExpired);
    };
  }, []);

  const handleLoginSuccess = () => {
    checkAuth();
  };

  const handleLogout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    setUser(null);
    setLastSyncedLang(null);
    setCurrentView('dashboard');
  };

  // Check if current URL is a guest-facing shared link URL
  const isSharedPath = window.location.pathname.startsWith('/shared/');
  const sharedToken = isSharedPath ? window.location.pathname.split('/shared/')[1] : null;

  // If visiting a shared report link, bypass checkAuth and authentication requirements
  if (isSharedPath && sharedToken) {
    return <GuestSharedReport token={sharedToken} />;
  }

  // Auth Loading State
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  // Unauthenticated Views
  if (!isAuthenticated) {
    return authView === 'login' ? (
      <Login 
        onLoginSuccess={handleLoginSuccess}
        onGoToRegister={() => setAuthView('register')}
      />
    ) : (
      <Register 
        onRegisterSuccess={handleLoginSuccess}
        onGoToLogin={() => setAuthView('login')}
      />
    );
  }

  // Authenticated Dashboard Layout
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
      
      {/* Top Toolbar */}
      <TopToolbar 
        user={user}
        onLogout={handleLogout}
        onEditProfile={() => setCurrentView('profile')}
        onUserUpdate={setUser}
        onMobileMenuToggle={() => setIsMobileMenuOpen(prev => !prev)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar 
          currentView={currentView}
          onViewChange={setCurrentView}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
          sharedLinksCount={sharedLinksCount}
        />

        {/* Main View Container */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {currentView === 'dashboard' && (
            <Dashboard onNavigateToImport={() => setCurrentView('import')} />
          )}
          {currentView === 'history' && (
            <History onLinksUpdated={setSharedLinksCount} />
          )}
          {currentView === 'import' && (
            <Import onImportSuccess={() => setCurrentView('dashboard')} />
          )}
          {currentView === 'profile' && (
            <Profile user={user} onProfileUpdated={(updatedUser) => setUser(updatedUser)} />
          )}
          {currentView === 'shared_links' && (
            <SharedReports onLinksUpdated={setSharedLinksCount} />
          )}
        </main>
      </div>
      
    </div>
  );
}
