import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle, KeyRound } from 'lucide-react';
import { db } from '../lib/db';
import { useAppContext } from '../context/AppContext';
import './StudentLogin.css';

const StudentLogin = () => {
    const navigate = useNavigate();
    const { loginAsStudent } = useAppContext();

    const [step, setStep] = useState(1);
    const [shortCode, setShortCode] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleVerifyId = async (e) => {
        e.preventDefault();
        setError('');

        const code = shortCode.trim().toUpperCase();
        if (!code) return;

        // Offline lookup for the student
        const student = await db.students.where('shortCode').equalsIgnoreCase(code).first();

        if (student) {
            setStep(2);
        } else {
            setError('Código de Aluno não encontrado.');
        }
    };

    const handleVerifyPin = async (e) => {
        e.preventDefault();
        setError('');

        const code = shortCode.trim().toUpperCase();
        const student = await db.students.where('shortCode').equalsIgnoreCase(code).first();

        // Very basic Offline PIN check (In PROD this should compare hashes)
        if (student && student.pinHash === pin) {
            loginAsStudent(student);
            navigate('/student/dashboard');
        } else {
            setError('PIN Incorreto.');
        }
    };

    return (
        <div className="student-login-container animate-fade-in">
            <button className="back-button" onClick={() => step === 2 ? setStep(1) : navigate('/')}>
                <ArrowLeft size={24} /> Voltar
            </button>

            <div className="login-box">
                <div className="login-header">
                    <h2>Check-in Aluno</h2>
                    <p>Totem de Presença Offline</p>
                </div>

                {error && <div className="error-banner">{error}</div>}

                {step === 1 && (
                    <form onSubmit={handleVerifyId} className="login-form animate-slide-up">
                        <div className="input-group">
                            <label><UserCircle size={18} /> Código ID Dunamis</label>
                            <input
                                type="text"
                                placeholder="EX: DF-8942"
                                value={shortCode}
                                onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                                autoFocus
                                required
                            />
                        </div>
                        <button type="submit" className="button-primary login-btn">Continuar</button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyPin} className="login-form animate-slide-up">
                        <div className="input-group">
                            <label><KeyRound size={18} /> PIN Numérico (4 dígitos)</label>
                            <input
                                type="password"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="****"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                maxLength={4}
                                autoFocus
                                required
                                style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.5rem' }}
                            />
                        </div>
                        <button type="submit" className="button-primary login-btn">Acessar e Bater Ponto</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default StudentLogin;
