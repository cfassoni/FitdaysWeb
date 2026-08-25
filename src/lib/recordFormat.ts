import { fitdaysRecords, fitdaysReports } from "@/db/schema";
import { safeToISOString } from "./dateUtils";
import path from "path";

export type RecordSelect = typeof fitdaysRecords.$inferSelect;
export type ReportSelect = typeof fitdaysReports.$inferSelect;

export function formatReportResponse(report: ReportSelect | null | undefined) {
  if (!report) return null;
  const filename = path.basename(report.filePath);
  return {
    id: report.id,
    record_id: report.recordId,
    filename: report.filename,
    mime_type: report.mimeType,
    file_size: report.fileSize,
    uploaded_at: safeToISOString(report.uploadedAt, true),
    url: `/uploads/reports/${filename}`,
  };
}

export function formatRecordResponse(
  record: RecordSelect,
  report?: ReportSelect | null
) {
  return {
    id: record.id,
    user_id: record.userId,
    date: safeToISOString(record.date, true),
    report: report !== undefined ? formatReportResponse(report) : undefined,

    // Core Weight / Body Metrics
    weight: record.weight,
    bmi: record.bmi,
    body_fat_pct: record.bodyFatPct,
    subcutaneous_fat_pct: record.subcutaneousFatPct,
    heart_rate: record.heartRate,
    heart_index: record.heartIndex,
    visceral_fat: record.visceralFat,
    body_water_pct: record.bodyWaterPct,
    skeletal_muscle_mass_pct: record.skeletalMuscleMassPct,
    muscle_mass: record.muscleMass,
    bone_mass: record.boneMass,
    protein_pct: record.proteinPct,
    bmr: record.bmr,
    metabolic_age: record.metabolicAge,
    fat_mass: record.fatMass,
    moisture_content: record.moistureContent,
    skeletal_muscle_mass: record.skeletalMuscleMass,
    muscle_rate_pct: record.muscleRatePct,
    protein_mass: record.proteinMass,
    obesity_score: record.obesityScore,
    fat_free_mass: record.fatFreeMass,
    smi: record.smi,
    body_score: record.bodyScore,
    target_weight: record.targetWeight,
    weight_control: record.weightControl,
    fat_control: record.fatControl,
    muscle_control: record.muscleControl,

    // Right Arm
    right_arm_fat_mass: record.rightArmFatMass,
    right_arm_fat_pct: record.rightArmFatPct,
    right_arm_fat_level: record.rightArmFatLevel,
    right_arm_muscle_mass: record.rightArmMuscleMass,
    right_arm_muscle_pct: record.rightArmMusclePct,
    right_arm_muscle_level: record.rightArmMuscleLevel,
    right_arm_impedance_high: record.rightArmImpedanceHigh,
    right_arm_impedance_low: record.rightArmImpedanceLow,

    // Left Arm
    left_arm_fat_mass: record.leftArmFatMass,
    left_arm_fat_pct: record.leftArmFatPct,
    left_arm_fat_level: record.leftArmFatLevel,
    left_arm_muscle_mass: record.leftArmMuscleMass,
    left_arm_muscle_pct: record.leftArmMusclePct,
    left_arm_muscle_level: record.leftArmMuscleLevel,
    left_arm_impedance_high: record.leftArmImpedanceHigh,
    left_arm_impedance_low: record.leftArmImpedanceLow,

    // Trunk
    trunk_fat_mass: record.trunkFatMass,
    trunk_fat_pct: record.trunkFatPct,
    trunk_fat_level: record.trunkFatLevel,
    trunk_muscle_mass: record.trunkMuscleMass,
    trunk_muscle_pct: record.trunkMusclePct,
    trunk_muscle_level: record.trunkMuscleLevel,
    trunk_impedance_high: record.trunkImpedanceHigh,
    trunk_impedance_low: record.trunkImpedanceLow,

    // Right Leg
    right_leg_fat_mass: record.rightLegFatMass,
    right_leg_fat_pct: record.rightLegFatPct,
    right_leg_fat_level: record.rightLegFatLevel,
    right_leg_muscle_mass: record.rightLegMuscleMass,
    right_leg_muscle_pct: record.rightLegMusclePct,
    right_leg_muscle_level: record.rightLegMuscleLevel,
    right_leg_impedance_high: record.rightLegImpedanceHigh,
    right_leg_impedance_low: record.rightLegImpedanceLow,

    // Left Leg
    left_leg_fat_mass: record.leftLegFatMass,
    left_leg_fat_pct: record.leftLegFatPct,
    left_leg_fat_level: record.leftLegFatLevel,
    left_leg_muscle_mass: record.leftLegMuscleMass,
    left_leg_muscle_pct: record.leftLegMusclePct,
    left_leg_muscle_level: record.leftLegMuscleLevel,
    left_leg_impedance_high: record.leftLegImpedanceHigh,
    left_leg_impedance_low: record.leftLegImpedanceLow,
  };
}
