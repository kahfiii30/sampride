import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Eye, ShieldCheck, Lock } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'select' | 'admin'>('select');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login('admin', pin);
    if (!success) {
      setError('PIN tidak valid. Silakan coba lagi.');
      setPin('');
    }
  };

  if (mode === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <Card className="w-full max-w-md p-8 shadow-xl border-t-4 border-t-primary">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <ShieldCheck size={48} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center">Masuk sebagai Admin</h1>
            <p className="text-slate-500 dark:text-slate-400 text-center mt-2">Masukkan PIN rahasia untuk dapat mengubah data</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all text-center text-xl tracking-widest font-mono"
                  placeholder="••••••"
                  maxLength={6}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-sm mt-2 text-center font-medium">{error}</p>}
            </div>

            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full py-3 text-lg font-semibold">
                Masuk
              </Button>
              <button 
                type="button" 
                onClick={() => setMode('select')}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium transition-colors"
              >
                Kembali
              </button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">ContentTracker</h1>
          <p className="text-slate-500 dark:text-slate-400 text-center">Pilih peran Anda untuk masuk ke aplikasi</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => login('viewer')}
            className="w-full flex items-center p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-info hover:bg-info-bg dark:hover:bg-info-bg/10 transition-all group text-left"
          >
            <div className="bg-info/10 p-3 rounded-full mr-4 group-hover:bg-info/20 transition-colors">
              <Eye size={24} className="text-info" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Viewer</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Hanya lihat rekapan, tidak bisa ubah data</p>
            </div>
          </button>

          <button 
            onClick={() => setMode('admin')}
            className="w-full flex items-center p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group text-left"
          >
            <div className="bg-primary/10 p-3 rounded-full mr-4 group-hover:bg-primary/20 transition-colors">
              <ShieldCheck size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Admin</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Akses penuh, tambah, ubah, dan hapus data</p>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
}
