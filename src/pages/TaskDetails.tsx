import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { db } from '../store/db';
import { useState } from 'react';

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Mock data for MVP
  const task = {
    id: id || 'task_111',
    title: 'Montar tenda de triagem',
    description: 'Pegar as lonas no galpão e montar conforme o manual para iniciar o atendimento médico.',
    sop: {
      steps: [
        'Limpar a área de pedras e galhos.',
        'Erguer as 4 hastes principais e travar os pinos.',
        'Fixar a lona superior bem esticada.',
        'Bater as estacas de fixação no chão em um ângulo de 45 graus.'
      ],
      successCriteria: 'Tenda firme, sem rugas na lona e todas as estacas presas ao solo.',
      commonErrors: 'Não fixar as estacas no chão antes de erguer a tenda, causando instabilidade com o vento.'
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    await db.syncQueue.add({
      id: crypto.randomUUID(),
      type: 'SUBMIT_TASK',
      payload: { taskId: task.id, completedAt: new Date().toISOString() },
      status: 'PENDING',
      retryCount: 0,
      createdAt: Date.now(),
    });
    alert('Tarefa concluída e salva offline!');
    navigate('/tasks');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="text-gray-500 font-medium">Voltar</button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{task.title}</h2>
        <p className="text-gray-600 mt-2">{task.description}</p>
      </div>

      {task.sop && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-3">
              <Info size={18} /> Como fazer (Passo a Passo)
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
              {task.sop.steps.map((step, i) => (
                <li key={i} className="pl-1">{step}</li>
              ))}
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
              <AlertTriangle size={18} /> Erros Comuns
            </h3>
            <p className="text-sm text-amber-800">{task.sop.commonErrors}</p>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <h3 className="font-bold text-emerald-900 flex items-center gap-2 mb-2">
              <CheckCircle2 size={18} /> Critério de Conclusão
            </h3>
            <p className="text-sm text-emerald-800">{task.sop.successCriteria}</p>
          </div>
        </div>
      )}

      <button 
        onClick={handleComplete}
        disabled={saving}
        className="w-full bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition-colors shadow-md mt-6"
      >
        {saving ? 'SALVANDO...' : 'CONCLUIR TAREFA'}
      </button>
    </div>
  );
}
