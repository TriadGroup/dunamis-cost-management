import React, { useState, useEffect, useMemo } from 'react';
import { Users, CheckCircle, AlertTriangle, CloudOff, ClipboardCheck, ArrowRight, Clock, KeyRound, RefreshCw, Timer, Shield, Hourglass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import MasterDashboard from './MasterDashboard';
import './Dashboard.css';

const CODE_DURATION_MS = 60 * 60 * 1000; // 60 minutes

const Dashboard = () => {
    const { tasks, syncQueue, currentUser, areas, updateAreaSettings, generateCheckInCode } = useAppContext();
    const navigate = useNavigate();

    const currentAreaId = currentUser?.accessScopes?.[0]?.areaId || 'area_agro_01';
    const currentArea = areas?.find(a => a.id === currentAreaId);

    const [settings, setSettings] = useState({
        checkInStart: '08:00',
        gracePeriod: 15,
        absenceLimit: '10:00'
    });

    // Timer state
    const [timeLeft, setTimeLeft] = useState(null); // in seconds
    const [isExpired, setIsExpired] = useState(false);

    React.useEffect(() => {
        if (currentArea) {
            setSettings({
                checkInStart: currentArea.checkInStart || '08:00',
                gracePeriod: currentArea.gracePeriod || 15,
                absenceLimit: currentArea.absenceLimit || '10:00'
            });
        }
    }, [currentArea]);

    // Timer logic: compute remaining time from checkInCodeGeneratedAt
    useEffect(() => {
        if (!currentArea?.checkInCodeGeneratedAt || !currentArea?.checkInCode) {
            setTimeLeft(null);
            setIsExpired(false);
            return;
        }

        const updateTimer = () => {
            const generatedAt = new Date(currentArea.checkInCodeGeneratedAt).getTime();
            const expiresAt = generatedAt + CODE_DURATION_MS;
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

            if (remaining <= 0) {
                setTimeLeft(0);
                setIsExpired(true);
            } else {
                setTimeLeft(remaining);
                setIsExpired(false);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [currentArea?.checkInCodeGeneratedAt, currentArea?.checkInCode]);

    const formatTimer = (totalSeconds) => {
        if (totalSeconds === null) return '--:--';
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const timerProgress = useMemo(() => {
        if (timeLeft === null) return 0;
        return (timeLeft / (CODE_DURATION_MS / 1000)) * 100;
    }, [timeLeft]);

    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const pendingTasks = tasks.filter(t => t.status !== 'done').length;
    const totalTasks = tasks.length;
    const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const handleSaveSettings = (e) => {
        e.preventDefault();
        updateAreaSettings(currentAreaId, settings);
        alert('Configurações salvas!');
    };

    const handleGenerateCode = async () => {
        await generateCheckInCode(currentAreaId);
    };

    const pendingSyncs = syncQueue?.length || 0;

    const today = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());

    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    if (currentUser?.role === 'admin_master') {
        return <MasterDashboard />;
    }

    const hasActiveCode = currentArea?.checkInCode && !isExpired;

    return (
        <div className="dashboard-container animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">Visão Geral</h1>
                <p className="page-subtitle" style={{ textTransform: 'capitalize' }}>{capitalize(today)}</p>
            </header>

            {pendingSyncs > 0 && (
                <div className="offline-banner" style={{ backgroundColor: '#fffbeb', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fcd34d', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontSize: '0.875rem' }}>
                    <CloudOff size={16} />
                    <span>Você tem {pendingSyncs} ações salvas offline aguardando sincronização.</span>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper green">
                        <CheckCircle size={20} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{completedTasks}</span>
                        <span className="stat-label">Concluídas hoje</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper orange">
                        <AlertTriangle size={20} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{pendingTasks}</span>
                        <span className="stat-label">Pendências</span>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => navigate('/staff/attendance')}>
                    <div className="stat-icon-wrapper purple">
                        <ClipboardCheck size={20} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">Gestão</span>
                        <span className="stat-label">Relatório de Presença</span>
                    </div>
                    <ArrowRight size={16} className="card-arrow" />
                </div>
            </div>

            <div className="dashboard-grid-main">
                <section className="dashboard-section section-progress">
                    <div className="section-header">
                        <h3 className="section-title">Progresso da Missão</h3>
                    </div>

                    <div className="progress-card">
                        <div className="progress-info">
                            <div className="progress-text">
                                <h4>Tarefas Diárias</h4>
                                <span>{progressPercent}% Concluído</span>
                            </div>
                        </div>
                        <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </section>

                {/* ═══ OPAL CHECK-IN CODE SECTION ═══ */}
                <section className="opal-code-section">
                    <div className="opal-code-header">
                        <div className="opal-code-icon-ring">
                            <KeyRound size={20} />
                        </div>
                        <div>
                            <h3 className="opal-code-title">Código de Presença</h3>
                            <p className="opal-code-subtitle">
                                {hasActiveCode ? 'Compartilhe com os alunos' : isExpired ? 'Código expirado' : 'Gere um código para a turma'}
                            </p>
                        </div>
                    </div>

                    {hasActiveCode ? (
                        <div className="opal-code-active">
                            <div className="opal-code-display">
                                {currentArea.checkInCode.split('').map((digit, i) => (
                                    <span key={i} className="opal-digit">{digit}</span>
                                ))}
                            </div>

                            {/* Timer Ring */}
                            <div className="opal-timer-container">
                                <svg className="opal-timer-ring" viewBox="0 0 120 120">
                                    <circle className="opal-timer-track" cx="60" cy="60" r="54" />
                                    <circle
                                        className="opal-timer-fill"
                                        cx="60" cy="60" r="54"
                                        strokeDasharray={`${2 * Math.PI * 54}`}
                                        strokeDashoffset={`${2 * Math.PI * 54 * (1 - timerProgress / 100)}`}
                                        style={{
                                            stroke: timerProgress > 20 ? 'var(--color-green-300)' : timerProgress > 5 ? 'var(--color-warning)' : '#ef4444'
                                        }}
                                    />
                                </svg>
                                <div className="opal-timer-text">
                                    <span className="opal-timer-value">{formatTimer(timeLeft)}</span>
                                    <span className="opal-timer-label">restantes</span>
                                </div>
                            </div>

                            <button className="opal-regen-btn" onClick={handleGenerateCode}>
                                <RefreshCw size={14} />
                                Gerar Novo
                            </button>
                        </div>
                    ) : (
                        <div className="opal-code-empty">
                            {isExpired && (
                                <div className="opal-expired-badge">
                                    <Timer size={14} />
                                    Código anterior expirou
                                </div>
                            )}
                            <button className="opal-generate-btn" onClick={handleGenerateCode}>
                                <Shield size={18} />
                                Gerar Código de Check-in
                            </button>
                            <p className="opal-generate-hint">Válido por 60 minutos após gerado</p>
                        </div>
                    )}
                </section>

                {/* ═══ OPAL SETTINGS SECTION ═══ */}
                <section className="opal-settings-section">
                    <div className="opal-settings-header">
                        <div className="opal-settings-icon">
                            <Clock size={18} />
                        </div>
                        <h3 className="opal-settings-title">Regras de Ponto</h3>
                    </div>

                    <form onSubmit={handleSaveSettings} className="opal-settings-form">
                        <div className="opal-setting-row">
                            <div className="opal-setting-info">
                                <span className="opal-setting-label">Início do Check-in</span>
                                <span className="opal-setting-desc">Horário que o ponto abre</span>
                            </div>
                            <input
                                type="time"
                                className="opal-time-input"
                                value={settings.checkInStart}
                                onChange={e => setSettings({ ...settings, checkInStart: e.target.value })}
                            />
                        </div>

                        <div className="opal-setting-divider"></div>

                        <div className="opal-setting-row">
                            <div className="opal-setting-info">
                                <span className="opal-setting-label">Carência</span>
                                <span className="opal-setting-desc">Minutos de tolerância para atraso</span>
                            </div>
                            <div className="opal-number-input">
                                <input
                                    type="number"
                                    value={settings.gracePeriod}
                                    onChange={e => setSettings({ ...settings, gracePeriod: parseInt(e.target.value) })}
                                    min="0"
                                />
                                <span className="opal-number-suffix">min</span>
                            </div>
                        </div>

                        <div className="opal-setting-divider"></div>

                        <div className="opal-setting-row">
                            <div className="opal-setting-info">
                                <span className="opal-setting-label">Falta Após</span>
                                <span className="opal-setting-desc">Após esse horário, conta como falta</span>
                            </div>
                            <input
                                type="time"
                                className="opal-time-input"
                                value={settings.absenceLimit}
                                onChange={e => setSettings({ ...settings, absenceLimit: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="opal-save-btn">
                            Salvar Configurações
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
