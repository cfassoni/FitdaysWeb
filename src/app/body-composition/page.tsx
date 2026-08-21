import { Upload, Table, Layers } from "lucide-react";

export default function BodyCompositionPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bioimpedância & Histórico
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Análise segmentar detalhada (membros e tronco) e evolução temporal.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition">
          <Upload className="w-4 h-4" />
          <span>Importar Nova Medição</span>
        </button>
      </div>

      {/* Segmental Analysis Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-diffused">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Análise Segmentar</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Braço Direito */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="label-caps">Braço Direito</span>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-500">Gordura: <span className="font-semibold text-slate-800 dark:text-slate-200">1.2 kg (12%)</span></p>
              <p className="text-xs text-slate-500">Músculo: <span className="font-semibold text-slate-800 dark:text-slate-200">3.5 kg (105%)</span></p>
            </div>
            <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Normal
            </span>
          </div>

          {/* Braço Esquerdo */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="label-caps">Braço Esquerdo</span>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-500">Gordura: <span className="font-semibold text-slate-800 dark:text-slate-200">1.2 kg (12%)</span></p>
              <p className="text-xs text-slate-500">Músculo: <span className="font-semibold text-slate-800 dark:text-slate-200">3.4 kg (103%)</span></p>
            </div>
            <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Normal
            </span>
          </div>

          {/* Tronco */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="label-caps">Tronco</span>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-500">Gordura: <span className="font-semibold text-slate-800 dark:text-slate-200">7.8 kg (16%)</span></p>
              <p className="text-xs text-slate-500">Músculo: <span className="font-semibold text-slate-800 dark:text-slate-200">28.2 kg (101%)</span></p>
            </div>
            <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Normal
            </span>
          </div>

          {/* Perna Direita */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="label-caps">Perna Direita</span>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-500">Gordura: <span className="font-semibold text-slate-800 dark:text-slate-200">2.1 kg (14%)</span></p>
              <p className="text-xs text-slate-500">Músculo: <span className="font-semibold text-slate-800 dark:text-slate-200">9.8 kg (106%)</span></p>
            </div>
            <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Normal
            </span>
          </div>

          {/* Perna Esquerda */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="label-caps">Perna Esquerda</span>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-500">Gordura: <span className="font-semibold text-slate-800 dark:text-slate-200">2.2 kg (14%)</span></p>
              <p className="text-xs text-slate-500">Músculo: <span className="font-semibold text-slate-800 dark:text-slate-200">9.7 kg (105%)</span></p>
            </div>
            <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Normal
            </span>
          </div>
        </div>
      </div>

      {/* History Table Placeholder */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-diffused">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Table className="w-4 h-4 text-indigo-600" />
          <span>Histórico de Medições</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Data</th>
                <th className="pb-3 font-semibold">Peso (kg)</th>
                <th className="pb-3 font-semibold">IMC</th>
                <th className="pb-3 font-semibold">Gordura (%)</th>
                <th className="pb-3 font-semibold">Massa Magra (kg)</th>
                <th className="pb-3 font-semibold">Gordura Visceral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 data-mono">
              <tr>
                <td className="py-3 font-sans">20/03/2026 06:37</td>
                <td className="py-3 font-semibold">78.5</td>
                <td className="py-3">24.2</td>
                <td className="py-3 text-rose-600 dark:text-rose-400">18.5%</td>
                <td className="py-3 text-emerald-600 dark:text-emerald-400">60.5</td>
                <td className="py-3">6</td>
              </tr>
              <tr>
                <td className="py-3 font-sans">15/02/2026 07:12</td>
                <td className="py-3 font-semibold">79.7</td>
                <td className="py-3">24.6</td>
                <td className="py-3 text-rose-600 dark:text-rose-400">19.3%</td>
                <td className="py-3 text-emerald-600 dark:text-emerald-400">60.0</td>
                <td className="py-3">7</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
