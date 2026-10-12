import * as XLSX from "xlsx";
import { formatRecordDateKey, normalizeToMinute } from "./dateUtils";

export function cleanFloat(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") {
    return isNaN(val) ? null : val;
  }
  const valStr = String(val).trim();
  if (!valStr || valStr === "-" || valStr === "- -" || valStr === "--") {
    return null;
  }
  const match = valStr.match(/^[\s]*([+-]?[0-9]+(?:[.,][0-9]+)?)/);
  if (match) {
    const num = parseFloat(match[1].replace(",", "."));
    return isNaN(num) ? null : num;
  }
  return null;
}

export function parseSegmental(val: unknown): [number | null, number | null, string | null] {
  if (val === null || val === undefined) return [null, null, null];
  const valStr = String(val).trim();
  if (!valStr || valStr === "-" || valStr === "- -" || valStr === "--") {
    return [null, null, null];
  }
  const parts = valStr.split("/");
  if (parts.length < 3) {
    return [null, null, null];
  }
  const mass = cleanFloat(parts[0]);
  const pct = cleanFloat(parts[1]);
  const level = parts[2].trim() || null;
  return [mass, pct, level];
}

export function parseImpedance(val: unknown): [number | null, number | null] {
  if (val === null || val === undefined) return [null, null];
  const valStr = String(val).trim();
  if (!valStr || valStr === "-" || valStr === "- -" || valStr === "--") {
    return [null, null];
  }
  const parts = valStr.split("/");
  if (parts.length < 2) {
    return [null, null];
  }
  const high = cleanFloat(parts[0]);
  const low = cleanFloat(parts[1]);
  return [high, low];
}

export function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : normalizeToMinute(val);
  }

  let str = String(val).trim();
  if (!str) return null;

  // Normalize localized date/time prepositions ("às", "as", "a las", "à", "um", "at")
  str = str.replace(/\s+(?:[àa]s|a\s+las|[àa]|um|at)\s+/i, " ");
  str = str.replace(/\s+/g, " ");

  // Match "HH:mm[:ss] dd/MM/yyyy", "HH:mm[:ss] dd-MM-yyyy", or "HH:mm[:ss] dd.MM.yyyy"
  const matchTimeDate = str.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/
  );
  if (matchTimeDate) {
    const [, hours, minutes, , p1, p2, year] = matchTimeDate;
    let day = parseInt(p1, 10);
    let month = parseInt(p2, 10);
    if (month > 12 && day <= 12) {
      [day, month] = [month, day];
    }
    return new Date(
      Date.UTC(
        parseInt(year, 10),
        month - 1,
        day,
        parseInt(hours, 10),
        parseInt(minutes, 10),
        0,
        0
      )
    );
  }

  // Match "dd/MM/yyyy HH:mm[:ss]", "dd-MM-yyyy HH:mm[:ss]", or "dd.MM.yyyy HH:mm[:ss]"
  const matchDateTime = str.match(
    /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );
  if (matchDateTime) {
    const [, p1, p2, year, hours, minutes] = matchDateTime;
    let day = parseInt(p1, 10);
    let month = parseInt(p2, 10);
    if (month > 12 && day <= 12) {
      [day, month] = [month, day];
    }
    return new Date(
      Date.UTC(
        parseInt(year, 10),
        month - 1,
        day,
        parseInt(hours, 10),
        parseInt(minutes, 10),
        0,
        0
      )
    );
  }

  // Match "yyyy-MM-dd HH:mm[:ss]", "yyyy/MM/dd HH:mm[:ss]", or "yyyy.MM.dd HH:mm[:ss]" without explicit timezone offset
  const matchIsoWallClock = str.match(
    /^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/
  );
  if (matchIsoWallClock) {
    const [, year, month, day, hours, minutes] = matchIsoWallClock;
    return new Date(
      Date.UTC(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        parseInt(hours, 10),
        parseInt(minutes, 10),
        0,
        0
      )
    );
  }

  // Match ISO strings with explicit timezone (e.g. Z or +HH:MM)
  const parsed = new Date(str.replace(" ", "T"));
  if (!isNaN(parsed.getTime())) {
    return normalizeToMinute(parsed);
  }

  const rawParsed = new Date(str);
  if (!isNaN(rawParsed.getTime())) {
    return normalizeToMinute(rawParsed);
  }

  return null;
}

