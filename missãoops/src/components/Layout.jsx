import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, CheckSquare, Map, Bell, User, LogOut, Settings, RefreshCw, ShieldAlert, ClipboardCheck, LayoutDashboard, BarChart3, Fingerprint, Layers } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { LiderDoDiaModal } from './LiderDoDiaModal';
import './Layout.css';

const Layout = () => {
  const { currentUser, syncQueue, logout } = useAppContext();
  const [showProfile, setShowProfile] = useState(false);
  const [showLiderModal, setShowLiderModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Determine if we show "Offline" indicator (mocking online status for now, always shows online/syncing)
  const isSyncing = syncQueue && syncQueue.length > 0;

  if (!currentUser) return <div style={{ padding: '2rem' }}>Carregando App...</div>;

  return (
    <div className="layout-container">
      {/* Top Header for Mobile & Desktop */}
      <header className="top-header">
        <div className="logo-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="logo-text" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, letterSpacing: '0.05em', color: '#f4efe6', fontSize: '1.2rem', marginTop: '2px' }}>FARM OPS</span>
          </div>
          {!navigator.onLine ? (
            <div className="sync-badge offline">
              <CloudOff size={12} />
              <span>Offline</span>
            </div>
          ) : isSyncing ? (
            <div className="sync-badge">
              <RefreshCw size={12} className="spin" />
              <span>Sincronizando ({syncQueue.length})</span>
            </div>
          ) : (
            <div className="sync-badge success-light">
              <span>● Online</span>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button className="icon-button" onClick={() => alert('Você não possui novas notificações.')}><Bell size={20} /></button>
          <div style={{ position: 'relative' }}>
            <button
              className="icon-button avatar-button"
              onClick={() => setShowProfile(!showProfile)}
            >
              {currentUser?.avatar || <User size={20} />}
            </button>

            {showProfile && (
              <div className="profile-dropdown animate-slide-up">
                <div className="profile-header">
                  <div className="profile-avatar-large">{currentUser.avatar}</div>
                  <div className="profile-details">
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.role === 'missionary' ? 'Missionário' : currentUser.role}</span>
                  </div>
                </div>
                <div className="profile-menu">
                  <button className="profile-menu-item" onClick={() => { setShowLiderModal(true); setShowProfile(false); }}>
                    <ShieldAlert size={16} color="#ef4444" /> Delegar Liderança
                  </button>
                  <button className="profile-menu-item text-danger" onClick={handleLogout}>
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <LiderDoDiaModal isOpen={showLiderModal} onClose={() => setShowLiderModal(false)} />

      <div className="main-layout-area">
        {/* Sidebar for Desktop */}
        <aside className="sidebar">
          <nav className="desktop-nav">
            {currentUser.role === 'admin_master' ? (
              <>
                <NavLink to="/staff/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} end>
                  <LayoutDashboard size={20} />
                  <span>Dashboard Master</span>
                </NavLink>
                <NavLink to="/staff/heads" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                  <User size={20} />
                  <span>Gestão de Heads</span>
                </NavLink>
                <NavLink to="/staff/areas" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                  <Layers size={20} />
                  <span>Áreas da Farm</span>
                </NavLink>
                <NavLink to="/staff/metrics" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                  <BarChart3 size={20} />
                  <span>Engajamento</span>
                </NavLink>
                <NavLink to="/staff/attendance" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                  <ClipboardCheck size={20} />
                  <span>Presenças</span>
                </NavLink>
                <NavLink to="/staff/audit" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                  <Fingerprint size={20} />
                  <span>Auditoria</span>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/staff/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} end>
                  <Home size={20} />
                  <span>Início</span>
                </NavLink>
                <NavLink to="/staff/tasks" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                  <CheckSquare size={20} />
                  <span>Tarefas</span>
                </NavLink>
                <NavLink to="/staff/field" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                  <Map size={20} />
                  <span>Em Campo</span>
                </NavLink>
                <NavLink to="/staff/attendance" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                  <ClipboardCheck size={20} />
                  <span>Presenças</span>
                </NavLink>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="content-area" onClick={() => setShowProfile(false)}>
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="mobile-bottom-nav">
        {currentUser.role === 'admin_master' ? (
          <>
            <NavLink to="/staff/dashboard" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"} end>
              <LayoutDashboard size={24} />
              <span>Master</span>
            </NavLink>
            <NavLink to="/staff/heads" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
              <User size={24} />
              <span>Heads</span>
            </NavLink>
            <NavLink to="/staff/metrics" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
              <BarChart3 size={24} />
              <span>Dados</span>
            </NavLink>
            <NavLink to="/staff/audit" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
              <Fingerprint size={24} />
              <span>Auditoria</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/staff/dashboard" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"} end>
              <Home size={24} />
              <span>Início</span>
            </NavLink>
            <NavLink to="/staff/tasks" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
              <CheckSquare size={24} />
              <span>Tarefas</span>
            </NavLink>
            <NavLink to="/staff/field" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
              <Map size={24} />
              <span>Atividade</span>
            </NavLink>
            <NavLink to="/staff/attendance" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
              <ClipboardCheck size={24} />
              <span>Presenças</span>
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
};

export default Layout;
