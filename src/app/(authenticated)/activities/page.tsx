"use client";

import { notFound } from "next/navigation";
import { Flame, Activity, Dumbbell, Zap, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ActivitiesMockupPage() {
  const { enableWipPages } = useAuth();
  if (!enableWipPages) {
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
                Workouts & Activities
              </h1>
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Mockup Preview
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Strength training volume, cardiovascular exertion, and energy expenditure tracking.
            </p>
          </div>
        </div>

        {/* WIP Notice Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Work In Progress Feature</p>
            <p className="text-xs opacity-90 mt-0.5">
              This is a static design preview (mockup). Hevy workouts integration and activity logging will be added in upcoming phases.
            </p>
          </div>
        </div>

        {/* Metric Cards Mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
              <span>Weekly Workouts</span>
              <Dumbbell className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">4 sessions</div>
            <p className="text-xs text-muted-foreground mt-1">Target: 4-5 sessions</p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
              <span>Total Volume</span>
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">34,250 kg</div>
            <p className="text-xs text-muted-foreground mt-1">+12% vs last week</p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
              <span>Active Energy</span>
              <Flame className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">580 kcal/day</div>
            <p className="text-xs text-muted-foreground mt-1">Average daily burn</p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
              <span>Training Intensity</span>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">RPE 8.2</div>
            <p className="text-xs text-muted-foreground mt-1">Optimal stimulus</p>
          </div>
        </div>

        {/* Feature Teaser Card */}
        <div className="p-8 rounded-2xl border border-border bg-card/60 flex flex-col items-center justify-center text-center space-y-4 py-16">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Flame className="h-7 w-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Hypertrophy & Strength Correlation</h3>
            <p className="text-xs text-muted-foreground">
              Cross-correlate your lifting progression and workout volume directly against skeletal muscle growth trends from your body scans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