export interface ParsedRecompRecord {
  date: Date;
  weight: number;
  bmi: number;
  bodyFatPct: number;
  subcutaneousFatPct: number;
  heartRate?: number | null;
  heartIndex?: number | null;
  visceralFat: number;
  bodyWaterPct: number;
  skeletalMuscleMassPct: number;
  muscleMass: number;
  boneMass: number;
  proteinPct: number;
  bmr: number;
  metabolicAge: number;
  fatMass: number;
  moistureContent: number;
  skeletalMuscleMass: number;
  muscleRatePct: number;
  proteinMass: number;
  obesityScore: number;
  fatFreeMass: number;
  smi: number;
  bodyScore: number;
  targetWeight: number;
  weightControl: number;
  fatControl: number;
  muscleControl: number;

  rightArmFatMass?: number | null;
  rightArmFatPct?: number | null;
  rightArmFatLevel?: string | null;
  rightArmMuscleMass?: number | null;
  rightArmMusclePct?: number | null;
  rightArmMuscleLevel?: string | null;
  rightArmImpedanceHigh?: number | null;
  rightArmImpedanceLow?: number | null;

  leftArmFatMass?: number | null;
  leftArmFatPct?: number | null;
  leftArmFatLevel?: string | null;
  leftArmMuscleMass?: number | null;
  leftArmMusclePct?: number | null;
  leftArmMuscleLevel?: string | null;
  leftArmImpedanceHigh?: number | null;
  leftArmImpedanceLow?: number | null;

  trunkFatMass?: number | null;
  trunkFatPct?: number | null;
  trunkFatLevel?: string | null;
  trunkMuscleMass?: number | null;
  trunkMusclePct?: number | null;
  trunkMuscleLevel?: string | null;
  trunkImpedanceHigh?: number | null;
  trunkImpedanceLow?: number | null;

  rightLegFatMass?: number | null;
  rightLegFatPct?: number | null;
  rightLegFatLevel?: string | null;
  rightLegMuscleMass?: number | null;
  rightLegMusclePct?: number | null;
  rightLegMuscleLevel?: string | null;
  rightLegImpedanceHigh?: number | null;
  rightLegImpedanceLow?: number | null;

  leftLegFatMass?: number | null;
  leftLegFatPct?: number | null;
  leftLegFatLevel?: string | null;
  leftLegMuscleMass?: number | null;
  leftLegMusclePct?: number | null;
  leftLegMuscleLevel?: string | null;
  leftLegImpedanceHigh?: number | null;
  leftLegImpedanceLow?: number | null;
}

/**
 * Standard 28 general biometric columns exported by Fitdays scales with heart-rate sensors.
 */
export const POSITIONAL_GENERAL_28: readonly string[] = [
  "date",                  // 0
  "weight",                // 1
  "bmi",                   // 2
  "bodyFatPct",            // 3
  "subcutaneousFatPct",    // 4
  "heartRate",             // 5
  "heartIndex",            // 6
  "visceralFat",           // 7
  "bodyWaterPct",          // 8
  "skeletalMuscleMassPct", // 9
  "muscleMass",            // 10
  "boneMass",              // 11
  "proteinPct",            // 12
  "bmr",                   // 13
  "metabolicAge",          // 14
  "fatMass",               // 15
  "moistureContent",       // 16
  "skeletalMuscleMass",    // 17
  "muscleRatePct",         // 18
  "proteinMass",           // 19
  "obesityScore",          // 20
  "fatFreeMass",           // 21
  "smi",                   // 22
  "bodyScore",             // 23
  "targetWeight",          // 24
  "weightControl",         // 25
  "fatControl",            // 26
  "muscleControl",         // 27
];

/**
 * Standard 26 general biometric columns exported by Fitdays scales without heart-rate sensors
 * (omits heartRate and heartIndex at indices 5 and 6).
 */
