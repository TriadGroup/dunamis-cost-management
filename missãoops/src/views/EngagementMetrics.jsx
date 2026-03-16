import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react';

const EngagementMetrics = () => {
    return (
        <div className="engagement-metrics animate-fade-in" style={{ padding: '1.5rem' }}>
            <header className="page-header" style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">Métricas de Engajamento</h1>
                <p className="page-subtitle">Análise profunda de adoção e performance operacional</p>
            </header>

            <div className="metrics-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', background: 'var(--bg-primary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                <BarChart3 size={48} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                <h3>Módulo Analítico em Construção</h3>
                <p style={{ maxWidth: '400px' }}>As fórmulas de engajamento (E_aluno e E_lider) estão sendo processadas. Em breve, você terá acesso a rankings, tendências e alertas preditivos nesta seção.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '2rem' }}>
                    <div className="stat-card" style={{ gap: '0.5rem' }}>
                        <Users size={16} />
                        <span>Score Alunos</span>
                    </div>
                    <div className="stat-card" style={{ gap: '0.5rem' }}>
                        <Target size={16} />
                        <span>Score Líderes</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EngagementMetrics;
