import React from 'react';
import { useAppContext } from '../context/AppContext';
import { UserPlus, Shield, XCircle, CheckCircle, Plus } from 'lucide-react';

const HeadsManagement = () => {
    const { users, headAssignments, areas, addHead, updateHeadStatus } = useAppContext();
    const heads = users.filter(u => u.role === 'head');

    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [newHead, setNewHead] = React.useState({ name: '', email: '', avatar: '👔' });

    const handleCreateHead = async (e) => {
        e.preventDefault();
        if (!newHead.name) return;
        await addHead(newHead);
        setNewHead({ name: '', email: '', avatar: '👔' });
        setIsAddModalOpen(false);
    };

    const toggleStatus = (headId, currentStatus) => {
        const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
        updateHeadStatus(headId, nextStatus);
    };

    return (
        <div className="heads-management-view animate-fade-in opal-background" style={{ padding: '1.5rem' }}>
            <header className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title opal-gradient-text">Liderança (Heads)</h1>
                    <p className="page-subtitle">Gerenciar responsáveis pelas áreas da Farm</p>
                </div>
                <button
                    className="add-head-button glass-card"
                    onClick={() => setIsAddModalOpen(true)}
                    style={{ border: 'none', cursor: 'pointer', display: 'flex', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
                >
                    <Plus size={18} />
                    <span>Novo Head</span>
                </button>
            </header>

            <div className="heads-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {heads.map(head => {
                    const assignedAreas = headAssignments
                        .filter(ha => ha.headId === head.id)
                        .map(ha => areas.find(a => a.id === ha.areaId)?.name);

                    return (
                        <div key={head.id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div className="profile-avatar-large" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>{head.avatar || '👔'}</div>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{head.name}</h4>
                                        <span className="text-secondary" style={{ fontSize: '0.75rem' }}>{head.email}</span>
                                    </div>
                                </div>
                                <div
                                    className={`status-tag ${head.status}`}
                                    onClick={() => toggleStatus(head.id, head.status)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {head.status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                    {head.status}
                                </div>
                            </div>

                            <div className="assigned-areas">
                                <span className="sum-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Áreas Atribuídas</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {assignedAreas.length > 0 ? assignedAreas.map(a => (
                                        <span key={a} className="tag-badge">{a}</span>
                                    )) : <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Nenhuma área atribuída</span>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: 'auto' }}>
                                <button className="outline-button" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => alert('Em breve: Edição completa do Head')}>Editar</button>
                                <button className="outline-button" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => alert('Em breve: Vincular à Área')}>Delegar Área</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Novo Head */}
            {isAddModalOpen && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-content animate-slide-up" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Cadastrar Novo Head</h3>
                            <button className="icon-button-close" onClick={() => setIsAddModalOpen(false)}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateHead} className="modal-form" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label>Nome Completo</label>
                                <input
                                    type="text"
                                    placeholder="Ex: João Missionário"
                                    value={newHead.name}
                                    onChange={e => setNewHead({ ...newHead, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Corporativo</label>
                                <input
                                    type="email"
                                    placeholder="head@farmops.com"
                                    value={newHead.email}
                                    onChange={e => setNewHead({ ...newHead, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Avatar (Emoji)</label>
                                <input
                                    type="text"
                                    value={newHead.avatar}
                                    onChange={e => setNewHead({ ...newHead, avatar: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="button-primary" style={{ marginTop: '1rem' }}>Salvar Liderança</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeadsManagement;
