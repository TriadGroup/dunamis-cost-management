import React, { useState } from 'react';
import { Filter, Plus, Calendar, Flag, X, FileText, User, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Tasks.css';

// Smart date formatter: Ontem, Hoje, Amanhã, or dd/mm
const formatSmartDate = (deadlineStr) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    if (isNaN(deadline.getTime())) return deadlineStr;
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

const Tasks = () => {
    const { tasks, toggleTaskStatus, addTask, students, groups, addStudentGroup, updateStudentGroups, currentUser } = useAppContext();
    const currentAreaId = currentUser?.accessScopes?.[0]?.areaId || 'area_agro_01';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [isSopOpen, setIsSopOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filterPriority, setFilterPriority] = useState('all');
    const [newGroup, setNewGroup] = useState({ name: '' });

    const [newTask, setNewTask] = useState({
        title: '',
        priority: 'medium',
        location: '',
        dueDate: 'Hoje',
        deadline: '',
        instructions: '',
        targetType: 'area', // 'area', 'group', 'individual'
        targetId: ''
    });

    const handleCreateGroup = (e) => {
        e.preventDefault();
        if (!newGroup.name.trim()) return;

        addStudentGroup({
            name: newGroup.name,
            areaId: currentAreaId
        });

        setNewGroup({ name: '' });
        setIsGroupModalOpen(false);
    };

    const handleCreateTask = (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;

        addTask({
            title: newTask.title,
            priority: newTask.priority,
            location: newTask.location || 'Local Não Definido',
            dueDate: newTask.dueDate,
            deadline: newTask.deadline,
            instructions: newTask.instructions,
            status: 'todo',
            areaId: currentAreaId,
            targetType: newTask.targetType,
            targetId: newTask.targetType === 'area' ? currentAreaId : newTask.targetId
        });

        setNewTask({ title: '', priority: 'medium', location: '', dueDate: 'Hoje', deadline: '', instructions: '', targetType: 'area', targetId: '' });
        setIsModalOpen(false);
    };

    const openSOP = (task) => {
        setSelectedTask(task);
        setIsSopOpen(true);
    };

    const filteredTasks = tasks.filter(t => {
        const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
        return matchesPriority;
    });

    const pendingCount = filteredTasks.filter(t => t.status !== 'done').length;

    return (
        <div className="tasks-container animate-fade-in">
            <header className="page-header filters-header">
                <div>
                    <h1 className="page-title">Tarefas</h1>
                    <p className="page-subtitle">{pendingCount} pendentes</p>
                </div>
                <div className="header-actions">
                    <button className="icon-button-outline" onClick={() => setIsMembersModalOpen(true)} title="Gerenciar Membros dos Grupos">
                        <User size={20} /> <span>Membros</span>
                    </button>
                    <button className="icon-button-outline" onClick={() => setIsGroupModalOpen(true)} title="Criar Grupo de Alunos">
                        <Plus size={20} /> <span>Grupo</span>
                    </button>
                    <div className="filter-select-wrapper" style={{ flex: '0 0 140px' }}>
                        <Filter size={18} className="filter-icon-inline" />
                        <select
                            className="premium-select"
                            style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                        >
                            <option value="all">Prioridade</option>
                            <option value="high">Alta</option>
                            <option value="medium">Média</option>
                            <option value="low">Baixa</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Groups Quick View (Optional but practical) */}
            {groups.length > 0 && (
                <section className="groups-quick-view">
                    {groups.map(grp => (
                        <div key={grp.id} className="group-chip">
                            👥 {grp.name}
                        </div>
                    ))}
                </section>
            )}

            <section className="tasks-list">
                {filteredTasks.map(task => (
                    <div key={task.id} className={`task-card ${task.status}`}>
                        <div className="task-drag-handle"></div>
                        <div className="task-content">
                            <div className="task-title-row">
                                <input
                                    type="checkbox"
                                    className="custom-checkbox"
                                    checked={task.status === 'done'}
                                    onChange={() => toggleTaskStatus(task.id)}
                                />
                                <h4
                                    className={`task-title ${task.status === 'done' ? 'strikethrough' : ''}`}
                                    onClick={() => openSOP(task)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {task.title}
                                </h4>
                            </div>

                            <div className="task-meta">
                                <span className={`task-priority priority-${task.priority}`}>
                                    <Flag size={14} />
                                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                                <span className="task-location">{task.location}</span>
                                <span className="task-target-badge" style={{ backgroundColor: 'rgba(163, 230, 53, 0.1)', color: 'var(--color-green-300)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>
                                    🎯 {task.targetType === 'area' ? 'Geral' : task.targetType === 'group' ? 'Grupo' : 'Individual'}
                                </span>
                                {task.instructions && (
                                    <span className="task-sop-badge" onClick={() => openSOP(task)}>
                                        <FileText size={14} /> SOP
                                    </span>
                                )}
                                {task.deadline && (
                                    <span className="task-deadline-badge">
                                        <Clock size={12} /> {formatSmartDate(task.deadline)} · {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                                {!task.deadline && (
                                    <span className="task-deadline-badge" style={{ opacity: 0.5 }}>
                                        <Clock size={12} /> Sem prazo
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <button className="fab-button" onClick={() => setIsModalOpen(true)}>
                <Plus size={24} />
            </button>

            {/* Create Group Modal */}
            {isGroupModalOpen && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-content animate-slide-up">
                        <div className="modal-header">
                            <h3>Novo Grupo de Alunos</h3>
                            <button className="icon-button-close" onClick={() => setIsGroupModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateGroup} className="modal-form">
                            <div className="form-group">
                                <label>Nome do Grupo</label>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Ex: Equipe de Colheita, Plantonistas..."
                                    value={newGroup.name}
                                    onChange={e => setNewGroup({ name: e.target.value })}
                                    required
                                />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Grupos permitem enviar tarefas para múltiplos alunos de uma vez.
                            </p>
                            <button type="submit" className="button-primary modal-submit">
                                Criar Grupo
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Task SOP / Detail Modal */}
            {isSopOpen && selectedTask && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-content animate-slide-up">
                        <div className="modal-header">
                            <h3 style={{ fontSize: '1.1rem' }}>{selectedTask.title}</h3>
                            <button className="icon-button-close" onClick={() => setIsSopOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="sop-content" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(163, 230, 53, 0.2)' }}>
                            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.75rem', color: 'var(--color-green-300)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>O Que Fazer (Manual Offline)</h4>
                            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                                {selectedTask.instructions || 'Nenhuma instrução específica fornecida para esta tarefa.'}
                            </p>

                            <button className="button-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => {
                                toggleTaskStatus(selectedTask.id);
                                setIsSopOpen(false);
                            }}>
                                {selectedTask.status === 'done' ? 'Marcar como Pendente' : 'Marcar como Concluída'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Members Modal */}
            {isMembersModalOpen && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-content animate-slide-up members-modal">
                        <div className="modal-header">
                            <h3>Gestão de Membros</h3>
                            <button className="icon-button-close" onClick={() => setIsMembersModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="members-list">
                            {students.map(student => (
                                <div key={student.id} className="member-item">
                                    <div className="member-info">
                                        <span className="member-name">{student.name}</span>
                                        <span className="member-code">{student.shortCode}</span>
                                    </div>
                                    <div className="member-groups">
                                        {groups.map(group => {
                                            const isMember = (student.groupIds || []).includes(group.id);
                                            return (
                                                <button
                                                    key={group.id}
                                                    className={`group-toggle-chip ${isMember ? 'active' : ''}`}
                                                    onClick={() => {
                                                        const currentIds = student.groupIds || [];
                                                        const newIds = isMember
                                                            ? currentIds.filter(id => id !== group.id)
                                                            : [...currentIds, group.id];
                                                        updateStudentGroups(student.id, newIds);
                                                    }}
                                                >
                                                    {group.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {isModalOpen && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-content animate-slide-up">
                        <div className="modal-header">
                            <h3>Nova Tarefa</h3>
                            <button className="icon-button-close" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="modal-form">
                            <div className="form-group">
                                <label>Título da Tarefa</label>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Ex: Verificar estufa 3"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Instruções / Procedimento (Mini SOP)</label>
                                <textarea
                                    rows="3"
                                    placeholder="Ex: 1. Desligar disjuntor. 2. Checar filtro..."
                                    value={newTask.instructions}
                                    onChange={e => setNewTask({ ...newTask, instructions: e.target.value })}
                                    style={{ padding: '0.875rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Destinatário (Quem deve fazer?)</label>
                                <select
                                    value={newTask.targetType}
                                    onChange={e => setNewTask({ ...newTask, targetType: e.target.value, targetId: '' })}
                                >
                                    <option value="area">Geral (Toda a Área)</option>
                                    <option value="group">Grupo de Alunos</option>
                                    <option value="individual">Aluno Específico</option>
                                </select>
                            </div>

                            {newTask.targetType === 'group' && (
                                <div className="form-group animate-slide-up">
                                    <label>Selecionar Grupo</label>
                                    <select
                                        value={newTask.targetId}
                                        onChange={e => setNewTask({ ...newTask, targetId: e.target.value })}
                                        required
                                    >
                                        <option value="">Escolha um grupo...</option>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {newTask.targetType === 'individual' && (
                                <div className="form-group animate-slide-up">
                                    <label>Selecionar Aluno</label>
                                    <select
                                        value={newTask.targetId}
                                        onChange={e => setNewTask({ ...newTask, targetId: e.target.value })}
                                        required
                                    >
                                        <option value="">Escolha um aluno...</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.shortCode})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Prioridade</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                    >
                                        <option value="low">Baixa</option>
                                        <option value="medium">Média</option>
                                        <option value="high">Alta</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Deadline (Prazo Final)</label>
                                    <input
                                        type="datetime-local"
                                        value={newTask.deadline}
                                        onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                                        style={{ width: '100%', padding: '0.875rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Local</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Setor C"
                                        value={newTask.location}
                                        onChange={e => setNewTask({ ...newTask, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="button-primary modal-submit">
                                Salvar e Atribuir Tarefa
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