export const POSITIONAL_GENERAL_26: readonly string[] = POSITIONAL_GENERAL_28.filter(
  (field) => field !== "heartRate" && field !== "heartIndex"
);

/**
 * Standard 15 segmental columns exported by 8-electrode Fitdays scales
 * (5 segmental fat + 5 segmental muscle + 5 segmental bioelectrical impedance).
 */
export const POSITIONAL_SEGMENTAL_15: readonly string[] = [
  "right_arm_fat",
  "left_arm_fat",
  "trunk_fat",
  "right_leg_fat",
  "left_leg_fat",
  "right_arm_muscle",
  "left_arm_muscle",
  "trunk_muscle",
  "right_leg_muscle",
  "left_leg_muscle",
  "right_arm_impedance",
  "left_arm_impedance",
  "trunk_impedance",
  "right_leg_impedance",
  "left_leg_impedance",
];

/**
 * Tier 1: Semantic and unit-aware header classification supporting PT, EN, ES, and universal biometric tokens.
 */
export function classifyColumn(col: string, sampleVal?: unknown): string | null {
  const colLower = col.toLowerCase().trim();
  // Remove accents for normalized text matching, keep % and units
  const colNorm = colLower
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const sampleLower =
    sampleVal !== null && sampleVal !== undefined ? String(sampleVal).toLowerCase().trim() : "";

  const hasPct = colLower.includes("%") || sampleLower.includes("%");
  const hasKg =
    (colLower.includes("kg") && !colLower.includes("kg/m")) ||
    (sampleLower.includes("kg") && !sampleLower.includes("kg/m"));

  // 1. Check segmentals first (Right/Left Arm, Trunk, Right/Left Leg in EN, PT, ES)
  let segment: string | null = null;
  if (
    colNorm.includes("right arm") ||
    colNorm.includes("braco direito") ||
    colNorm.includes("brazo derecho") ||
    colNorm.includes("right upper")
  ) {
    segment = "right_arm";
  } else if (
    colNorm.includes("left arm") ||
    colNorm.includes("braco esquerdo") ||
    colNorm.includes("brazo izquierdo") ||
    colNorm.includes("left upper")
  ) {
    segment = "left_arm";
  } else if (colNorm.includes("trunk") || colNorm.includes("tronco")) {
    segment = "trunk";
  } else if (
    colNorm.includes("right leg") ||
    colNorm.includes("perna direita") ||
    colNorm.includes("pierna derecha") ||
    colNorm.includes("right lower")
  ) {
    segment = "right_leg";
  } else if (
    colNorm.includes("left leg") ||
    colNorm.includes("perna esquerda") ||
    colNorm.includes("pierna izquierda") ||
    colNorm.includes("left lower")
  ) {
    segment = "left_leg";
  }

  if (segment) {
    if (colNorm.includes("gordura") || colNorm.includes("grasa") || colNorm.includes("fat")) {
      return `${segment}_fat`;
    }
    if (colNorm.includes("equil") || colNorm.includes("musc") || colNorm.includes("muscle")) {
      return `${segment}_muscle`;
    }
    if (
      colNorm.includes("imped") ||
      colNorm.includes("bioeletric") ||
      colNorm.includes("bioelectric") ||
      colNorm.includes("resistance") ||
      colNorm.includes("resistencia")
    ) {
      return `${segment}_impedance`;
    }
    return null;
  }

  // 2. Date & Time (PT, EN, ES)
  if (
    colNorm.includes("data") ||
    colNorm.includes("date") ||
    colNorm.includes("fecha") ||
    colNorm.includes("time of measurement") ||
    colNorm.includes("tiempo de medicion") ||
    colNorm.includes("hora") ||
    colNorm.includes("timestamp")
  ) {
    return "date";
  }

  // 3. Target & Control metrics (PT, EN, ES)
  if (
    colNorm.includes("peso-alvo") ||
    colNorm.includes("peso alvo") ||
    colNorm.includes("target weight") ||
    colNorm.includes("peso objetivo") ||
    colNorm.includes("peso meta") ||
    colNorm.includes("peso ideal") ||
    colNorm.includes("peso recomendado")
  ) {
    return "targetWeight";
  }
  if (
    colNorm.includes("controle de peso") ||
    colNorm.includes("control de peso") ||
    colNorm.includes("weight control")
  ) {
    return "weightControl";
  }
  if (
    colNorm.includes("controle de gordura") ||
    colNorm.includes("control de grasa") ||
    colNorm.includes("fat control")
  ) {
    return "fatControl";
  }
  if (
    colNorm.includes("controle muscular") ||
    colNorm.includes("control muscular") ||
    colNorm.includes("control de musculo") ||
    colNorm.includes("muscle control")
  ) {
    return "muscleControl";
  }

  // 4. Fat-free mass (PT, EN, ES)
  if (
    colNorm.includes("massa livre de gordura") ||
    colNorm.includes("masa libre de grasa") ||
    colNorm.includes("peso sin grasa") ||
    colNorm.includes("masa magra") ||
    colNorm.includes("massa magra") ||
    colNorm.includes("fat-free") ||
    colNorm.includes("fat free") ||
    colNorm === "ffm"
  ) {
    return "fatFreeMass";
  }

  // 5. Skeletal Muscle (Percentage vs Mass in kg)
  const isSkeletalMuscle =
    colNorm.includes("esquelet") ||
    colNorm.includes("skeletal muscle") ||
    colNorm.includes("musculo esquel") ||
    colNorm.includes("musc. esquel") ||
    colNorm.includes("musc esquel") ||
    colNorm.includes("m. esquel");

  if (isSkeletalMuscle) {
    if (
      hasPct ||
      colNorm.includes("rate") ||
      colNorm.includes("taxa") ||
      colNorm.includes("tasa") ||
      colNorm.includes("porcentaje")
    ) {
      return "skeletalMuscleMassPct";
    }
    if (hasKg) {
      return "skeletalMuscleMass";
    }
    // Disambiguation when units are omitted from both header and sample value:
    // In PT/ES Fitdays exports, "Massa/Masa Musc. Esquelética" represents % and "Músculo esquelético" represents kg mass
    if (
      colNorm.includes("musc") &&
      (colNorm.includes("massa") || colNorm.includes("masa") || colNorm.includes("taxa") || colNorm.includes("tasa"))
    ) {
      return "skeletalMuscleMassPct";
    }
    if (colNorm.includes("musculo") && !colNorm.includes("massa") && !colNorm.includes("masa")) {
      return "skeletalMuscleMass";
    }
    if (colNorm.includes("mass") || colNorm.includes("massa") || colNorm.includes("masa")) {
      return "skeletalMuscleMass";
    }
    return "skeletalMuscleMassPct";
  }

  // 6. Muscle Rate (%) vs Total Muscle Mass (kg)
  if (
    colNorm.includes("taxa muscular") ||
    colNorm.includes("tasa muscular") ||
    colNorm.includes("porcentaje muscular") ||
    colNorm.includes("muscle rate")
  ) {
    return "muscleRatePct";
  }
  if (
    colNorm.includes("massa muscular") ||
    colNorm.includes("masa muscular") ||
    colNorm.includes("muscle mass")
  ) {
    if (hasPct) {
      return "muscleRatePct";
    }
    return "muscleMass";
  }

  // 7. Fat & Subcutaneous & Visceral
  if (
    colNorm.includes("gordura subcut") ||
    colNorm.includes("grasa subcut") ||
    colNorm.includes("subcutaneous fat") ||
    colNorm.includes("subcutanea")
  ) {
    return "subcutaneousFatPct";
  }
  if (
    colNorm.includes("gordura visceral") ||
    colNorm.includes("grasa visceral") ||
    colNorm.includes("visceral fat") ||
    colNorm.includes("visceral")
  ) {
    return "visceralFat";
  }
  if (
    colNorm.includes("massa gorda") ||
    colNorm.includes("masa grasa") ||
    colNorm.includes("masa de grasa") ||
    (colNorm.includes("fat mass") && !colNorm.includes("fat-free"))
  ) {
    return "fatMass";
  }
  if (
    colNorm.includes("gordura corporal") ||
    colNorm.includes("grasa corporal") ||
    colNorm.includes("body fat") ||
    colNorm.includes("taxa de gordura") ||
    colNorm.includes("tasa de grasa") ||
    colNorm.includes("porcentaje de grasa")
  ) {
    if (hasKg && !hasPct) {
      return "fatMass";
    }
    return "bodyFatPct";
  }

  // 8. Body Water (%) vs Moisture/Water Content (kg)
  if (
    colNorm.includes("teor de umidade") ||
    colNorm.includes("contenido de humedad") ||
    colNorm.includes("contenido de agua") ||
    colNorm.includes("humedad") ||
    colNorm.includes("moisture") ||
    colNorm.includes("water content")
  ) {
    return "moistureContent";
  }
  if (
    colNorm.includes("agua corporal") ||
    colNorm.includes("body water") ||
    colNorm.includes("hidratacion")
  ) {
    if (hasKg && !hasPct) {
      return "moistureContent";
    }
    return "bodyWaterPct";
  }

  // 9. Bone Mass
  if (
    colNorm.includes("massa ossea") ||
    colNorm.includes("masa osea") ||
    colNorm.includes("bone mass") ||
    colNorm.includes("hueso")
  ) {
    return "boneMass";
  }

  // 10. Protein Mass (kg) vs Protein (%)
  if (
    colNorm.includes("massa proteica") ||
    colNorm.includes("masa proteica") ||
    colNorm.includes("protein mass")
  ) {
    return "proteinMass";
  }
  if (colNorm.includes("proteina") || colNorm.includes("protein")) {
    if (hasKg && !hasPct) {
      return "proteinMass";
    }
    return "proteinPct";
  }

  // 11. Heart & Vitals
  if (
    colNorm.includes("frequ") ||
    colNorm.includes("frecuencia cardiaca") ||
    colNorm.includes("ritmo cardiaco") ||
    colNorm.includes("pulsaciones") ||
    colNorm.includes("heart rate") ||
    colNorm.includes("pulse") ||
    colNorm === "bpm"
  ) {
    return "heartRate";
  }
  if (
    colNorm.includes("cora") ||
    colNorm.includes("cardiac index") ||
    colNorm.includes("heart index") ||
    colNorm.includes("indice cardiaco")
  ) {
    return "heartIndex";
  }
  if (
    colNorm.includes("tmb") ||
    colNorm.includes("bmr") ||
    colNorm.includes("metabolismo basal") ||
    colNorm.includes("tasa metabolica basal")
  ) {
    return "bmr";
  }
  if (
    colNorm.includes("idade metab") ||
    colNorm.includes("edad metab") ||
    colNorm.includes("edad del cuerpo") ||
    colNorm.includes("metabolic age") ||
    colNorm.includes("body age")
  ) {
    return "metabolicAge";
  }

  // 12. Scores & Body Composition Indices
  if (
    colNorm.includes("obesidade") ||
    colNorm.includes("obesidad") ||
    colNorm.includes("obesity")
  ) {
    return "obesityScore";
  }
  if (colNorm.includes("smi") || colNorm.includes("imce")) {
    return "smi";
  }
  if (
    colNorm.includes("pontuacao corporal") ||
    colNorm.includes("puntuacion corporal") ||
    colNorm.includes("puntaje corporal") ||
    colNorm.includes("calificacion corporal") ||
    colNorm.includes("body score")
  ) {
    return "bodyScore";
  }
  if (
    colNorm.includes("imc") ||
    colNorm.includes("bmi") ||
    colNorm.includes("indice de masa corporal") ||
    colNorm.includes("indice de massa corporal")
  ) {
    return "bmi";
  }
  if (colNorm.includes("peso") || colNorm.includes("weight")) {
    return "weight";
  }

  return null;
}

