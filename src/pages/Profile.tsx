import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/db';
import { CloudOff, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { useSyncQueue } from '../hooks/useSyncQueue';

export default function Profile() {
  const pendingSyncs = useLiveQuery(() => db.syncQueue.where('status').equals('PENDING').count(), []);
  const { user, isLeaderOrDelegate, activateDelegation } = useAuth();
  const { isSyncing, forceSync } = useSyncQueue();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleActivate = () => {
    if (activateDelegation(code)) {
      setError('');
      setCode('');
      alert('Delegação ativada com sucesso! Uma nova aba de Gestão foi liberada.');
    } else {
      setError('Código inválido ou expirado.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Perfil</h2>
      
      <div className="bg-surface rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {user?.name.charAt(0)}
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{user?.name}</h3>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="inline-block mt-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded uppercase font-medium">
            {user?.role}
          </span>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-2">Status de Sincronização</h3>
        <div className="flex items-center gap-3 text-gray-700">
          <div className={`p-3 rounded-full ${pendingSyncs && pendingSyncs > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {isSyncing ? (
              <RefreshCw size={24} className="animate-spin" />
            ) : pendingSyncs && pendingSyncs > 0 ? (
              <CloudOff size={24} />
            ) : (
              <CheckCircle size={24} />
            )}
          </div>
          <div>
            <p className="font-medium">{pendingSyncs || 0} itens pendentes</p>
            <p className="text-sm text-gray-500">
              {isSyncing ? 'Sincronizando agora...' : pendingSyncs && pendingSyncs > 0 ? 'Aguardando conexão com a internet' : 'Tudo sincronizado'}
            </p>
          </div>
        </div>
        {pendingSyncs && pendingSyncs > 0 ? (
          <button 
            onClick={forceSync}
            disabled={isSyncing || !navigator.onLine}
            className="mt-4 w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            {isSyncing ? 'Sincronizando...' : 'Tentar Sincronizar Agora'}
          </button>
        ) : null}
      </div>

      {!isLeaderOrDelegate && (
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <ShieldAlert size={20} className="text-primary" />
            Líder do Dia
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Se você recebeu uma delegação temporária, ative-a aqui usando o código fornecido pelo seu líder.
          </p>
          
          <div className="space-y-3">
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código de ativação (ex: 938-124)"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center tracking-widest focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
            {error && <p className="text-danger text-sm text-center">{error}</p>}
            <button 
              onClick={handleActivate}
              disabled={!code}
              className="w-full border-2 border-primary text-primary hover:bg-primary-light hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-primary font-bold py-3 rounded-xl transition-colors"
            >
              ATIVAR DELEGAÇÃO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
