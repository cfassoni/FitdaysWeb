import { Plus } from "lucide-react";

export default function NutritionPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Nutrição & Macros
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Planejamento calórico e distribuição de macronutrientes para recomposição.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition">
          <Plus className="w-4 h-4" />
          <span>Registrar Refeição</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-diffused">
          <span className="label-caps">Proteína</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl display-metrics data-mono text-slate-900 dark:text-white">160</span>
            <span className="text-sm font-medium text-slate-400">g / 180g</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: "88%" }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-diffused">
          <span className="label-caps">Carboidratos</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl display-metrics data-mono text-slate-900 dark:text-white">210</span>
            <span className="text-sm font-medium text-slate-400">g / 240g</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "87%" }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-diffused">
          <span className="label-caps">Gorduras</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl display-metrics data-mono text-slate-900 dark:text-white">55</span>
            <span className="text-sm font-medium text-slate-400">g / 65g</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: "84%" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
