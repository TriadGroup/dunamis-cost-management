import React, { useRef, useState } from 'react';
import { MapPin, Camera, Clock, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './FieldOps.css';

const FieldOps = () => {
    const { fieldStatus, performCheckIn, performCheckOut, activeSession } = useAppContext();
    const [photoURI, setPhotoURI] = useState(null);
    const [offlineCode, setOfflineCode] = useState('');
    const [cameraActive, setCameraActive] = useState(fieldStatus === 'checked-in');

    const fileInputRef = useRef(null);

    const triggerCamera = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handlePhotoCapture = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoURI(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleActionClick = () => {
        if (fieldStatus === 'idle') {
            performCheckIn(photoURI, null, offlineCode);
            setCameraActive(true); // show photo uploader for ongoing task
        } else {
            performCheckOut();
            setCameraActive(false);
            setPhotoURI(null);
            setOfflineCode('');
        }
    };

    return (
        <div className="field-ops-container animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">Em Campo</h1>
                <p className="page-subtitle">{activeSession ? activeSession.title : 'Nenhuma sessão ativa'}</p>
            </header>

            {fieldStatus === 'idle' && (
                <section className="action-card secondary-card animate-slide-up" style={{ marginBottom: '-0.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Código da Atividade (se offline)</label>
                        <input
                            type="text"
                            placeholder="Ex: XYZ-123"
                            value={offlineCode}
                            onChange={(e) => setOfflineCode(e.target.value.toUpperCase())}
                        />
                    </div>
                </section>
            )}

            <section className="action-card main-action-card">
                <div className="status-indicator">
                    {fieldStatus === 'idle' ? (
                        <div className="status-badge warning">
                            <span className="dot"></span> Aguardando Início
                        </div>
                    ) : (
                        <div className="status-badge success">
                            <span className="dot"></span> Em Operação
                        </div>
                    )}
                </div>

                <h2 className="action-heading">
                    {fieldStatus === 'idle' ? 'Iniciar Turno' : 'Encerrar Turno'}
                </h2>

                <button
                    className={`big-action-button ${fieldStatus === 'idle' ? 'check-in' : 'check-out'}`}
                    onClick={handleActionClick}
                >
                    {fieldStatus === 'idle' ? (
                        <>
                            <MapPin size={24} />
                            REALIZAR CHECK-IN
                        </>
                    ) : (
                        <>
                            <Clock size={24} />
                            FINALIZAR CHECK-OUT
                        </>
                    )}
                </button>
            </section>

            {cameraActive && (
                <section className="action-card secondary-card animate-slide-up">
                    <div className="card-header-flex">
                        <h3 className="section-title">Comprovação de Tarefa</h3>
                        <span className="required-tag">Obrigatório</span>
                    </div>
                    <p className="section-desc">Registre o andamento e capture evidências com a câmera.</p>

                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handlePhotoCapture}
                    />

                    {!photoURI ? (
                        <button className="upload-button" onClick={triggerCamera}>
                            <Camera size={28} />
                            <span>Tirar Foto do Local</span>
                        </button>
                    ) : (
                        <div className="photo-preview-container">
                            <img src={photoURI} alt="Comprovação" className="photo-preview" />
                            <button className="button-primary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={() => {
                                alert("Foto salva. Isso alimentará o score de confiança offline.");
                                setPhotoURI(null); // Clear for next photo
                            }}>
                                Confirmar Evidência Offline
                            </button>
                            <button
                                onClick={() => setPhotoURI(null)}
                                style={{ width: '100%', marginTop: '0.5rem', color: 'var(--text-secondary)', padding: '0.5rem' }}
                            >
                                Tirar Outra Foto
                            </button>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default FieldOps;
