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
import { Loader2 } from 'lucide-react';

export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'import' | 'profile'>('dashboard');
  const [lastSyncedLang, setLastSyncedLang] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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
        />

        {/* Main View Container */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {currentView === 'dashboard' && (
            <Dashboard onNavigateToImport={() => setCurrentView('import')} />
          )}
          {currentView === 'history' && (
            <History />
          )}
          {currentView === 'import' && (
            <Import onImportSuccess={() => setCurrentView('dashboard')} />
          )}
          {currentView === 'profile' && (
            <Profile user={user} onProfileUpdated={(updatedUser) => setUser(updatedUser)} />
          )}
        </main>
      </div>
      
    </div>
  );
}
