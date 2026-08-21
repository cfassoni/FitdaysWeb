"use client";

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { languages, cookieName } from "@/i18n/settings";
import { useRouter } from "next/navigation";

export function LanguageSelector({ variant = "default" }: { variant?: "default" | "compact" }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    document.cookie = `${cookieName}=${lng}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  const currentLng = i18n.language || "pt";

  return (
    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium">
      <div className="px-1.5 text-slate-400">
        <Globe className="w-3.5 h-3.5" />
      </div>
      {languages.map((lng) => {
        const isActive = currentLng.startsWith(lng);
        return (
          <button
            key={lng}
            type="button"
            onClick={() => handleLanguageChange(lng)}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              isActive
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            {lng.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