/**
 * Tier 2: Resolves a positional column template for the 4 official Fitdays export profiles:
 * - 43 columns: 28 general metrics (with HR & Heart Index) + 15 segmental columns
 * - 41 columns: 26 general metrics (without HR & Heart Index) + 15 segmental columns
 * - 28 columns: 28 general metrics (with HR & Heart Index, 4-electrode scale)
 * - 26 columns: 26 general metrics (without HR & Heart Index, 4-electrode scale)
 *
 * Also inspects unit tokens on the adjacent obesityScore / fatFreeMass pair to handle
 * app versions that swap their order.
 */
export function resolvePositionalTemplate(
  columns: string[],
  getSampleValue: (col: string) => unknown
): string[] | null {
  let baseTemplate: string[] | null = null;

  if (columns.length === 43) {
    baseTemplate = [...POSITIONAL_GENERAL_28, ...POSITIONAL_SEGMENTAL_15];
  } else if (columns.length === 41) {
    baseTemplate = [...POSITIONAL_GENERAL_26, ...POSITIONAL_SEGMENTAL_15];
  } else if (columns.length === 28) {
    baseTemplate = [...POSITIONAL_GENERAL_28];
  } else if (columns.length === 26) {
    baseTemplate = [...POSITIONAL_GENERAL_26];
  }

  if (!baseTemplate) {
    return null;
  }

  const idxObesity = baseTemplate.indexOf("obesityScore");
  const idxFfm = baseTemplate.indexOf("fatFreeMass");
  if (idxObesity !== -1 && idxFfm !== -1) {
    const colObesity = columns[idxObesity];
    const colFfm = columns[idxFfm];
    const sampleObesity = String(getSampleValue(colObesity) ?? "").toLowerCase();
    const sampleFfm = String(getSampleValue(colFfm) ?? "").toLowerCase();
    const textObesity = `${colObesity.toLowerCase()} ${sampleObesity}`;
    const textFfm = `${colFfm.toLowerCase()} ${sampleFfm}`;

    const obesityHasKg = textObesity.includes("kg") && !textObesity.includes("kg/m");
    const ffmHasKg = textFfm.includes("kg") && !textFfm.includes("kg/m");

    // If the slot expected for obesityScore carries "kg" while fatFreeMass slot does not, swap them
    if (obesityHasKg && !ffmHasKg) {
      baseTemplate[idxObesity] = "fatFreeMass";
      baseTemplate[idxFfm] = "obesityScore";
    }
  }

  return baseTemplate;
}

