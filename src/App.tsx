import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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
          <header className="app-header glass-panel" style={{
            margin: '1rem',
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
              <Gamepad2 className="text-accent-blue" color="var(--accent-blue)" />
              VG Tracker
            </div>
            <nav style={{ display: 'flex', gap: '1.5rem' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }} className="nav-link">
                <Gamepad2 size={18} />
                Dashboard
              </Link>
              <Link to="/timeline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }} className="nav-link">
                <CalendarClock size={18} />
                Timeline
              </Link>
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
