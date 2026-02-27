import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Gamepad2, CalendarClock } from 'lucide-react';
import { GameProvider } from './contexts/GameContext';
import { Dashboard } from './components/Dashboard';
import { Timeline } from './components/Timeline';
import { getPlatforms } from './lib/rawg';
import { useEffect } from 'react';
import './index.css';

function App() {
  useEffect(() => {
    // Warm up the platforms cache on initial application load
    getPlatforms().catch(console.error);
  }, []);

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
            </nav>
          </header>

          <main className="app-main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/timeline" element={<Timeline />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;