const KG_METRIC_TARGETS = new Set([
  "weight",
  "muscleMass",
  "boneMass",
  "fatMass",
  "moistureContent",
  "skeletalMuscleMass",
  "proteinMass",
  "fatFreeMass",
  "targetWeight",
  "weightControl",
  "fatControl",
  "muscleControl",
]);

const PCT_METRIC_TARGETS = new Set([
  "bodyFatPct",
  "subcutaneousFatPct",
  "bodyWaterPct",
  "skeletalMuscleMassPct",
  "proteinPct",
  "muscleRatePct",
]);

/**
 * Tier 3: Validates structural unit compatibility and physiological bounds to prevent
 * misaligned or corrupted spreadsheets from silently importing bad data.
 */
function validateColumnUnitsAndSamples(
  colMap: Record<string, string>,
  getSampleValue: (col: string) => unknown
): void {
  for (const [col, target] of Object.entries(colMap)) {
    const sampleVal = getSampleValue(col);
    if (sampleVal === undefined || sampleVal === null) continue;

    const sampleStr = String(sampleVal).toLowerCase().trim();
    if (!sampleStr || sampleStr === "-" || sampleStr === "- -" || sampleStr === "--") {
      continue;
    }

    const hasPct = sampleStr.includes("%");
    const hasKg = sampleStr.includes("kg") && !sampleStr.includes("kg/m");
    const hasKcal = sampleStr.includes("kcal");

    if (KG_METRIC_TARGETS.has(target) && (hasPct || hasKcal)) {
      throw new Error(
        `Sanity check failed: column "${col}" mapped to mass metric "${target}" contains incompatible unit in sample value "${sampleVal}".`
      );
    }

    if (PCT_METRIC_TARGETS.has(target) && (hasKg || hasKcal)) {
      throw new Error(
        `Sanity check failed: column "${col}" mapped to percentage metric "${target}" contains incompatible unit in sample value "${sampleVal}".`
      );
    }

    if (target === "bmr" && (hasPct || hasKg)) {
      throw new Error(
        `Sanity check failed: column "${col}" mapped to BMR contains incompatible unit in sample value "${sampleVal}".`
      );
    }

    if (target.endsWith("_fat") || target.endsWith("_muscle")) {
      const [mass, pct] = parseSegmental(sampleVal);
      if (!sampleStr.includes("/") || mass === null || pct === null || mass < 0 || pct < 0) {
        throw new Error(
          `Sanity check failed: column "${col}" mapped to segmental metric "${target}" has invalid format "${sampleVal}" (expected "mass / pct / level").`
        );
      }
    }

    if (target.endsWith("_impedance")) {
      const [high, low] = parseImpedance(sampleVal);
      if (
        !sampleStr.includes("/") ||
        hasPct ||
        hasKg ||
        high === null ||
        low === null ||
        high <= 0 ||
        low <= 0
      ) {
        throw new Error(
          `Sanity check failed: column "${col}" mapped to segmental impedance "${target}" has invalid format "${sampleVal}" (expected "high / low").`
        );
      }
    }
  }
}

