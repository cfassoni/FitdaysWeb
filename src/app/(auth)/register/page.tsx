"use client";

import { register } from "@/app/actions/auth";
import { Flame } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function RegisterPage() {
  const { t } = useTranslation();
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    return register(formData);
  }, null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-slate-950 p-4 relative">
      <div className="absolute top-6 right-6">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-diffused">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-indigo-200 shadow-md mb-4">
            <Flame className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("auth.registerTitle")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("auth.registerSubtitle")}</p>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="p-3 bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 text-sm rounded-xl">
              {state.error}
            </div>
          )}
          
          <div>
            <label className="label-caps mb-1.5 block">{t("auth.nameLabel")}</label>
            <input
              name="displayName"
              type="text"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{t("auth.emailLabel")}</label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{t("auth.passwordLabel")}</label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
            />
          </div>
          <button
            disabled={isPending}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50 mt-2"
          >
            {isPending ? t("auth.registering") : t("auth.registerButton")}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
            {t("auth.loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
