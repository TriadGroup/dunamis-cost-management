import { Outlet, NavLink } from 'react-router-dom';
import { Home, CheckSquare, HelpCircle, User, WifiOff, Wifi, Shield, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSyncQueue } from '../hooks/useSyncQueue';

export default function Layout() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isLeaderOrDelegate } = useAuth();
  const { isSyncing } = useSyncQueue();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { to: '/', icon: Home, label: 'Hoje' },
    { to: '/tasks', icon: CheckSquare, label: 'Tarefas' },
    ...(isLeaderOrDelegate ? [{ to: '/management', icon: Shield, label: 'Gestão' }] : []),
    { to: '/faq', icon: HelpCircle, label: 'FAQ' },
    { to: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-white p-4 flex justify-between items-center shadow-md z-10 pt-safe">
        <h1 className="text-xl font-bold tracking-tight">MissãoOps</h1>
        <div className="flex items-center gap-2 text-sm">
          {isSyncing ? (
            <span className="flex items-center gap-1 text-primary-light animate-pulse">
              <RefreshCw size={16} className="animate-spin" /> Sincronizando...
            </span>
          ) : isOnline ? (
            <span className="flex items-center gap-1 text-primary-light"><Wifi size={16} /> Online</span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400"><WifiOff size={16} /> Offline</span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-surface border-t border-gray-200 flex justify-around items-center h-16 pb-safe z-10">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-primary font-medium' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <Icon size={24} />
            <span className="text-[10px] uppercase tracking-wider">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
