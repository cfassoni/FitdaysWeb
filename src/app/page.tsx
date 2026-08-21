import { Activity, Flame, Scale, TrendingUp, TrendingDown, Calendar, ArrowUpRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard de Progresso
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhamento de composição corporal e métricas em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>Última medição: 20 Mar 2026</span>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Peso */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-diffused">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="label-caps">Peso Atual</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl display-metrics data-mono text-slate-900 dark:text-white">78.5</span>
            <span className="text-sm font-medium text-slate-400">kg</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>-1.2 kg nos últimos 30 dias</span>
          </div>
        </div>

        {/* Gordura Corporal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-diffused">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="label-caps">% Gordura</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl display-metrics data-mono text-slate-900 dark:text-white">18.5</span>
            <span className="text-sm font-medium text-slate-400">%</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>-0.8% evolução saudável</span>
          </div>
        </div>

        {/* Massa Muscular */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-diffused">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="label-caps">Massa Muscular</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl display-metrics data-mono text-slate-900 dark:text-white">60.5</span>
            <span className="text-sm font-medium text-slate-400">kg</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+0.5 kg de hipertrofia</span>
          </div>
        </div>

        {/* Pontuação Corporal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-diffused">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="label-caps">Score Corporal</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl display-metrics data-mono text-indigo-600 dark:text-indigo-400">88</span>
            <span className="text-sm font-medium text-slate-400">/ 100</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Classificação: Excelente</span>
          </div>
        </div>
      </div>

      {/* Progress & Target Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-diffused">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Metas & Controle</h2>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Peso Alvo: 75.0 kg</span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-medium mb-2">
                <span className="text-slate-600 dark:text-slate-400">Progresso do Peso</span>
                <span className="data-mono font-semibold text-slate-900 dark:text-white">78.5 kg / 75.0 kg (58%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: "58%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-2">
                <span className="text-slate-600 dark:text-slate-400">Controle de Gordura</span>
                <span className="data-mono font-semibold text-slate-900 dark:text-white">-2.0 kg restantes</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "70%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-2">
                <span className="text-slate-600 dark:text-slate-400">Controle Muscular</span>
                <span className="data-mono font-semibold text-slate-900 dark:text-white">+1.5 kg meta</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: "45%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary Tile */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-6 shadow-diffused flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">Visão Geral</span>
            <h3 className="text-xl font-bold mt-2 leading-snug">Recomposição em Ritmo Consistente</h3>
            <p className="text-sm text-indigo-100/90 mt-2 leading-relaxed">
              Você manteve o ganho de massa magra enquanto reduziu a gordura visceral nos últimos ciclos.
            </p>
          </div>
          <div className="pt-6 border-t border-indigo-500/40 mt-6 flex items-center justify-between text-xs font-medium">
            <span className="text-indigo-200">Taxa Metabólica Basal</span>
            <span className="data-mono font-bold text-white">1,750 kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
