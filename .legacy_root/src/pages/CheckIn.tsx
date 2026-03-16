import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle } from 'lucide-react';
import { db } from '../store/db';

export default function CheckIn() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<string | null>(null);
  const [offlineCode, setOfflineCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!photo) return alert('A foto é obrigatória para o check-in.');
    setSaving(true);
    
    const clientTimestamp = new Date().toISOString();
    
    await db.syncQueue.add({
      id: crypto.randomUUID(),
      type: 'CHECK_IN',
      payload: {
        activityId: 'act_999',
        photoBase64: photo,
        offlineCode,
        clientTimestamp,
      },
      status: 'PENDING',
      retryCount: 0,
      createdAt: Date.now(),
    });

    setSuccess(true);
    setTimeout(() => navigate('/'), 2000);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center mt-20">
        <CheckCircle size={64} className="text-success" />
        <h2 className="text-2xl font-bold text-gray-900">Check-in Salvo!</h2>
        <p className="text-gray-500">O registro foi salvo offline e será sincronizado quando houver internet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 font-medium">Voltar</button>
        <h2 className="text-xl font-bold text-gray-900">Fazer Check-in</h2>
      </div>

      <div className="bg-surface rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
        <p className="text-sm text-gray-600">Tire uma foto do local ou da equipe para comprovar sua presença.</p>
        
        {photo ? (
          <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100">
            <img src={photo} alt="Preview" className="w-full h-full object-cover" />
            <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
              Refazer
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <Camera size={32} className="text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-600">Capturar Foto</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
          </label>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código da Atividade (se exigido)</label>
          <input 
            type="text" 
            value={offlineCode}
            onChange={(e) => setOfflineCode(e.target.value.toUpperCase())}
            placeholder="Ex: ALFA77"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg tracking-widest uppercase focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={!photo || saving}
          className="w-full bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-md"
        >
          {saving ? 'SALVANDO...' : 'SALVAR CHECK-IN OFFLINE'}
        </button>
      </div>
    </div>
  );
}
