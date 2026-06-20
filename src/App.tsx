import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Gamepad2, CalendarClock, BarChart2, LogOut, User } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { Dashboard } from './components/Dashboard';
import { Timeline } from './components/Timeline';
import { Statistics } from './components/statistics/Statistics';
import { LoginPage } from './components/LoginPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { getPlatforms } from './lib/rawg';
import { useEffect, useRef, useState } from 'react';
import './index.css';

function NavTabs() {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!navRef.current) return;
    const activeTab = navRef.current.querySelector<HTMLElement>('.nav-tab.active');
    if (activeTab) {
      setIndicatorStyle({ left: activeTab.offsetLeft, width: activeTab.offsetWidth });
    } else {
      setIndicatorStyle({ left: 0, width: 0 });
    }
  }, [location.pathname]);

  return (
    <nav className="nav-tabs" ref={navRef}>
      <div className="nav-indicator" style={{ left: indicatorStyle.left, width: indicatorStyle.width }} />
      <NavLink to="/" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`} end>
        <Gamepad2 size={18} />
        <span className="nav-label">Dashboard</span>
      </NavLink>
      <NavLink to="/timeline" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
        <CalendarClock size={18} />
        <span className="nav-label">Timeline</span>
      </NavLink>
      <NavLink to="/statistics" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
        <BarChart2 size={18} />
        <span className="nav-label">Statistics</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`} title="Account Settings">
        <User size={18} />
        <span className="nav-label">Profile</span>
      </NavLink>
    </nav>
  );
}

function AppContent() {
  const { session, isLoading, signOut } = useAuth();

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
            <NavTabs />
            <div className="header-actions">
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
              <Route path="/profile" element={<ProfilePage />} />
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
