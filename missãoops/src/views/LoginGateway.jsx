import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShieldCheck } from 'lucide-react';
import './LoginGateway.css';

const LoginGateway = () => {
    const navigate = useNavigate();

    return (
        <div className="login-gateway-container animate-fade-in">
            <div className="gateway-brand">
                <h1 className="logo-text">FARM OPS</h1>
                <p className="subtitle">Identifique seu perfil para entrar</p>
            </div>

            <div className="gateway-options">
                <button
                    className="gateway-card student-card"
                    onClick={() => navigate('/student/login')}
                >
                    <div className="card-icon">
                        <Users size={32} />
                    </div>
                    <div className="card-text">
                        <h3>Sou Aluno / Missionário</h3>
                        <p>Fazer Check-in com Código e PIN</p>
                    </div>
                </button>

                <button
                    className="gateway-card staff-card"
                    onClick={() => navigate('/staff/login')}
                >
                    <div className="card-icon">
                        <ShieldCheck size={32} />
                    </div>
                    <div className="card-text">
                        <h3>Sou Staff / Líder</h3>
                        <p>Acessar Dashboards Operacionais</p>
                    </div>
                </button>
            </div>

            <div className="power-footer">
                <small>Dunamis Farm System</small>
            </div>
        </div>
    );
};

export default LoginGateway;