function validatePhysiologicalRanges(
  parsedRow: Record<string, unknown>,
  rowIndex: number
): void {
  const weight = parsedRow.weight;
  if (typeof weight === "number" && (weight < 10 || weight > 500)) {
    throw new Error(
      `Sanity check failed at row ${rowIndex + 1}: weight (${weight} kg) is outside plausible physiological range (10–500 kg).`
    );
  }

  const bmi = parsedRow.bmi;
  if (typeof bmi === "number" && bmi !== 0 && (bmi < 5 || bmi > 100)) {
    throw new Error(
      `Sanity check failed at row ${rowIndex + 1}: BMI (${bmi}) is outside plausible physiological range (5–100).`
    );
  }

  const bodyFatPct = parsedRow.bodyFatPct;
  if (typeof bodyFatPct === "number" && bodyFatPct !== 0 && (bodyFatPct < 1 || bodyFatPct > 85)) {
    throw new Error(
      `Sanity check failed at row ${rowIndex + 1}: body fat percentage (${bodyFatPct}%) is outside plausible physiological range (1–85%).`
    );
  }

  const bodyWaterPct = parsedRow.bodyWaterPct;
  if (typeof bodyWaterPct === "number" && bodyWaterPct !== 0 && (bodyWaterPct < 15 || bodyWaterPct > 90)) {
    throw new Error(
      `Sanity check failed at row ${rowIndex + 1}: body water percentage (${bodyWaterPct}%) is outside plausible physiological range (15–90%).`
    );
  }

  const bmr = parsedRow.bmr;
  if (typeof bmr === "number" && bmr !== 0 && (bmr < 300 || bmr > 10000)) {
    throw new Error(
      `Sanity check failed at row ${rowIndex + 1}: BMR (${bmr} kcal) is outside plausible physiological range (300–10000 kcal).`
    );
  }
}

