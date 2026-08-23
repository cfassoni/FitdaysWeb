"use client";

import { useTranslation } from "react-i18next";
import "../lib/i18n";
import { Activity, Database, CheckCircle2, Layers } from "lucide-react";

export default function Home() {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-6 text-[var(--foreground)]">
      <main className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Recomp Pro</h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              Next.js Modular Monolith — Phase 0 Foundation
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--secondary)]/40 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold">Foundation Status</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Next.js 16 + Drizzle ORM + Tailwind v4 + i18n Active
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Ready
            </span>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)]">
              <Database className="h-4 w-4" />
              <span>Database Connection</span>
            </div>
            <p className="mt-1 font-mono text-xs text-[var(--foreground)]">
              Shared Volume: <code className="rounded bg-[var(--secondary)] px-1 py-0.5">fitdays-db-data (/app/data/fitdays.db)</code>
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)]">
                <Layers className="h-4 w-4" />
                <span>Active Language</span>
              </div>
              <div className="flex gap-1.5 text-xs">
                {["en", "pt", "es"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => i18n.changeLanguage(lang)}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                      i18n.language === lang
                        ? "bg-indigo-600 text-white"
                        : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              {t("app.title", "FitdaysWeb")} — {t("dashboard.title", "Dashboard")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
          <p>
            Legacy Application running concurrently at{" "}
            <a
              href="http://localhost"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-500 hover:underline"
            >
              http://localhost (Port 80)
            </a>
          </p>
          <p>Phase 1 will port all 33 backend endpoints into Next.js API Routes.</p>
        </div>
      </main>
    </div>
  );
}
