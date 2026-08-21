"use server";

import { db } from "@/db/client";
import { recompRecords, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { parseFitdaysFile } from "@/lib/parser";

export async function importFitdaysData(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Não autorizado" };

  const file = formData.get("file") as File;
  if (!file) return { error: "Nenhum arquivo enviado" };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsedRecords = parseFitdaysFile(buffer);
    
    if (parsedRecords.length === 0) {
      return { error: "Nenhum dado válido encontrado no arquivo" };
    }

    // Insert records mapping to Drizzle schema
    const recordsToInsert = parsedRecords.map(r => ({
      userId: session.userId,
      date: r.date,
      weight: r.weight,
      bmi: r.bmi,
      bodyFatPct: r.bodyFatPct,
      subcutaneousFatPct: r.subcutaneousFatPct,
      heartRate: r.heartRate ?? null,
      heartIndex: r.heartIndex ?? null,
      visceralFat: r.visceralFat,
      bodyWaterPct: r.bodyWaterPct,
      skeletalMuscleMassPct: r.skeletalMuscleMassPct,
      muscleMass: r.muscleMass,
      boneMass: r.boneMass,
      proteinPct: r.proteinPct,
      bmr: r.bmr,
      metabolicAge: r.metabolicAge,
      fatMass: r.fatMass,
      moistureContent: r.moistureContent,
      skeletalMuscleMass: r.skeletalMuscleMass,
      muscleRatePct: r.muscleRatePct,
      proteinMass: r.proteinMass,
      obesityScore: r.obesityScore,
      fatFreeMass: r.fatFreeMass,
      smi: r.smi,
      bodyScore: r.bodyScore,
      targetWeight: r.targetWeight,
      weightControl: r.weightControl,
      fatControl: r.fatControl,
      muscleControl: r.muscleControl,

      // Segments
      rightArmFatMass: r.rightArmFatMass ?? null,
      rightArmFatPct: r.rightArmFatPct ?? null,
      rightArmFatLevel: r.rightArmFatLevel ?? null,
      rightArmMuscleMass: r.rightArmMuscleMass ?? null,
      rightArmMusclePct: r.rightArmMusclePct ?? null,
      rightArmMuscleLevel: r.rightArmMuscleLevel ?? null,
      rightArmImpedanceHigh: r.rightArmImpedanceHigh ?? null,
      rightArmImpedanceLow: r.rightArmImpedanceLow ?? null,

      leftArmFatMass: r.leftArmFatMass ?? null,
      leftArmFatPct: r.leftArmFatPct ?? null,
      leftArmFatLevel: r.leftArmFatLevel ?? null,
      leftArmMuscleMass: r.leftArmMuscleMass ?? null,
      leftArmMusclePct: r.leftArmMusclePct ?? null,
      leftArmMuscleLevel: r.leftArmMuscleLevel ?? null,
      leftArmImpedanceHigh: r.leftArmImpedanceHigh ?? null,
      leftArmImpedanceLow: r.leftArmImpedanceLow ?? null,

      trunkFatMass: r.trunkFatMass ?? null,
      trunkFatPct: r.trunkFatPct ?? null,
      trunkFatLevel: r.trunkFatLevel ?? null,
      trunkMuscleMass: r.trunkMuscleMass ?? null,
      trunkMusclePct: r.trunkMusclePct ?? null,
      trunkMuscleLevel: r.trunkMuscleLevel ?? null,
      trunkImpedanceHigh: r.trunkImpedanceHigh ?? null,
      trunkImpedanceLow: r.trunkImpedanceLow ?? null,

      rightLegFatMass: r.rightLegFatMass ?? null,
      rightLegFatPct: r.rightLegFatPct ?? null,
      rightLegFatLevel: r.rightLegFatLevel ?? null,
      rightLegMuscleMass: r.rightLegMuscleMass ?? null,
      rightLegMusclePct: r.rightLegMusclePct ?? null,
      rightLegMuscleLevel: r.rightLegMuscleLevel ?? null,
      rightLegImpedanceHigh: r.rightLegImpedanceHigh ?? null,
      rightLegImpedanceLow: r.rightLegImpedanceLow ?? null,

      leftLegFatMass: r.leftLegFatMass ?? null,
      leftLegFatPct: r.leftLegFatPct ?? null,
      leftLegFatLevel: r.leftLegFatLevel ?? null,
      leftLegMuscleMass: r.leftLegMuscleMass ?? null,
      leftLegMusclePct: r.leftLegMusclePct ?? null,
      leftLegMuscleLevel: r.leftLegMuscleLevel ?? null,
      leftLegImpedanceHigh: r.leftLegImpedanceHigh ?? null,
      leftLegImpedanceLow: r.leftLegImpedanceLow ?? null,
    }));

    // Insert all (In SQLite we can do a bulk insert, but sometimes we need to handle conflicts)
    // Drizzle SQLite bulk insert ignores conflicts if we use onConflictDoNothing
    await db.insert(recompRecords).values(recordsToInsert).onConflictDoNothing();

    return { success: `Importados ${recordsToInsert.length} registros com sucesso!` };
  } catch (err: any) {
    return { error: "Erro ao processar o arquivo: " + err.message };
  }
}
