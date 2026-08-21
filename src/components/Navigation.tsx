"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Activity, 
  Utensils, 
  Dumbbell, 
  User, 
  Flame,
  FileSpreadsheet
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/body-composition", label: "Bioimpedância", icon: Activity },
  { href: "/nutrition", label: "Nutrição", icon: Utensils },
  { href: "/activities", label: "Atividades", icon: Dumbbell },
  { href: "/profile", label: "Perfil & Metas", icon: User },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 min-h-screen">
      <div>
        {/* Logo / Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-indigo-200 shadow-md">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">
              Recomp <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">Core</span>
            </h1>
            <p className="text-xs text-slate-500">Body Analytics</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
                )}
              >
                <Icon className={clsx("w-4 h-4", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Quick Import Footer Tile */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-300">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">Importar Dados</p>
          <p className="text-[11px] text-slate-500 truncate">CSV / XLS Fitdays</p>
        </div>
      </div>
    </aside>
  );
}
