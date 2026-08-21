import { Activity, Flame, Scale, TrendingUp, TrendingDown, Calendar, ArrowUpRight } from "lucide-react";
import { getServerTranslations } from "@/i18n/server";
import { db } from "@/db/client";
import { recompRecords, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { t } = await getServerTranslations();
  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch user settings
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  
  // Fetch latest 2 records for trend calculation
  const latestRecords = await db.select()
    .from(recompRecords)
    .where(eq(recompRecords.userId, session.userId))
    .orderBy(desc(recompRecords.date))
    .limit(2);

  const current = latestRecords[0];
  const previous = latestRecords[1];

  const targetWeight = user?.targetWeightKg || 75.0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>
        {current && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{t("dashboard.lastMeasurement")}: {new Date(current.date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {!current ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-slate-500">Nenhum dado encontrado. Use o botão "Importar Dados" no menu lateral.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-diffused">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="label-caps">{t("dashboard.currentWeight")}</span>
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl display-metrics data-mono text-slate-900 dark:text-white">{current.weight.toFixed(1)}</span>
                <span className="text-sm font-medium text-slate-400">kg</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-diffused">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="label-caps">{t("dashboard.bodyFat")}</span>
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl display-metrics data-mono text-slate-900 dark:text-white">{current.bodyFatPct.toFixed(1)}</span>
                <span className="text-sm font-medium text-slate-400">%</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-diffused">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="label-caps">{t("dashboard.muscleMass")}</span>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl display-metrics data-mono text-slate-900 dark:text-white">{current.muscleMass.toFixed(1)}</span>
                <span className="text-sm font-medium text-slate-400">kg</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-diffused">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="label-caps">{t("dashboard.bodyScore")}</span>
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl display-metrics data-mono text-indigo-600 dark:text-indigo-400">{current.bodyScore}</span>
                <span className="text-sm font-medium text-slate-400">/ 100</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-diffused">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t("dashboard.targetsAndControl")}</h2>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{t("dashboard.targetWeight")}: {targetWeight} kg</span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-2">
                    <span className="text-slate-600 dark:text-slate-400">{t("dashboard.weightProgress")}</span>
                    <span className="data-mono font-semibold text-slate-900 dark:text-white">{current.weight.toFixed(1)} kg</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: "50%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-2">
                    <span className="text-slate-600 dark:text-slate-400">{t("dashboard.fatControl")}</span>
                    <span className="data-mono font-semibold text-slate-900 dark:text-white">{current.fatControl.toFixed(1)} kg</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "50%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-2">
                    <span className="text-slate-600 dark:text-slate-400">{t("dashboard.muscleControl")}</span>
                    <span className="data-mono font-semibold text-slate-900 dark:text-white">{current.muscleControl.toFixed(1)} kg</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "50%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-6 shadow-diffused flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">{t("dashboard.overview")}</span>
                <h3 className="text-xl font-bold mt-2 leading-snug">{t("dashboard.consistentRhythm")}</h3>
                <p className="text-sm text-indigo-100/90 mt-2 leading-relaxed">
                  {t("dashboard.overviewDesc")}
                </p>
              </div>
              <div className="pt-6 border-t border-indigo-500/40 mt-6 flex items-center justify-between text-xs font-medium">
                <span className="text-indigo-200">{t("dashboard.bmr")}</span>
                <span className="data-mono font-bold text-white">{current.bmr} kcal</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
