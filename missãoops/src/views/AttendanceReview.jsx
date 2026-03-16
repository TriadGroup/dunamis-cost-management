import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, Filter, Users, User, Clock, CheckCircle2, AlertCircle, Calendar, MapPin, ClipboardList } from 'lucide-react';
import './AttendanceReview.css';

const AttendanceReview = () => {
    const { attendanceRecords, students, getAttendanceStatus, getStudentMetrics } = useAppContext();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('all'); // 'all', 'on_time', 'late', 'absent'
    const [selectedStudentForHistory, setSelectedStudentForHistory] = React.useState(null);

    const getStudentName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student ? student.name : 'Aluno desconhecido';
    };

    const getStudentCode = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student ? student.shortCode : '---';
    };

    const filteredRecords = useMemo(() => {
        return attendanceRecords.filter(record => {
            const student = students.find(s => s.id === record.userId);
            const status = getAttendanceStatus(record.checkIn.clientTimestamp, student?.areaId);

            const matchesSearch =
                student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student?.shortCode.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = filterStatus === 'all' || status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [attendanceRecords, students, searchTerm, filterStatus, getAttendanceStatus]);

    const sortedRecords = useMemo(() => {
        return [...filteredRecords].sort((a, b) =>
            new Date(b.checkIn.clientTimestamp).getTime() - new Date(a.checkIn.clientTimestamp).getTime()
        );
    }, [filteredRecords]);

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesSearch =
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.shortCode.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [students, searchTerm]);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="attendance-review-container animate-fade-in">
            <header className="review-header">
                <div>
                    <h1 className="page-title">Relatório de Presença</h1>
                    <p className="page-subtitle">Registro de presenças por código (24h)</p>
                </div>
                <div className="stats-mini-summary">
                    <div className="mini-sum-item">
                        <span className="sum-val">{sortedRecords.length}</span>
                        <span className="sum-label">Hoje</span>
                    </div>
                </div>
            </header>

            <div className="records-grid">
                {sortedRecords.length > 0 ? (
                    sortedRecords.map(record => {
                        const student = students.find(s => s.id === record.userId);
                        const status = getAttendanceStatus(record.checkIn.clientTimestamp, student?.areaId);


                        return (
                            <div key={record.id} className="attendance-card-compact">
                                <div className="card-status-indicator">
                                    <div className={`status-dot ${status}`}></div>
                                </div>

                                <div className="card-details">
                                    <div className="student-info-row">
                                        <div className="info-main">
                                            <span className="student-name">{getStudentName(record.userId)}</span>
                                            <span className="student-id-code">ID: {getStudentCode(record.userId)}</span>
                                        </div>
                                        <User size={18} className="user-icon-sub" />
                                    </div>

                                    <div className="metadata-row">
                                        <div className="meta-item">
                                            <Calendar size={14} />
                                            <span>{formatDate(record.checkIn.clientTimestamp)}</span>
                                        </div>
                                        <div className="meta-item">
                                            <Clock size={14} />
                                            <span>{formatTime(record.checkIn.clientTimestamp)}</span>
                                        </div>
                                    </div>

                                    <div className={`status-badge-compact ${status}`}>
                                        {status === 'on_time' ? 'No Prazo' : status === 'late' ? 'Atrasado' : 'Falta'}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state">
                        <ClipboardList size={48} />
                        <p>Nenhum registro de presença encontrado.</p>
                    </div>
                )}
            </div>

            <div className="attendance-header-actions">
                <div className="search-bar-premium">
                    <Search size={18} />
                    <input
                        type="search"
                        placeholder="Buscar aluno por nome ou código..."
                        className="premium-input-search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="header-actions">
                    <div className="filter-select-wrapper">
                        <Filter size={18} className="filter-icon-inline" />
                        <select
                            className="premium-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Todos Status</option>
                            <option value="on_time">No Prazo</option>
                            <option value="late">Atrasados</option>
                            <option value="absent">Faltas</option>
                        </select>
                    </div>
                    <button className="button-primary" onClick={() => window.print()}>Exportar PDF</button>
                </div>
            </div>

            <div className="attendance-grid-premium">
                {filteredStudents.map(student => {
                    const status = getAttendanceStatus(new Date().toISOString(), student.areaId);
                    const metrics = getStudentMetrics(student.id);

                    return (
                        <div key={student.id} className="attendance-card-premium">
                            <div className="student-profile-row">
                                <div className="avatar-premium">{student.name.charAt(0)}</div>
                                <div className="student-info">
                                    <h4 className="student-name">{student.name}</h4>
                                    <span className="student-code">{student.shortCode}</span>
                                </div>
                                <div className={`status-badge-inline ${status}`}>
                                    {status === 'late' ? 'Atrasado' : status === 'absent' ? 'Falta' : 'Presença'}
                                </div>
                            </div>

                            <div className="metrics-row-premium">
                                <div className="metric-item">
                                    <span className="metric-label">Presenças</span>
                                    <span className="metric-value">{metrics.totalPresent || 0}</span>
                                </div>
                                <div className="metric-item">
                                    <span className="metric-label">Atrasos</span>
                                    <span className="metric-value">{metrics.totalLate || 0}</span>
                                </div>
                                <div className="metric-item">
                                    <span className="metric-label">Faltas</span>
                                    <span className="metric-value">{metrics.totalAbsences || 0}</span>
                                </div>
                            </div>

                            <button
                                className="button-secondary btn-full-width"
                                onClick={() => setSelectedStudentForHistory(student)}
                            >
                                <Users size={16} /> Ver Histórico Completo
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Histórico Simplificado */}
            {selectedStudentForHistory && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-content animate-slide-up" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>Histórico: {selectedStudentForHistory.name}</h3>
                            <button className="icon-button-close" onClick={() => setSelectedStudentForHistory(null)}>
                                <AlertCircle size={24} />
                            </button>
                        </div>
                        <div className="modal-body-scroll" style={{ padding: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
                            {attendanceRecords.filter(r => r.userId === selectedStudentForHistory.id).length > 0 ? (
                                attendanceRecords
                                    .filter(r => r.userId === selectedStudentForHistory.id)
                                    .sort((a, b) => new Date(b.checkIn.clientTimestamp) - new Date(a.checkIn.clientTimestamp))
                                    .map(record => {
                                        const status = getAttendanceStatus(record.checkIn.clientTimestamp, selectedStudentForHistory.areaId);
                                        return (
                                            <div key={record.id} className="history-item-mini" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formatDate(record.checkIn.clientTimestamp)}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatTime(record.checkIn.clientTimestamp)}</div>
                                                </div>
                                                <div className={`status-badge-inline ${status}`} style={{ height: 'fit-content' }}>
                                                    {status === 'on_time' ? 'No Prazo' : status === 'late' ? 'Atraso' : 'Falta'}
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Nenhum registro encontrado para este aluno.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceReview;
