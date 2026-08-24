"use client";

import { notFound } from "next/navigation";
import { UtensilsCrossed, PieChart, Apple, Info } from "lucide-react";
import { isWipPagesEnabled } from "@/lib/featureFlags";

export default function NutritionMockupPage() {
  const showWipPages = isWipPagesEnabled();
  if (!showWipPages) {
    notFound();
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Nutrition & Macros
              </h1>
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Mockup Preview
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Calorie expenditure, macronutrient targets, and dietary tracking synced with body composition goals.
            </p>
          </div>
        </div>

        {/* WIP Notice Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Work In Progress Feature</p>
            <p className="text-xs opacity-90 mt-0.5">
              This is a static design preview (mockup). Live sync with nutrition trackers and diet logging will be available in future releases.
            </p>
          </div>
        </div>

        {/* Metric Cards Mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
              <span>Daily Target</span>
              <Apple className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">2,450 kcal</div>
            <p className="text-xs text-muted-foreground mt-1">Maintenance: 2,750 kcal</p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
              <span>Protein Target</span>
              <span className="text-xs font-bold text-emerald-500">2.0g/kg</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">165 g</div>
            <p className="text-xs text-muted-foreground mt-1">660 kcal (27%)</p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
              <span>Carbohydrates</span>
              <PieChart className="h-4 w-4 text-violet-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">245 g</div>
            <p className="text-xs text-muted-foreground mt-1">980 kcal (40%)</p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
              <span>Fats</span>
              <PieChart className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">90 g</div>
            <p className="text-xs text-muted-foreground mt-1">810 kcal (33%)</p>
          </div>
        </div>

        {/* Feature Teaser Card */}
        <div className="p-8 rounded-2xl border border-border bg-card/60 flex flex-col items-center justify-center text-center space-y-4 py-16">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <UtensilsCrossed className="h-7 w-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Smart Calorie & Macro Planning</h3>
            <p className="text-xs text-muted-foreground">
              Intelligent nutrition adjustments calculated dynamically based on your weekly lean muscle mass changes and body fat percentage trends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
