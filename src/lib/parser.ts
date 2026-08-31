import * as XLSX from "xlsx";

export function cleanFloat(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") {
    return isNaN(val) ? null : val;
  }
  const valStr = String(val).trim();
  if (!valStr || valStr === "-" || valStr === "- -" || valStr === "--") {
    return null;
  }
  const match = valStr.match(/^[\s]*(-?[0-9]+(?:\.[0-9]+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
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
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const str = String(val).trim();
  // Match "HH:mm dd/MM/yyyy" or "HH:mm dd-MM-yyyy"
  const matchTimeDate = str.match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (matchTimeDate) {
    const [, hours, minutes, day, month, year] = matchTimeDate;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
  }

  // Match "dd/MM/yyyy HH:mm" or "dd-MM-yyyy HH:mm"
  const matchDateTime = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (matchDateTime) {
    const [, day, month, year, hours, minutes] = matchDateTime;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
  }

  // Match "yyyy-MM-dd HH:mm:ss" or ISO strings
  const parsed = new Date(str.replace(" ", "T"));
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  const rawParsed = new Date(str);
  if (!isNaN(rawParsed.getTime())) {
    return rawParsed;
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

export function classifyColumn(col: string): string | null {
  const colLower = col.toLowerCase().trim();
  // Remove accents for normalized text matching, keep % and units
  const colNorm = colLower
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 1. Check segmentals first (Right/Left Arm, Trunk, Right/Left Leg)
  let segment: string | null = null;
  if (colNorm.includes("right arm") || colNorm.includes("braco direito") || colNorm.includes("right upper")) {
    segment = "right_arm";
  } else if (colNorm.includes("left arm") || colNorm.includes("braco esquerdo") || colNorm.includes("left upper")) {
    segment = "left_arm";
  } else if (colNorm.includes("trunk") || colNorm.includes("tronco")) {
    segment = "trunk";
  } else if (colNorm.includes("right leg") || colNorm.includes("perna direita") || colNorm.includes("right lower")) {
    segment = "right_leg";
  } else if (colNorm.includes("left leg") || colNorm.includes("perna esquerda") || colNorm.includes("left lower")) {
    segment = "left_leg";
  }

  if (segment) {
    if (colNorm.includes("gordura") || colNorm.includes("fat")) {
      return `${segment}_fat`;
    }
    if (colNorm.includes("equil") || colNorm.includes("musc") || colNorm.includes("muscle")) {
      return `${segment}_muscle`;
    }
    if (colNorm.includes("imped") || colNorm.includes("resistance") || colNorm.includes("resistencia")) {
      return `${segment}_impedance`;
    }
    return null;
  }

  // 2. Date & Time
  if (colNorm.includes("data") || colNorm.includes("date") || colNorm.includes("time of measurement") || colNorm.includes("hora")) {
    return "date";
  }

  // 3. Target & Control metrics
  if (colNorm.includes("peso-alvo") || colNorm.includes("peso alvo") || colNorm.includes("target weight")) {
    return "targetWeight";
  }
  if (colNorm.includes("controle de peso") || colNorm.includes("weight control")) {
    return "weightControl";
  }
  if (colNorm.includes("controle de gordura") || colNorm.includes("fat control")) {
    return "fatControl";
  }
  if (colNorm.includes("controle muscular") || colNorm.includes("muscle control")) {
    return "muscleControl";
  }

  // 4. Fat-free mass (Massa livre de gordura)
  if (colNorm.includes("massa livre de gordura") || colNorm.includes("fat-free") || colNorm.includes("fat free") || colNorm === "ffm") {
    return "fatFreeMass";
  }

  // 5. Skeletal Muscle (Percentage vs Mass in kg)
  const isSkeletalMuscle =
    colNorm.includes("esquelet") ||
    colNorm.includes("skeletal muscle") ||
    colNorm.includes("musculo esquel") ||
    colNorm.includes("musc. esquel") ||
    colNorm.includes("musc esquel");

  if (isSkeletalMuscle) {
    if (colLower.includes("%") || colNorm.includes("rate") || colNorm.includes("taxa")) {
      return "skeletalMuscleMassPct";
    }
    if (colLower.includes("kg") || colNorm.includes("mass") || colNorm.includes("massa")) {
      return "skeletalMuscleMass";
    }
    return "skeletalMuscleMassPct";
  }

  // 6. Muscle Rate (%) vs Total Muscle Mass (kg)
  if (colNorm.includes("taxa muscular") || colNorm.includes("muscle rate")) {
    return "muscleRatePct";
  }
  if (colNorm.includes("massa muscular") || colNorm.includes("muscle mass")) {
    return "muscleMass";
  }

  // 7. Fat & Subcutaneous & Visceral
  if (colNorm.includes("gordura subcut") || colNorm.includes("subcutaneous fat")) {
    return "subcutaneousFatPct";
  }
  if (colNorm.includes("gordura visceral") || colNorm.includes("visceral fat")) {
    return "visceralFat";
  }
  if (colNorm.includes("massa gorda") || (colNorm.includes("fat mass") && !colNorm.includes("fat-free"))) {
    return "fatMass";
  }
  if (colNorm.includes("gordura corporal") || colNorm.includes("body fat") || colNorm.includes("taxa de gordura")) {
    return "bodyFatPct";
  }

  // 8. Body Water (%) vs Moisture/Water Content (kg)
  if (colNorm.includes("teor de umidade") || colNorm.includes("moisture") || colNorm.includes("water content")) {
    return "moistureContent";
  }
  if (colNorm.includes("agua corporal") || colNorm.includes("body water")) {
    return "bodyWaterPct";
  }

  // 9. Bone Mass
  if (colNorm.includes("massa ossea") || colNorm.includes("bone mass")) {
    return "boneMass";
  }

  // 10. Protein Mass (kg) vs Protein (%)
  if (colNorm.includes("massa proteica") || colNorm.includes("protein mass")) {
    return "proteinMass";
  }
  if (colNorm.includes("proteina") || colNorm.includes("protein")) {
    return "proteinPct";
  }

  // 11. Heart & Vitals
  if (colNorm.includes("frequ") || colNorm.includes("heart rate") || colNorm.includes("pulse")) {
    return "heartRate";
  }
  if (colNorm.includes("cora") || colNorm.includes("cardiac index") || colNorm.includes("heart index") || colNorm.includes("indice cardiaco")) {
    return "heartIndex";
  }
  if (colNorm.includes("tmb") || colNorm.includes("bmr")) {
    return "bmr";
  }
  if (colNorm.includes("idade metab") || colNorm.includes("metabolic age")) {
    return "metabolicAge";
  }

  // 12. Scores & Body Composition Indices
  if (colNorm.includes("obesidade") || colNorm.includes("obesity")) {
    return "obesityScore";
  }
  if (colNorm.includes("smi")) {
    return "smi";
  }
  if (colNorm.includes("pontuacao corporal") || colNorm.includes("body score")) {
    return "bodyScore";
  }
  if (colNorm.includes("imc") || colNorm.includes("bmi")) {
    return "bmi";
  }
  if (colNorm.includes("peso") || colNorm.includes("weight")) {
    return "weight";
  }

  return null;
}

export function parseFitdaysFile(buffer: Buffer | Uint8Array | ArrayBuffer): ParsedRecompRecord[] {
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

  // Map headers dynamically
  const sampleRow = rows[0];
  const colMap: Record<string, string> = {};

  for (const col of Object.keys(sampleRow)) {
    const target = classifyColumn(col);
    if (target) {
      colMap[col] = target;
    }
  }

  const records: ParsedRecompRecord[] = [];

  for (const row of rows) {
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
      records.push(parsedRow as unknown as ParsedRecompRecord);
    }
  }

  return records;
}
