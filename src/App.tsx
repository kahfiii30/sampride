import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Target, BarChart2, Users, Menu, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

// Pages
import Dashboard from './pages/Dashboard';
import ChecklistHarian from './pages/ChecklistHarian';
import TargetKonten from './pages/TargetKonten';
import RekapBulanan from './pages/RekapBulanan';
import MasterAkun from './pages/MasterAkun';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogOut } from 'lucide-react';
import { ConfirmModal } from './components/ui/ConfirmModal';

function Sidebar({ isOpen, toggleSidebar }: { isOpen: boolean, toggleSidebar: () => void }) {
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
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
      
      <nav className="flex flex-col gap-2 flex-1">
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

      <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="sidebar-link w-full text-left text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <LogOut size={20} />
          Keluar
        </button>
      </div>

      <ConfirmModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          localStorage.removeItem('app_role');
          window.location.href = '/';
        }}
        title="Keluar dari Aplikasi"
        description="Apakah Anda yakin ingin keluar? Anda harus memasukkan PIN lagi jika ingin masuk sebagai Admin."
        confirmText="Ya, Keluar"
        cancelText="Batal"
        variant="warning"
      />
    </div>
  );
}

function MainApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  
  const { role } = useAuth();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  if (!role) {
    return <Login />;
  }

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

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
