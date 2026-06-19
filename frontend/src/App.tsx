import { useEffect, useState } from 'react';
import { api, removeAuthToken, getAuthToken } from './lib/api';
import type { User } from './lib/api';
import Sidebar from './components/Sidebar';
import Login from './views/Login';
import Register from './views/Register';
import Dashboard from './views/Dashboard';
import History from './views/History';
import Import from './views/Import';
import Profile from './views/Profile';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'import' | 'profile'>('dashboard');

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
    } catch (err) {
      // Token is invalid/expired
      removeAuthToken();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
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
    setCurrentView('dashboard');
  };

  // Auth Loading State
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium">Verifying authorization...</p>
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
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground overflow-hidden">
      
      {/* Navigation Sidebar */}
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main View Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
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
  );
}
