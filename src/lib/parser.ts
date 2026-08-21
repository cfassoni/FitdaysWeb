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
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
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
    const colLower = col.toLowerCase().trim();
    // Remove accents and special characters
    const colClean = colLower
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "");

    // Check segmentals
    let segment: string | null = null;
    for (const s of ["right arm", "left arm", "trunk", "right leg", "left leg"]) {
      if (colClean.includes(s)) {
        segment = s.replace(/\s+/g, "_");
        break;
      }
    }

    if (segment) {
      if (colClean.includes("gordura") || colClean.includes("fat")) {
        colMap[col] = `${segment}_fat`;
      } else if (colClean.includes("equil") || colClean.includes("musc")) {
        colMap[col] = `${segment}_muscle`;
      } else if (colClean.includes("imped")) {
        colMap[col] = `${segment}_impedance`;
      }
    } else {
      if (colClean.includes("data") || colClean.includes("date") || colClean.includes("time")) {
        colMap[col] = "date";
      } else if (colClean.includes("peso-alvo") || colClean.includes("target weight")) {
        colMap[col] = "targetWeight";
      } else if (colClean.includes("controle de peso") || colClean.includes("weight control")) {
        colMap[col] = "weightControl";
      } else if (colClean.includes("controle de gordura") || colClean.includes("fat control")) {
        colMap[col] = "fatControl";
      } else if (colClean.includes("controle muscular") || colClean.includes("muscle control")) {
        colMap[col] = "muscleControl";
      } else if (colClean.includes("peso") || colClean.includes("weight")) {
        colMap[col] = "weight";
      } else if (colClean.includes("imc") || colClean.includes("bmi")) {
        colMap[col] = "bmi";
      } else if (colClean.includes("gordura corporal") || colClean.includes("body fat")) {
        colMap[col] = "bodyFatPct";
      } else if (colClean.includes("gordura subcut") || colClean.includes("subcutaneous fat")) {
        colMap[col] = "subcutaneousFatPct";
      } else if (colClean.includes("frequ") || colClean.includes("heart rate")) {
        colMap[col] = "heartRate";
      } else if (colClean.includes("cora") || colClean.includes("heart index")) {
        colMap[col] = "heartIndex";
      } else if (colClean.includes("gordura visceral") || colClean.includes("visceral fat")) {
        colMap[col] = "visceralFat";
      } else if (colClean.includes("agua corporal") || colClean.includes("body water") || colClean.includes("agua")) {
        colMap[col] = "bodyWaterPct";
      } else if (colClean.includes("massa musc  esquel") || colClean.includes("massa musc esquel") || colClean.includes("musc  esquel") || colClean.includes("skeletal muscle %")) {
        colMap[col] = "skeletalMuscleMassPct";
      } else if (colClean.includes("massa muscular") || colClean.includes("muscle mass")) {
        colMap[col] = "muscleMass";
      } else if (colClean.includes("massa ossea") || colClean.includes("bone mass")) {
        colMap[col] = "boneMass";
      } else if (colClean.includes("proteina") || colClean.includes("protein")) {
        colMap[col] = "proteinPct";
      } else if (colClean.includes("tmb") || colClean.includes("bmr")) {
        colMap[col] = "bmr";
      } else if (colClean.includes("idade metab") || colClean.includes("metabolic age")) {
        colMap[col] = "metabolicAge";
      } else if (colClean.includes("massa gorda") || colClean.includes("fat mass")) {
        colMap[col] = "fatMass";
      } else if (colClean.includes("teor de umidade") || colClean.includes("moisture")) {
        colMap[col] = "moistureContent";
      } else if (colClean.includes("musculo esquel") || colClean.includes("skeletal muscle mass")) {
        colMap[col] = "skeletalMuscleMass";
      } else if (colClean.includes("taxa muscular") || colClean.includes("muscle rate")) {
        colMap[col] = "muscleRatePct";
      } else if (colClean.includes("massa proteica") || colClean.includes("protein mass")) {
        colMap[col] = "proteinMass";
      } else if (colClean.includes("obesidade") || colClean.includes("obesity")) {
        colMap[col] = "obesityScore";
      } else if (colClean.includes("massa livre de gordura") || colClean.includes("fat free mass")) {
        colMap[col] = "fatFreeMass";
      } else if (colClean.includes("smi")) {
        colMap[col] = "smi";
      } else if (colClean.includes("pontuacao corporal") || colClean.includes("body score")) {
        colMap[col] = "bodyScore";
      }
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
