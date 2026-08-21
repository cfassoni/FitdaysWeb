import { Upload, Table, Layers } from "lucide-react";
import { getServerTranslations } from "@/i18n/server";
import { db } from "@/db/client";
import { recompRecords } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function BodyCompositionPage() {
  const { t } = await getServerTranslations();
  const session = await getSession();
  if (!session) redirect("/login");

  const records = await db.select()
    .from(recompRecords)
    .where(eq(recompRecords.userId, session.userId))
    .orderBy(desc(recompRecords.date));

  const current = records[0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("bodyComposition.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("bodyComposition.subtitle")}
          </p>
        </div>
      </div>

      {!current ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-slate-500">Nenhum dado encontrado.</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-diffused">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>{t("bodyComposition.segmentalAnalysis")}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Braço Direito */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="label-caps">{t("bodyComposition.rightArm")}</span>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-500">{t("bodyComposition.fat")}: <span className="font-semibold text-slate-800 dark:text-slate-200">{current.rightArmFatMass} kg ({current.rightArmFatPct}%)</span></p>
                  <p className="text-xs text-slate-500">{t("bodyComposition.muscle")}: <span className="font-semibold text-slate-800 dark:text-slate-200">{current.rightArmMuscleMass} kg ({current.rightArmMusclePct}%)</span></p>
                </div>
                <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {current.rightArmMuscleLevel || "Normal"}
                </span>
              </div>

              {/* Braço Esquerdo */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="label-caps">{t("bodyComposition.leftArm")}</span>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-500">{t("bodyComposition.fat")}: <span className="font-semibold text-slate-800 dark:text-slate-200">{current.leftArmFatMass} kg ({current.leftArmFatPct}%)</span></p>
                  <p className="text-xs text-slate-500">{t("bodyComposition.muscle")}: <span className="font-semibold text-slate-800 dark:text-slate-200">{current.leftArmMuscleMass} kg ({current.leftArmMusclePct}%)</span></p>
                </div>
                <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {current.leftArmMuscleLevel || "Normal"}
                </span>
              </div>

              {/* Tronco */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="label-caps">{t("bodyComposition.trunk")}</span>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-500">{t("bodyComposition.fat")}: <span className="font-semibold text-slate-800 dark:text-slate-200">{current.trunkFatMass} kg ({current.trunkFatPct}%)</span></p>
                  <p className="text-xs text-slate-500">{t("bodyComposition.muscle")}: <span className="font-semibold text-slate-800 dark:text-slate-200">{current.trunkMuscleMass} kg ({current.trunkMusclePct}%)</span></p>
                </div>
                <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {current.trunkMuscleLevel || "Normal"}
                </span>
              </div>

              {/* Perna Direita */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="label-caps">{t("bodyComposition.rightLeg")}</span>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-500">{t("bodyComposition.fat")}: <span className="font-semibold text-slate-800 dark:text-slate-200">{current.rightLegFatMass} kg ({current.rightLegFatPct}%)</span></p>
                  <p className="text-xs text-slate-500">{t("bodyComposition.muscle")}: <span className="font-semibold text-slate-800 dark:text-slate-200">{current.rightLegMuscleMass} kg ({current.rightLegMusclePct}%)</span></p>
                </div>
                <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {current.rightLegMuscleLevel || "Normal"}
                </span>
              </div>

              {/* Perna Esquerda */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="label-caps">{t("bodyComposition.leftLeg")}</span>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-500">{t("bodyComposition.fat")}: <span className="font-semibold text-slate-800 dark:text-slate-200">{current.leftLegFatMass} kg ({current.leftLegFatPct}%)</span></p>
                  <p className="text-xs text-slate-500">{t("bodyComposition.muscle")}: <span className="font-semibold text-slate-800 dark:text-slate-200">{current.leftLegMuscleMass} kg ({current.leftLegMusclePct}%)</span></p>
                </div>
                <span className="inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {current.leftLegMuscleLevel || "Normal"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-diffused">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-600" />
              <span>{t("bodyComposition.history")}</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">{t("bodyComposition.date")}</th>
                    <th className="pb-3 font-semibold">{t("bodyComposition.weight")}</th>
                    <th className="pb-3 font-semibold">{t("bodyComposition.bmi")}</th>
                    <th className="pb-3 font-semibold">{t("bodyComposition.bodyFatPct")}</th>
                    <th className="pb-3 font-semibold">{t("bodyComposition.leanMass")}</th>
                    <th className="pb-3 font-semibold">{t("bodyComposition.visceralFat")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 data-mono">
                  {records.map(r => (
                    <tr key={r.id}>
                      <td className="py-3 font-sans">{new Date(r.date).toLocaleString()}</td>
                      <td className="py-3 font-semibold">{r.weight}</td>
                      <td className="py-3">{r.bmi}</td>
                      <td className="py-3 text-rose-600 dark:text-rose-400">{r.bodyFatPct}%</td>
                      <td className="py-3 text-emerald-600 dark:text-emerald-400">{r.muscleMass}</td>
                      <td className="py-3">{r.visceralFat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
