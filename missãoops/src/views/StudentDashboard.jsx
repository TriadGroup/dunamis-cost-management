import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle2, Circle, Clock, MapPin, ClipboardList, KeyRound, Flag, AlertCircle, X, ShieldCheck } from 'lucide-react';
import '../components/Layout.css';
import './StudentDashboard.css';
import { db } from '../lib/db';

// Smart date formatter: Ontem, Hoje, Amanhã, or dd/mm
const formatSmartDate = (deadlineStr) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    if (isNaN(deadline.getTime())) return deadlineStr; // fallback if not parseable

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadlineDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

    const diffMs = deadlineDay.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === -1) return 'Ontem';
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    return deadline.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const formatSmartTime = (deadlineStr) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    if (isNaN(deadline.getTime())) return null;
    return deadline.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const StudentDashboard = () => {
    const { currentStudent, tasks, toggleTaskStatus, logout, performCheckIn, attendanceRecords, getAttendanceStatus, getStudentMetrics, areas } = useAppContext();
    const navigate = useNavigate();
    const [checkInStatus, setCheckInStatus] = useState('idle');
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [codeInput, setCodeInput] = useState('');
    const [codeError, setCodeError] = useState('');

    // Delegation Modal
    const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
    const [delegationCode, setDelegationCode] = useState('');
    const [delegationError, setDelegationError] = useState('');
    const [isDelegating, setIsDelegating] = useState(false);
    const { assumeDelegation } = useAppContext();

    const todayAttendance = useMemo(() => {
        if (!currentStudent || !attendanceRecords) return null;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return attendanceRecords.find(record => {
            if (record.userId !== currentStudent.id) return false;
            const checkInDate = new Date(record.checkIn.clientTimestamp);
            return checkInDate >= todayStart;
        });
    }, [currentStudent, attendanceRecords]);

    const currentArea = areas.find(a => a.id === currentStudent?.areaId);
    const hasCheckedInToday = !!todayAttendance;

    // Compute real metrics from attendance records
    const realMetrics = useMemo(() => {
        if (!currentStudent) return { totalPresent: 0, totalLate: 0, totalAbsences: 0 };
        return getStudentMetrics(currentStudent.id);
    }, [currentStudent, attendanceRecords]);

    const currentStatus = useMemo(() => {
        return getAttendanceStatus(new Date().toISOString(), currentStudent?.areaId);
    }, [currentStudent, getAttendanceStatus]);

    const checkInTimeStr = todayAttendance
        ? new Date(todayAttendance.checkIn.clientTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    const statusText = todayAttendance
        ? (getAttendanceStatus(todayAttendance.checkIn.clientTimestamp, currentStudent?.areaId) === 'late' ? 'Atraso Registrado' : 'No Horário')
        : (currentStatus === 'absent' ? 'Limite Excedido' : currentStatus === 'late' ? 'Atrasado' : 'No Horário');

    const handleDelegationSubmit = async () => {
        if (delegationCode.length !== 6) {
            setDelegationError('O código de delegação possui 6 dígitos.');
            return;
        }
        setIsDelegating(true);
        setDelegationError('');
        try {
            const res = await assumeDelegation(currentStudent.id, delegationCode);
            if (res.success) {
                setIsDelegationModalOpen(false);
                navigate('/staff');
            } else {
                setDelegationError(res.error);
                setDelegationCode('');
            }
        } catch (error) {
            setDelegationError('Erro ao validar código.');
        } finally {
            setIsDelegating(false);
        }
    };

    if (!currentStudent) {
        return <div className="loading-container">Carregando totem...</div>;
    }

    const handleCodeSubmit = async () => {
        if (codeInput.length !== 5) {
            setCodeError('O código deve ter 5 dígitos.');
            return;
        }
        if (!currentArea?.checkInCode) {
            setCodeError('Nenhum código foi gerado pelo staff ainda.');
            return;
        }
        // Check if code is expired (60 minutes)
        if (currentArea?.checkInCodeGeneratedAt) {
            const generatedAt = new Date(currentArea.checkInCodeGeneratedAt).getTime();
            const now = Date.now();
            if (now - generatedAt > 60 * 60 * 1000) {
                setCodeError('Código expirado. Peça ao líder para gerar um novo.');
                setCodeInput('');
                return;
            }
        }
        if (codeInput !== currentArea.checkInCode) {
            setCodeError('Código incorreto. Tente novamente.');
            setCodeInput('');
            return;
        }
        setCodeError('');
        setIsCodeModalOpen(false);
        setCheckInStatus('loading');
        try {
            await performCheckIn(currentStudent.id);
            setCheckInStatus('success');
            setTimeout(() => setCheckInStatus('idle'), 4000);
        } catch (error) {
            console.error("Erro no check-in:", error);
            setCheckInStatus('idle');
            alert("Erro ao realizar check-in. Tente novamente.");
        }
        setCodeInput('');
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const studentTasks = tasks.filter(task => {
        if (task.targetType === 'area' && task.targetId === currentStudent.areaId) return true;
        if (task.targetType === 'individual' && task.targetId === currentStudent.id) return true;
        if (task.targetType === 'group' && currentStudent.groupIds?.includes(task.targetId)) return true;
        return false;
    });

    const pendingTasks = studentTasks.filter(t => t.status !== 'done');

    return (
        <div className="student-dash-container animate-fade-in">
            <header className="student-header">
                <div className="header-brand">
                    <span className="logo-glow">FARM OPS</span>
                </div>
                <div className="user-action-area">
                    <div className="user-greeting">
                        <span className="greeting-text">Olá,</span>
                        <span className="user-name">{currentStudent.name.split(' ')[0]}</span>
                    </div>
                    {/* Botão de Assumir Liderança (Delegação) */}
                    <button onClick={() => setIsDelegationModalOpen(true)} className="logout-pill" style={{ color: 'var(--color-warning)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                        <ShieldCheck size={18} />
                        <span>Delegação</span>
                    </button>
                    <button onClick={handleLogout} className="logout-pill">
                        <LogOut size={18} />
                        <span>Sair</span>
                    </button>
                </div>
            </header>

            <main className="student-main">
                <section className="welcome-card">
                    <div className="id-badge">ID: {currentStudent.shortCode}</div>
                    <h1 className="welcome-title">Meu Totem Operacional</h1>
                    <p className="welcome-subtitle">Acesso rápido às suas atividades de hoje</p>

                    <div className="quick-stats-row">
                        <div className="mini-stat">
                            <span className="stat-value">{realMetrics.totalPresent}</span>
                            <span className="stat-label">Presenças</span>
                        </div>
                        <div className="mini-stat">
                            <span className="stat-value warning">{realMetrics.totalLate}</span>
                            <span className="stat-label">Atrasos</span>
                        </div>
                        <div className="mini-stat">
                            <span className="stat-value danger">{realMetrics.totalAbsences}</span>
                            <span className="stat-label">Faltas</span>
                        </div>
                        <div className="mini-stat">
                            <span className="stat-value primary">{pendingTasks.length}</span>
                            <span className="stat-label">Tarefas</span>
                        </div>
                    </div>
                </section>

                {/* Opal Check-in Card */}
                <section
                    className={`opal-checkin-card ${hasCheckedInToday ? 'checked' : checkInStatus === 'loading' ? 'loading' : checkInStatus === 'success' ? 'checked' : ''}`}
                    onClick={() => {
                        if (!hasCheckedInToday && checkInStatus === 'idle') {
                            setCodeError('');
                            setCodeInput('');
                            setIsCodeModalOpen(true);
                        }
                    }}
                >
                    <div className="opal-checkin-glow"></div>
                    <div className="opal-checkin-content">
                        <div className="opal-checkin-icon">
                            {checkInStatus === 'loading' ? (
                                <div className="spinner-mini"></div>
                            ) : (hasCheckedInToday || checkInStatus === 'success') ? (
                                <ShieldCheck size={28} />
                            ) : (
                                <KeyRound size={28} />
                            )}
                        </div>
                        <div className="opal-checkin-text">
                            <span className="opal-checkin-title">
                                {checkInStatus === 'loading' ? 'Verificando...' :
                                    (hasCheckedInToday || checkInStatus === 'success') ? 'Presença Confirmada' :
                                        'Registrar Presença'}
                            </span>
                            <span className="opal-checkin-sub">
                                {hasCheckedInToday ? `${statusText} · ${checkInTimeStr}` :
                                    checkInStatus === 'success' ? 'Contabilizada com sucesso' :
                                        `${statusText} · Toque para inserir código`}
                            </span>
                        </div>
                        {!hasCheckedInToday && checkInStatus === 'idle' && (
                            <div className="opal-checkin-arrow">›</div>
                        )}
                        {(hasCheckedInToday || checkInStatus === 'success') && (
                            <div className="opal-checkin-check">✓</div>
                        )}
                    </div>
                </section>

                {hasCheckedInToday && (
                    <button
                        className="debug-reset-btn"
                        onClick={async () => {
                            if (todayAttendance) {
                                await db.attendance_records.delete(todayAttendance.id);
                                window.location.reload();
                            }
                        }}
                    >
                        <AlertCircle size={12} />
                        Debug: Reset check-in
                    </button>
                )}

                <section className="tasks-section">
                    <div className="section-header">
                        <div className="header-title-group">
                            <ClipboardList size={20} className="header-icon" />
                            <h2>Minhas Tarefas</h2>
                        </div>
                        <span className="task-badge">{pendingTasks.length} pendentes</span>
                    </div>

                    <div className="student-tasks-list">
                        {studentTasks.length > 0 ? (
                            studentTasks.map(task => {
                                const smartDate = task.deadline ? formatSmartDate(task.deadline) : null;
                                const smartTime = task.deadline ? formatSmartTime(task.deadline) : null;

                                return (
                                    <div
                                        key={task.id}
                                        className={`student-task-item ${task.status}`}
                                        onClick={() => toggleTaskStatus(task.id)}
                                    >
                                        <div className="task-check-circle">
                                            {task.status === 'done' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                        </div>
                                        <div className="task-body">
                                            <h4 className="task-item-title">{task.title}</h4>
                                            <div className="task-item-meta">
                                                <span className={`priority-tag p-${task.priority}`}>
                                                    <Flag size={10} /> {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                                </span>
                                                {task.location && task.location !== 'Local Não Definido' && (
                                                    <span className="meta-tag">
                                                        <MapPin size={12} /> {task.location}
                                                    </span>
                                                )}
                                                {smartDate && (
                                                    <span className={`meta-tag ${smartDate === 'Ontem' ? 'overdue' : ''}`}>
                                                        <Clock size={12} /> {smartDate}{smartTime ? ` · ${smartTime}` : ''}
                                                    </span>
                                                )}
                                                {!smartDate && (
                                                    <span className="meta-tag">
                                                        <Clock size={12} /> Sem prazo
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="empty-tasks">
                                <p>Sem tarefas atribuídas para você hoje.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Opal Code Entry Modal */}
            {isCodeModalOpen && (
                <div className="opal-modal-overlay animate-fade-in">
                    <div className="opal-code-modal animate-slide-up">
                        <button className="opal-modal-close" onClick={() => setIsCodeModalOpen(false)}>
                            <X size={20} />
                        </button>

                        <div className="opal-modal-icon-ring">
                            <KeyRound size={32} />
                        </div>

                        <h3 className="opal-modal-title">Coram Deo</h3>
                        <p className="opal-modal-desc">
                            Insira o código de 5 dígitos fornecido<br />pelo seu líder
                        </p>

                        <div className="opal-code-input-wrapper">
                            <input
                                autoFocus
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={5}
                                placeholder="•••••"
                                value={codeInput}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                                    setCodeInput(val);
                                    setCodeError('');
                                }}
                                className={`opal-code-input ${codeError ? 'error' : ''} ${codeInput.length === 5 ? 'full' : ''}`}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleCodeSubmit();
                                }}
                            />
                            <div className="opal-code-dots">
                                {[0, 1, 2, 3, 4].map(i => (
                                    <div key={i} className={`opal-dot ${codeInput.length > i ? 'filled' : ''}`}></div>
                                ))}
                            </div>
                        </div>

                        {codeError && (
                            <p className="opal-code-error">{codeError}</p>
                        )}

                        <button
                            className={`opal-confirm-btn ${codeInput.length === 5 ? 'ready' : ''}`}
                            onClick={handleCodeSubmit}
                            disabled={codeInput.length !== 5}
                        >
                            Confirmar Presença
                        </button>
                    </div>
                </div>
            )}

            {/* OPAL DELEGATION CODE MODAL */}
            {isDelegationModalOpen && (
                <div className="opal-modal-overlay animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsDelegationModalOpen(false); }}>
                    <div className="opal-code-modal animate-slide-up" style={{ borderTop: '4px solid var(--color-warning)' }}>
                        <button className="opal-modal-close" onClick={() => setIsDelegationModalOpen(false)}>
                            <X size={20} />
                        </button>

                        <div className="opal-modal-icon-ring" style={{ color: 'var(--color-warning)', borderColor: 'rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.08)' }}>
                            <ShieldCheck size={32} />
                        </div>

                        <h3 className="opal-modal-title" style={{ color: '#fff' }}>Assumir Liderança</h3>
                        <p className="opal-modal-desc">
                            Insira o código de 6 dígitos fornecido pelo Head ou Líder da sua área.
                        </p>

                        <div className="opal-code-input-wrapper">
                            <input
                                autoFocus
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={delegationCode}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setDelegationCode(val);
                                    if (delegationError) setDelegationError('');
                                }}
                                className={`opal-code-input ${delegationError ? 'error' : ''} ${delegationCode.length === 6 ? 'full' : ''}`}
                                placeholder="------"
                                style={{
                                    borderColor: delegationCode.length === 6 ? 'var(--color-warning)' : '',
                                    boxShadow: delegationCode.length === 6 ? '0 0 0 4px rgba(245, 158, 11, 0.1)' : ''
                                }}
                            />
                            {delegationError && <div className="opal-code-error">{delegationError}</div>}
                        </div>

                        <div className="opal-code-dots" style={{ marginTop: '1rem' }}>
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`opal-dot ${i < delegationCode.length ? 'filled' : ''}`}
                                    style={{ background: i < delegationCode.length ? 'var(--color-warning)' : '' }}
                                />
                            ))}
                        </div>

                        <button
                            className={`opal-confirm-btn ${delegationCode.length === 6 && !isDelegating ? 'ready' : ''}`}
                            onClick={handleDelegationSubmit}
                            disabled={delegationCode.length !== 6 || isDelegating}
                            style={{
                                background: delegationCode.length === 6 && !isDelegating ? 'var(--color-warning)' : '',
                                color: delegationCode.length === 6 && !isDelegating ? '#000' : ''
                            }}
                        >
                            {isDelegating ? 'Validando...' : 'Validar Identidade'}
                        </button>
                    </div>
                </div>
            )}

            {/* OPAL DELEGATION CODE MODAL */}
            {isDelegationModalOpen && (
                <div className="opal-modal-overlay animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsDelegationModalOpen(false); }}>
                    <div className="opal-code-modal animate-slide-up" style={{ borderTop: '4px solid var(--color-warning)' }}>
                        <button className="opal-modal-close" onClick={() => setIsDelegationModalOpen(false)}>
                            <X size={20} />
                        </button>

                        <div className="opal-modal-icon-ring" style={{ color: 'var(--color-warning)', borderColor: 'rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.08)' }}>
                            <ShieldCheck size={32} />
                        </div>

                        <h3 className="opal-modal-title" style={{ color: '#fff' }}>Assumir Liderança</h3>
                        <p className="opal-modal-desc">
                            Insira o código de 6 dígitos fornecido pelo seu líder.
                        </p>

                        <div className="opal-code-input-wrapper">
                            <input
                                autoFocus
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={delegationCode}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setDelegationCode(val);
                                    if (delegationError) setDelegationError('');
                                }}
                                className={`opal-code-input ${delegationError ? 'error' : ''} ${delegationCode.length === 6 ? 'full' : ''}`}
                                placeholder="------"
                                style={{
                                    borderColor: delegationCode.length === 6 ? 'var(--color-warning)' : '',
                                    boxShadow: delegationCode.length === 6 ? '0 0 0 4px rgba(245, 158, 11, 0.1)' : ''
                                }}
                            />
                            {delegationError && <div className="opal-code-error">{delegationError}</div>}
                        </div>

                        <div className="opal-code-dots" style={{ marginTop: '1rem' }}>
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`opal-dot ${i < delegationCode.length ? 'filled' : ''}`}
                                    style={{ background: i < delegationCode.length ? 'var(--color-warning)' : '' }}
                                />
                            ))}
                        </div>

                        <button
                            className={`opal-confirm-btn ${delegationCode.length === 6 && !isDelegating ? 'ready' : ''}`}
                            onClick={handleDelegationSubmit}
                            disabled={delegationCode.length !== 6 || isDelegating}
                            style={{
                                background: delegationCode.length === 6 && !isDelegating ? 'var(--color-warning)' : '',
                                color: delegationCode.length === 6 && !isDelegating ? '#000' : ''
                            }}
                        >
                            {isDelegating ? 'Validando...' : 'Validar Identidade'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
