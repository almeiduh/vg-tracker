import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Gamepad2, CalendarClock, BarChart2, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { Dashboard } from './components/Dashboard';
import { Timeline } from './components/Timeline';
import { Statistics } from './components/statistics/Statistics';
import { LoginPage } from './components/LoginPage';
import { getPlatforms } from './lib/rawg';
import { useEffect } from 'react';
import './index.css';

function AppContent() {
  const { session, isLoading, signOut, user } = useAuth();

  useEffect(() => {
    if (session) {
      // Warm up the platforms cache on initial application load
      getPlatforms().catch(console.error);
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <GameProvider>
      <BrowserRouter>
        <div className="app-layout">
          <header className="app-header glass-panel">
            <div className="logo-container">
              <img src="/logo.png" alt="VG Tracker Logo" className="app-logo" />
              <span className="logo-text">VG Tracker</span>
            </div>
            <nav className="nav-tabs">
              <NavLink
                to="/"
                className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
                end
              >
                <Gamepad2 size={18} />
                Dashboard
              </NavLink>
              <NavLink
                to="/timeline"
                className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
              >
                <CalendarClock size={18} />
                Timeline
              </NavLink>
              <NavLink
                to="/statistics"
                className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
              >
                <BarChart2 size={18} />
                Statistics
              </NavLink>
            </nav>
            <div className="header-actions">
              <span className="user-email">{user?.email}</span>
              <button
                className="logout-button"
                id="logout-button"
                onClick={signOut}
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <main className="app-main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/statistics" element={<Statistics />} />
            </Routes>

          </main>
        </div>
      </BrowserRouter>
    </GameProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
