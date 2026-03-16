import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle, Lock } from 'lucide-react';
import { db } from '../lib/db';
import { useAppContext } from '../context/AppContext';
import './StudentLogin.css'; // Reusing the same CSS structure

const StaffLogin = () => {
    const navigate = useNavigate();
    const { loginAsStaff } = useAppContext();

    const [email, setEmail] = useState('admin');
    const [password, setPassword] = useState('Teste123');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        // Mocking staff auth via IndexedDB (in Prod -> Firebase Auth)
        const user = await db.users.where('email').equalsIgnoreCase(email).first();

        if (user) {
            if (user.email === 'admin' && password !== 'Teste123') {
                setError('Credenciais inválidas ou usuário sem permissão.');
                return;
            }
            loginAsStaff(user);
            navigate('/staff/dashboard');
        } else {
            setError('Credenciais inválidas ou usuário sem permissão.');
        }
    };

    return (
        <div className="student-login-container animate-fade-in">
            <button className="back-button" onClick={() => navigate('/')}>
                <ArrowLeft size={24} /> Voltar
            </button>

            <div className="login-box">
                <div className="login-header">
                    <h2>Staff Login</h2>
                    <p>Acesso Administrativo Dunamis</p>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label><UserCircle size={18} /> E-mail</label>
                        <input
                            type="email"
                            placeholder="seu@dunamisfarm.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label><Lock size={18} /> Senha</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="button-primary login-btn" style={{ marginTop: '1rem' }}>
                        Entrar no Dashboard
                    </button>

                    <button type="button" className="button-outline" onClick={() => navigate('/student/login')} style={{ width: '100%' }}>
                        Bater Ponto como Aluno
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StaffLogin;
