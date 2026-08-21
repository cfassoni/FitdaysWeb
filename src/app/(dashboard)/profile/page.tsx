import { User, Settings, Shield, Bell, Save } from "lucide-react";
import { getServerTranslations } from "@/i18n/server";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function ProfilePage() {
  const { t } = await getServerTranslations();
  const session = await getSession();
  if (!session) redirect("/login");

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) redirect("/login");

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("profile.title")}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t("profile.subtitle")}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-diffused space-y-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" />
          <span>{t("profile.personalData")}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-caps mb-1.5 block">{t("profile.displayName")}</label>
            <input
              type="text"
              defaultValue={user.displayName || ""}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="label-caps mb-1.5 block">{t("profile.email")}</label>
            <input
              type="email"
              defaultValue={user.email}
              disabled
              className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="label-caps mb-1.5 block">{t("profile.height")}</label>
            <input
              type="number"
              defaultValue={user.heightCm || ""}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="label-caps mb-1.5 block">{t("profile.targetWeight")}</label>
            <input
              type="number"
              defaultValue={user.targetWeightKg || 75.0}
              step="0.1"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition">
            <Save className="w-4 h-4" />
            <span>{t("profile.saveChanges")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
