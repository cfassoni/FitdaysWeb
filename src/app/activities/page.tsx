import { Dumbbell, Plus, Flame } from "lucide-react";

export default function ActivitiesPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Atividades & Treinos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Registro de sessões de musculação, cardio e gasto calórico.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition">
          <Plus className="w-4 h-4" />
          <span>Novo Treino</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-diffused">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-indigo-600" />
          <span>Últimas Sessões</span>
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Treino A - Superiores (Peito / Tríceps)</p>
              <p className="text-xs text-slate-500">20 Mar 2026 • 55 min</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 data-mono">
              <Flame className="w-3.5 h-3.5" />
              <span>380 kcal</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Corrida Moderada na Esteira</p>
              <p className="text-xs text-slate-500">19 Mar 2026 • 30 min (5.0 km)</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 data-mono">
              <Flame className="w-3.5 h-3.5" />
              <span>295 kcal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
