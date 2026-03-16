import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Layers, Plus, MapPin, Activity, AlertCircle, XCircle } from 'lucide-react';

const AreasManagement = () => {
    const { areas, headAssignments, users, addArea } = useAppContext();
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [newArea, setNewArea] = React.useState({ name: '', description: '', supervisor: 'Admin' });

    const handleCreateArea = async (e) => {
        e.preventDefault();
        if (!newArea.name) return;
        await addArea(newArea);
        setNewArea({ name: '', description: '', supervisor: 'Admin' });
        setIsAddModalOpen(false);
    };

    return (
        <div className="areas-management animate-fade-in opal-background" style={{ padding: '1.5rem' }}>
            <header className="page-header" style={{ marginBottom: '2rem' }}>
                <h1 className="page-title opal-gradient-text">Áreas da Farm</h1>
                <p className="page-subtitle">Configuração de departamentos e unidades operacionais</p>
            </header>

            <div className="action-bar" style={{ marginBottom: '2rem' }}>
                <button
                    className="button-primary"
                    onClick={() => setIsAddModalOpen(true)}
                    style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                >
                    <Plus size={18} /> Nova Área
                </button>
            </div>

            <div className="areas-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {areas.map(area => {
                    const headAssignment = headAssignments.find(ha => ha.areaId === area.id);
                    const head = headAssignment ? users.find(u => u.id === headAssignment.headId) : null;

                    return (
                        <div key={area.id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
                                <div className="stat-icon-wrapper blue" style={{ width: '40px', height: '40px' }}>
                                    <Layers size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0 }}>{area.name}</h4>
                                    <span className={`status-tag ${area.status}`} style={{ fontSize: '0.6rem' }}>{area.status}</span>
                                </div>
                            </div>

                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{area.description}</p>

                            <div style={{ borderTop: '1px solid var(--border-color)', width: '100%', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                                    <MapPin size={14} className="text-secondary" />
                                    <span>Head: <strong>{head ? head.name : (area.supervisor || 'Não atribuído')}</strong></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                                    <Activity size={14} className="text-secondary" />
                                    <span>Módulos: {Object.keys(area.modules || {}).filter(k => area.modules[k]).join(', ') || 'Básico'}</span>
                                </div>
                            </div>

                            <button className="button-secondary" style={{ width: '100%', fontSize: '0.75rem' }} onClick={() => alert('Em breve: Configuração avançada')}>Configurar Área</button>
                        </div>
                    );
                })}
            </div>

            {/* Modal Nova Área */}
            {isAddModalOpen && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-content animate-slide-up" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Cadastrar Nova Área</h3>
                            <button className="icon-button-close" onClick={() => setIsAddModalOpen(false)}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateArea} className="modal-form" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label>Nome da Área</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Horta DSM"
                                    value={newArea.name}
                                    onChange={e => setNewArea({ ...newArea, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                    placeholder="Breve descrição da área..."
                                    value={newArea.description}
                                    onChange={e => setNewArea({ ...newArea, description: e.target.value })}
                                    style={{ background: 'var(--bg-opal-glass)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', color: 'var(--text-primary)', minHeight: '80px' }}
                                />
                            </div>
                            <button type="submit" className="button-primary" style={{ marginTop: '1rem' }}>Criar Área Rural</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AreasManagement;
