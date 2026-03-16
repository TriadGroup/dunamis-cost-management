import React, { useState, useMemo } from 'react';
import { ShieldAlert, KeyRound, X, User, CheckCircle2, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import '../views/Dashboard.css'; // Reusing dashboard form styles

export const LiderDoDiaModal = ({ isOpen, onClose }) => {
    const { currentUser, students, createStudentDelegation } = useAppContext();

    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [generatedCode, setGeneratedCode] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Filter students belonging to the staff's current area
    const currentAreaId = currentUser?.accessScopes?.[0]?.areaId;
    const availableStudents = useMemo(() => {
        if (!currentAreaId || !students) return [];
        return students.filter(s => s.areaId === currentAreaId);
    }, [currentAreaId, students]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!selectedStudentId) return;

        setIsLoading(true);
        try {
            const code = await createStudentDelegation(selectedStudentId, currentUser.id);
            setGeneratedCode(code);
        } catch (error) {
            console.error('Code generation failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setSelectedStudentId('');
        setGeneratedCode(null);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 2000 }}>
            <div className="modal-content animate-slide-up" style={{ borderTop: '4px solid var(--color-warning)' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)' }}>
                        <ShieldAlert size={24} />
                        <h3 style={{ color: 'var(--color-warning)', margin: 0 }}>Delegar Liderança</h3>
                    </div>
                    <button className="icon-button-close" onClick={() => { onClose(); reset(); }}>
                        <X size={24} />
                    </button>
                </div>

                {!generatedCode ? (
                    <>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            Ative temporariamente recursos de Líder para um aluno da sua área. O aluno terá <b>acesso ao dashboard master local</b> para gerenciar presenças.
                        </p>

                        <form onSubmit={handleGenerate} className="modal-form">
                            <div className="form-group">
                                <label>Selecionar Aluno</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <User size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                                    <select
                                        value={selectedStudentId}
                                        onChange={e => setSelectedStudentId(e.target.value)}
                                        style={{
                                            paddingLeft: '2.5rem',
                                            width: '100%',
                                            appearance: 'none',
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            padding: '0.75rem 1rem 0.75rem 2.5rem',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem'
                                        }}
                                        required
                                    >
                                        <option value="" disabled>Escolha um aluno...</option>
                                        {availableStudents.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.accessCode})</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="button-primary modal-submit"
                                style={{ backgroundColor: 'var(--color-warning)', color: '#000', fontWeight: 'bold' }}
                                disabled={!selectedStudentId || isLoading}
                            >
                                {isLoading ? 'Gerando...' : 'Gerar Código de Acesso'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)', marginBottom: '1rem' }}>
                            <CheckCircle2 size={32} />
                        </div>

                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: '#fff' }}>Delegação Autorizada</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                            Peça ao aluno para acessar o <b>Totem Operacional</b>, clicar em "Assumir Liderança" e inserir este código:
                        </p>

                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px dashed var(--color-warning)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            width: '100%',
                            textAlign: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '2.5rem',
                                fontWeight: 900,
                                letterSpacing: '0.2em',
                                color: 'var(--color-warning)'
                            }}>
                                {generatedCode}
                            </span>
                        </div>

                        <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: '0 0 1.5rem' }}>
                            <Clock size={12} style={{ display: 'inline', marginRight: '4px', position: 'relative', top: '2px' }} />
                            Expira em 12 horas
                        </p>

                        <button
                            className="button-outline"
                            style={{ width: '100%' }}
                            onClick={() => { onClose(); reset(); }}
                        >
                            Concluir
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
