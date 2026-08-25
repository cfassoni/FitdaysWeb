import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { parseFitdaysFile } from "@/lib/parser";
import { db } from "@/db/client";
import { fitdaysRecords } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const POST = withAuth(async (req, { user }) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ detail: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let parsedRecords;
    try {
      parsedRecords = parseFitdaysFile(buffer);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { detail: `Failed to parse Fitdays file: ${message}` },
        { status: 400 }
      );
    }

    if (!parsedRecords || parsedRecords.length === 0) {
      return NextResponse.json(
        { detail: "No valid Fitdays records found in the uploaded file" },
        { status: 400 }
      );
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const rec of parsedRecords) {
      const recordPayload = {
        weight: rec.weight ?? 0,
        bmi: rec.bmi ?? 0,
        bodyFatPct: rec.bodyFatPct ?? 0,
        subcutaneousFatPct: rec.subcutaneousFatPct ?? 0,
        heartRate: rec.heartRate ?? null,
        heartIndex: rec.heartIndex ?? null,
        visceralFat: rec.visceralFat ?? 0,
        bodyWaterPct: rec.bodyWaterPct ?? 0,
        skeletalMuscleMassPct: rec.skeletalMuscleMassPct ?? 0,
        muscleMass: rec.muscleMass ?? 0,
        boneMass: rec.boneMass ?? 0,
        proteinPct: rec.proteinPct ?? 0,
        bmr: rec.bmr ?? 0,
        metabolicAge: rec.metabolicAge ?? 0,
        fatMass: rec.fatMass ?? 0,
        moistureContent: rec.moistureContent ?? 0,
        skeletalMuscleMass: rec.skeletalMuscleMass ?? 0,
        muscleRatePct: rec.muscleRatePct ?? 0,
        proteinMass: rec.proteinMass ?? 0,
        obesityScore: rec.obesityScore ?? 0,
        fatFreeMass: rec.fatFreeMass ?? 0,
        smi: rec.smi ?? 0,
        bodyScore: rec.bodyScore ?? 0,
        targetWeight: rec.targetWeight ?? 0,
        weightControl: rec.weightControl ?? 0,
        fatControl: rec.fatControl ?? 0,
        muscleControl: rec.muscleControl ?? 0,

        rightArmFatMass: rec.rightArmFatMass ?? null,
        rightArmFatPct: rec.rightArmFatPct ?? null,
        rightArmFatLevel: rec.rightArmFatLevel ?? null,
        rightArmMuscleMass: rec.rightArmMuscleMass ?? null,
        rightArmMusclePct: rec.rightArmMusclePct ?? null,
        rightArmMuscleLevel: rec.rightArmMuscleLevel ?? null,
        rightArmImpedanceHigh: rec.rightArmImpedanceHigh ?? null,
        rightArmImpedanceLow: rec.rightArmImpedanceLow ?? null,

        leftArmFatMass: rec.leftArmFatMass ?? null,
        leftArmFatPct: rec.leftArmFatPct ?? null,
        leftArmFatLevel: rec.leftArmFatLevel ?? null,
        leftArmMuscleMass: rec.leftArmMuscleMass ?? null,
        leftArmMusclePct: rec.leftArmMusclePct ?? null,
        leftArmMuscleLevel: rec.leftArmMuscleLevel ?? null,
        leftArmImpedanceHigh: rec.leftArmImpedanceHigh ?? null,
        leftArmImpedanceLow: rec.leftArmImpedanceLow ?? null,

        trunkFatMass: rec.trunkFatMass ?? null,
        trunkFatPct: rec.trunkFatPct ?? null,
        trunkFatLevel: rec.trunkFatLevel ?? null,
        trunkMuscleMass: rec.trunkMuscleMass ?? null,
        trunkMusclePct: rec.trunkMusclePct ?? null,
        trunkMuscleLevel: rec.trunkMuscleLevel ?? null,
        trunkImpedanceHigh: rec.trunkImpedanceHigh ?? null,
        trunkImpedanceLow: rec.trunkImpedanceLow ?? null,

        rightLegFatMass: rec.rightLegFatMass ?? null,
        rightLegFatPct: rec.rightLegFatPct ?? null,
        rightLegFatLevel: rec.rightLegFatLevel ?? null,
        rightLegMuscleMass: rec.rightLegMuscleMass ?? null,
        rightLegMusclePct: rec.rightLegMusclePct ?? null,
        rightLegMuscleLevel: rec.rightLegMuscleLevel ?? null,
        rightLegImpedanceHigh: rec.rightLegImpedanceHigh ?? null,
        rightLegImpedanceLow: rec.rightLegImpedanceLow ?? null,

        leftLegFatMass: rec.leftLegFatMass ?? null,
        leftLegFatPct: rec.leftLegFatPct ?? null,
        leftLegFatLevel: rec.leftLegFatLevel ?? null,
        leftLegMuscleMass: rec.leftLegMuscleMass ?? null,
        leftLegMusclePct: rec.leftLegMusclePct ?? null,
        leftLegMuscleLevel: rec.leftLegMuscleLevel ?? null,
        leftLegImpedanceHigh: rec.leftLegImpedanceHigh ?? null,
        leftLegImpedanceLow: rec.leftLegImpedanceLow ?? null,
      };

      const existing = await db.query.fitdaysRecords.findFirst({
        where: and(
          eq(fitdaysRecords.userId, user.id),
          eq(fitdaysRecords.date, rec.date)
        ),
      });

      if (existing) {
        await db
          .update(fitdaysRecords)
          .set(recordPayload)
          .where(eq(fitdaysRecords.id, existing.id));

        updatedCount += 1;
      } else {
        await db.insert(fitdaysRecords).values({
          userId: user.id,
          date: rec.date,
          ...recordPayload,
        });

        insertedCount += 1;
      }
    }

    return NextResponse.json(
      {
        message: "File processed successfully",
        inserted: insertedCount,
        updated: updatedCount,
        total_processed: parsedRecords.length,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { detail: "An error occurred while processing the uploaded file" },
      { status: 500 }
    );
  }
});
