import { MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Atividade Atual</h2>
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Ação Social Centro</h3>
              <div className="flex items-center text-gray-500 text-sm mt-1 gap-3">
                <span className="flex items-center gap-1"><Clock size={14} /> 08:00 - 18:00</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> Base SP</span>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-1 rounded-full">Aberta</span>
          </div>
          
          <button 
            onClick={() => navigate('/check-in')}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-xl transition-colors flex justify-center items-center gap-2 text-lg shadow-md active:scale-[0.98]"
          >
            FAZER CHECK-IN
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Funciona sem internet. Será sincronizado depois.
          </p>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Minhas Tarefas</h2>
          <button onClick={() => navigate('/tasks')} className="text-sm text-primary font-medium">Ver todas</button>
        </div>
        <div className="space-y-3">
          {/* Placeholder Task */}
          <div 
            onClick={() => navigate('/tasks/task_111')}
            className="bg-surface rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer active:bg-gray-50 transition-colors"
          >
            <div>
              <h4 className="font-medium text-gray-900">Montar tenda de triagem</h4>
              <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                <Clock size={12} /> Vence 09:00
              </p>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
