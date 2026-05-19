import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Target, BarChart2, Users, Menu, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

// Pages
import Dashboard from './pages/Dashboard';
import ChecklistHarian from './pages/ChecklistHarian';
import TargetKonten from './pages/TargetKonten';
import RekapBulanan from './pages/RekapBulanan';
import MasterAkun from './pages/MasterAkun';

function Sidebar({ isOpen, toggleSidebar }: { isOpen: boolean, toggleSidebar: () => void }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/checklist', label: 'Checklist Harian', icon: <CheckSquare size={20} /> },
    { path: '/target', label: 'Target Konten BA', icon: <Target size={20} /> },
    { path: '/rekap', label: 'Rekap Bulanan', icon: <BarChart2 size={20} /> },
    { path: '/akun', label: 'Master Akun', icon: <Users size={20} /> },
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="flex items-center gap-2 mb-6 px-4">
        <div className="bg-primary p-2 rounded-lg text-white">
          <CheckSquare size={24} />
        </div>
        <h1 className="text-xl font-bold">ContentTracker</h1>
      </div>
      
      <nav className="flex flex-col gap-2">
        {navItems.map(item => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => window.innerWidth <= 768 && toggleSidebar()}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <Router>
      <div className="app-container">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="main-content">
          <div className="flex justify-between items-center mb-6">
            <button 
              className="mobile-toggle" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-info-bg transition-colors ml-auto flex items-center justify-center text-text-muted hover:text-primary"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/checklist" element={<ChecklistHarian />} />
            <Route path="/target" element={<TargetKonten />} />
            <Route path="/rekap" element={<RekapBulanan />} />
            <Route path="/akun" element={<MasterAkun />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
