import { AlertCircle } from 'lucide-react';

export default function Management() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestão do Dia</h2>
        <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Líder do Dia</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-gray-100 rounded-xl p-3 text-center shadow-sm">
          <span className="block text-2xl font-bold text-emerald-600">8</span>
          <span className="text-[10px] uppercase text-gray-500 font-bold">Presentes</span>
        </div>
        <div className="bg-surface border border-gray-100 rounded-xl p-3 text-center shadow-sm">
          <span className="block text-2xl font-bold text-amber-500">2</span>
          <span className="text-[10px] uppercase text-gray-500 font-bold">Atrasos</span>
        </div>
        <div className="bg-surface border border-gray-100 rounded-xl p-3 text-center shadow-sm">
          <span className="block text-2xl font-bold text-danger">1</span>
          <span className="text-[10px] uppercase text-gray-500 font-bold">Faltas</span>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-5 shadow-sm border border-gray-100 text-center">
        <p className="text-sm text-gray-500 mb-1">Código Offline de Hoje</p>
        <p className="text-3xl font-mono font-bold tracking-widest text-gray-900">ALFA77</p>
        <p className="text-xs text-gray-400 mt-2">Mostre este código para a equipe fazer check-in sem internet.</p>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Revisão Pendente</h3>
        <div className="bg-surface rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="flex justify-between items-start border-b border-gray-100 pb-3">
            <div>
              <h4 className="font-medium text-gray-900">Pedro Santos</h4>
              <p className="text-xs text-danger flex items-center gap-1 mt-1 font-medium">
                <AlertCircle size={12} /> Score: 60 (Foto sem EXIF)
              </p>
            </div>
            <div className="flex gap-2">
              <button className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium">Rejeitar</button>
              <button className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium">Aprovar</button>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500 py-2">
            Nenhuma outra pendência.
          </div>
        </div>
      </section>
    </div>
  );
}
