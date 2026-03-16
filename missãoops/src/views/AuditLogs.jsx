import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Fingerprint, Clock, Search, Filter } from 'lucide-react';

const AuditLogs = () => {
    const { auditLogs } = useAppContext();
    // Assuming searchTerm and setSearchTerm are managed by a state hook,
    // which is not provided in the original code but implied by the change.
    // For the purpose of this edit, I'll add a placeholder state.
    const [searchTerm, setSearchTerm] = React.useState('');


    return (
        <div className="audit-logs-view animate-fade-in opal-background">
            <header className="page-header">
                <div>
                    <h1 className="page-title opal-gradient-text">Trilha de Auditoria</h1>
                    <p className="page-subtitle">Registro imutável de ações críticas do sistema</p>
                </div>
            </header>

            <div className="search-bar-container glass-card">
                <Search size={20} className="text-muted" />
                <input
                    type="text"
                    placeholder="Filtrar por ação ou usuário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <button className="filter-button">
                    <Filter size={18} />
                    <span>Filtros</span>
                </button>
            </div>

            <div className="logs-table-container" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Ação</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Detalhes</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Usuário</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Data/Hora</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.map(log => (
                            <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <span className="tag-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{log.details}</td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.userId}</td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={14} />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogs;
