import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db/client";
import { fitdaysRecords } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const GET = withAuth(async (req, { user }) => {
  try {
    const records = await db.query.fitdaysRecords.findMany({
      where: eq(fitdaysRecords.userId, user.id),
      orderBy: [asc(fitdaysRecords.date)],
    });

    const totalRecords = records.length;
    if (totalRecords === 0) {
      return NextResponse.json({
        total_records: 0,
        weight_history: [],
      });
    }

    const first = records[0];
    const last = records[records.length - 1];

    const weightHistory = records.map((r) => ({
      date: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
      weight: r.weight,
      body_fat_pct: r.bodyFatPct,
      body_fat_mass: r.fatMass,
      muscle_mass: r.muscleMass,
      skeletal_muscle_mass: r.skeletalMuscleMass,
      skeletal_muscle_mass_pct: r.skeletalMuscleMassPct,
    }));

    const round2 = (num: number) => Math.round(num * 100) / 100;

    return NextResponse.json({
      total_records: totalRecords,
      first_record_date: first.date ? new Date(first.date).toISOString() : null,
      latest_record_date: last.date ? new Date(last.date).toISOString() : null,
      starting_weight: first.weight,
      current_weight: last.weight,
      weight_change: round2(last.weight - first.weight),
      starting_body_fat: first.bodyFatPct,
      current_body_fat: last.bodyFatPct,
      body_fat_change: round2(last.bodyFatPct - first.bodyFatPct),
      starting_body_fat_mass: first.fatMass,
      current_body_fat_mass: last.fatMass,
      body_fat_mass_change: round2(last.fatMass - first.fatMass),
      starting_muscle_mass: first.muscleMass,
      current_muscle_mass: last.muscleMass,
      muscle_mass_change: round2(last.muscleMass - first.muscleMass),
      starting_skeletal_muscle_mass: first.skeletalMuscleMass,
      current_skeletal_muscle_mass: last.skeletalMuscleMass,
      skeletal_muscle_mass_change: round2(last.skeletalMuscleMass - first.skeletalMuscleMass),
      starting_skeletal_muscle_mass_pct: first.skeletalMuscleMassPct,
      current_skeletal_muscle_mass_pct: last.skeletalMuscleMassPct,
      skeletal_muscle_mass_pct_change: round2(last.skeletalMuscleMassPct - first.skeletalMuscleMassPct),
      weight_history: weightHistory,
    });
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json(
      { detail: "An error occurred while calculating summary" },
      { status: 500 }
    );
  }
});