export function parseRecompFile(buffer: Buffer | Uint8Array | ArrayBuffer): ParsedRecompRecord[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("No sheets found in uploaded file");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  if (rows.length === 0) {
    return [];
  }

  const columns = Object.keys(rows[0]);
  const colMap: Record<string, string> = {};
  const usedTargets = new Set<string>();

  const getSampleValue = (col: string): unknown => {
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const val = rows[i]?.[col];
      if (val !== null && val !== undefined) {
        const s = String(val).trim();
        if (s && s !== "-" && s !== "- -" && s !== "--") {
          return val;
        }
      }
    }
    return undefined;
  };

  // Tier 1: Semantic & Unit-Token Header Classification (PT, EN, ES + universal acronyms)
  for (const col of columns) {
    const sampleVal = getSampleValue(col);
    const target = classifyColumn(col, sampleVal);
    if (target && !usedTargets.has(target)) {
      colMap[col] = target;
      usedTargets.add(target);
    }
  }

  // Tier 2: Hybrid Positional Template Fallback for unmapped columns in 26, 28, 41, or 43-column profiles
  let usedPositionalFallback = false;
  if (Object.keys(colMap).length < columns.length) {
    const positionalTemplate = resolvePositionalTemplate(columns, getSampleValue);
    if (positionalTemplate) {
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const posTarget = positionalTemplate[i];
        if (!colMap[col] && posTarget && !usedTargets.has(posTarget)) {
          colMap[col] = posTarget;
          usedTargets.add(posTarget);
          usedPositionalFallback = true;
        }
      }
    }
  }

  // Tier 3A: Verify required core columns were identified
  if (!usedTargets.has("date") || !usedTargets.has("weight")) {
    throw new Error(
      `Unsupported spreadsheet format: could not identify required columns (Date, Weight) semantically and column count (${columns.length}) does not match any supported Fitdays export profile (26, 28, 41, or 43 columns).`
    );
  }

  if (usedPositionalFallback && (!usedTargets.has("bmi") || !usedTargets.has("bodyFatPct"))) {
    throw new Error(
      "Sanity check failed: positional template mapping is missing required core biometric columns (BMI, Body Fat %)."
    );
  }

  // Tier 3B: Validate structural and unit compatibility across mapped columns
  validateColumnUnitsAndSamples(colMap, getSampleValue);

  const records: ParsedRecompRecord[] = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const parsedRow: Record<string, unknown> = {};

    for (const [original, target] of Object.entries(colMap)) {
      const val = row[original];

      if (target === "date") {
        parsedRow[target] = parseDate(val);
      } else if (target.endsWith("_impedance")) {
        const prefix = target.replace("_impedance", "");
        const [high, low] = parseImpedance(val);
        const camelPrefix = prefix.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
        parsedRow[`${camelPrefix}ImpedanceHigh`] = high;
        parsedRow[`${camelPrefix}ImpedanceLow`] = low;
      } else if (target.endsWith("_fat")) {
        const prefix = target.replace("_fat", "");
        const [mass, pct, level] = parseSegmental(val);
        const camelPrefix = prefix.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
        parsedRow[`${camelPrefix}FatMass`] = mass;
        parsedRow[`${camelPrefix}FatPct`] = pct;
        parsedRow[`${camelPrefix}FatLevel`] = level;
      } else if (target.endsWith("_muscle")) {
        const prefix = target.replace("_muscle", "");
        const [mass, pct, level] = parseSegmental(val);
        const camelPrefix = prefix.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
        parsedRow[`${camelPrefix}MuscleMass`] = mass;
        parsedRow[`${camelPrefix}MusclePct`] = pct;
        parsedRow[`${camelPrefix}MuscleLevel`] = level;
      } else if (target === "obesityScore") {
        const num = cleanFloat(val);
        parsedRow[target] = num !== null ? Math.round(num) : null;
      } else {
        parsedRow[target] = cleanFloat(val);
      }
    }

    if (parsedRow.date instanceof Date && typeof parsedRow.weight === "number") {
      // Tier 3C: Validate physiological bounds for every valid measurement row
      validatePhysiologicalRanges(parsedRow, rowIndex);
      records.push(parsedRow as unknown as ParsedRecompRecord);
    }
  }

  if (usedPositionalFallback && records.length === 0) {
    throw new Error(
      "Sanity check failed: no valid measurement records (with valid Date and Weight) could be parsed using positional template."
    );
  }

  return deduplicateParsedRecords(records);
}

/**
 * Deduplicates parsed records in-memory by canonical minute timestamp ("YYYY-MM-DD HH:MM:00").
 * When multiple rows in the same file share the same minute timestamp, later rows overwrite earlier ones.
 */
export function deduplicateParsedRecords(records: ParsedRecompRecord[]): ParsedRecompRecord[] {
  const byDateKey = new Map<string, ParsedRecompRecord>();

  for (const rec of records) {
    const normalizedDate = normalizeToMinute(rec.date);
    const key = formatRecordDateKey(normalizedDate);
    if (!key) continue;
    byDateKey.set(key, {
      ...rec,
      date: normalizedDate,
    });
  }

  return Array.from(byDateKey.values());
}
