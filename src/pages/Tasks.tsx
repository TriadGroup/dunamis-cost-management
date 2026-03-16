import { Link } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';

export default function Tasks() {
  const mockTasks = [
    { id: 'task_111', title: 'Montar tenda de triagem', dueDate: '09:00', priority: 'Alta' },
    { id: 'task_222', title: 'Organizar kits de doação', dueDate: '11:00', priority: 'Média' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Tarefas do Dia</h2>
      
      <div className="space-y-3">
        {mockTasks.map(task => (
          <Link key={task.id} to={`/tasks/${task.id}`} className="block bg-surface rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">{task.title}</h4>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                    <Clock size={12} /> Vence {task.dueDate}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm font-bold">
                    {task.priority}
                  </span>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
