import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
    Users,
    CheckCircle,
    AlertTriangle,
    BarChart3,
    TrendingUp,
    Layers,
    UserCheck,
    Clock,
    Zap,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import './MasterDashboard.css';

const MasterDashboard = () => {
    const {
        students,
        tasks,
        attendanceRecords,
        areas,
        headAssignments,
        users,
        auditLogs,
        getStudentMetrics
    } = useAppContext();
    const navigate = useNavigate();

    // --- GLOBAL CALCULATIONS ---
    const stats = useMemo(() => {
        const totalStudents = students.length;
        const totalAreas = areas.length;
        const totalHeads = users.filter(u => u.role === 'head').length;

        const completedTasks = tasks.filter(t => t.status === 'done').length;
        const totalTasks = tasks.length;
        const taskEfficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const totalCheckins = attendanceRecords.length;
        const totalLates = students.reduce((acc, s) => acc + getStudentMetrics(s.id).totalLate, 0);
        const lateRate = totalCheckins > 0 ? Math.round((totalLates / totalCheckins) * 100) : 0;

        return {
            totalStudents,
            totalAreas,
            totalHeads,
            taskEfficiency,
            lateRate,
            totalCheckins
        };
    }, [students, tasks, attendanceRecords, areas, users]);

    // --- AREA HEALTH MAP ---
    const areaHealth = useMemo(() => {
        return areas.map(area => {
            const areaTasks = tasks.filter(t => t.areaId === area.id);
            const areaStudents = students.filter(s => s.areaId === area.id);
            const completedAreaTasks = areaTasks.filter(t => t.status === 'done').length;

            const taskCompletion = areaTasks.length > 0
                ? Math.round((completedAreaTasks / areaTasks.length) * 100)
                : 100;

            const areaHeadAssignment = headAssignments.find(ha => ha.areaId === area.id);
            const head = areaHeadAssignment ? users.find(u => u.id === areaHeadAssignment.headId) : null;

            // Engagement Formula Simple: (TaskCompletion + Attendance) / 2
            const avgAttendance = areaStudents.length > 0
                ? Math.round(areaStudents.reduce((acc, s) => acc + getStudentMetrics(s.id).totalPresent, 0) / (areaStudents.length * Math.max(1, attendanceRecords.length > 0 ? Math.ceil(attendanceRecords.length / Math.max(1, students.length)) : 1)) * 100)
                : 0;

            const overallHealth = Math.round((taskCompletion + (avgAttendance > 100 ? 100 : avgAttendance)) / 2);

            return {
                ...area,
                headName: head ? head.name : 'Sem Head',
                taskCompletion,
                health: overallHealth
            };
        }).sort((a, b) => b.health - a.health);
    }, [areas, tasks, students, headAssignments, users]);

    return (
        <div className="master-dashboard animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Mission Control</h1>
                    <p className="page-subtitle">Visão Global da Dunamis Farm</p>
                </div>
                <div className="last-sync-tag">
                    <Zap size={14} className="zap-icon" />
                    Real-time Data
                </div>
            </header>

            {/* Global KPIs */}
            <div className="master-stats-grid">
                <MetricCard
                    title="Presença Global"
                    value={`${stats.totalCheckins}`}
                    subvalue="+12% vs ontem"
                    icon={<UserCheck size={24} />}
                    color="green"
                    trend="up"
                    chartData={[20, 45, 30, 60, 50, 80, 70]} // Sparkline demo data
                    onClick={() => navigate('/staff/attendance')}
                />
                <MetricCard
                    title="Eficiência de Tarefas"
                    value={`${stats.taskEfficiency}%`}
                    subvalue="Consolidado mestre"
                    icon={<CheckCircle size={24} />}
                    color="blue"
                    chartData={[70, 65, 80, 75, 90, 85, 95]}
                    onClick={() => navigate('/staff/tasks')}
                />
                <MetricCard
                    title="Índice de Atrasos"
                    value={`${stats.lateRate}%`}
                    subvalue="Sobre total check-ins"
                    icon={<Clock size={24} />}
                    color="orange"
                    trend="down"
                    chartData={[30, 25, 20, 35, 10, 15, 5]}
                    onClick={() => navigate('/staff/attendance')}
                />
                <MetricCard
                    title="Áreas Ativas"
                    value={`${stats.totalAreas}`}
                    subvalue={`Geridas por ${stats.totalHeads} Heads`}
                    icon={<Layers size={24} />}
                    color="purple"
                    chartData={[2, 2, 3, 3, 3, 3, 4]}
                    onClick={() => navigate('/staff/areas')}
                />
            </div>

            <div className="master-grid-secondary">
                {/* Area Health Map */}
                <section className="dashboard-section area-health-section">
                    <div className="section-header">
                        <h3 className="section-title">Mapa de Saúde Operacional</h3>
                        <BarChart3 size={18} className="text-secondary" />
                    </div>
                    <div className="area-health-list">
                        {areaHealth.map(area => (
                            <div key={area.id} className="area-health-card clickable" onClick={() => navigate('/staff/tasks')}>
                                <div className="area-health-info">
                                    <div className="area-main">
                                        <h4>{area.name}</h4>
                                        <span className="head-badge">{area.headName}</span>
                                    </div>
                                    <div className="health-percentage" style={{ color: area.health > 70 ? 'var(--color-green-400)' : area.health > 40 ? 'var(--color-orange-400)' : 'var(--color-red-400)' }}>
                                        {area.health}%
                                    </div>
                                </div>
                                <div className="health-bar-bg">
                                    <div
                                        className="health-bar-fill"
                                        style={{
                                            width: `${area.health}%`,
                                            background: area.health > 70 ? 'var(--color-green-500)' : area.health > 40 ? 'var(--color-orange-500)' : 'var(--color-red-500)'
                                        }}
                                    ></div>
                                </div>
                                <div className="area-sub-metrics">
                                    <span>{area.taskCompletion}% Tarefas</span>
                                    <span>{students.filter(s => s.areaId === area.id).length} Alunos</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Recent Master Logs */}
                <section className="dashboard-section logs-section">
                    <div className="section-header">
                        <h3 className="section-title">Últimas Ações Master</h3>
                        <TrendingUp size={18} className="text-secondary" />
                    </div>
                    <div className="master-logs-feed">
                        {auditLogs.slice(0, 5).map(log => (
                            <div key={log.id} className="mini-log-item">
                                <div className="log-icon-blob"></div>
                                <div className="log-text">
                                    <p className="log-desc"><strong>{log.action}</strong>: {log.details}</p>
                                    <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, subvalue, icon, color, trend, chartData, onClick }) => {
    return (
        <div className={`metric-card ${color} ${onClick ? 'clickable' : ''}`} onClick={onClick}>
            <div className="metric-icon-box">
                {icon}
            </div>
            <div className="metric-content">
                <span className="metric-label">{title}</span>
                <div className="metric-value-row">
                    <span className="metric-value">{value}</span>
                    {trend && (
                        <span className={`trend-pill ${trend}`}>
                            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        </span>
                    )}
                </div>
                <span className="metric-subvalue">{subvalue}</span>
            </div>

            {/* SVG Sparkline */}
            {chartData && (
                <div className="metric-sparkline">
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                        <path
                            d={`M ${chartData.map((d, i) => `${(i / (chartData.length - 1)) * 100} ${40 - (d / 100) * 40}`).join(' L ')}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.3"
                        />
                    </svg>
                </div>
            )}
        </div>
    );
};

export default MasterDashboard;
