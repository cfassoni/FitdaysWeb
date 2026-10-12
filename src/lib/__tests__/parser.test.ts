import { describe, it, expect } from "vitest";
import {
  cleanFloat,
  parseSegmental,
  parseImpedance,
  parseDate,
  parseRecompFile,
  classifyColumn,
  deduplicateParsedRecords,
} from "../parser";
import { formatRecordDateKey } from "../dateUtils";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

describe("Parser Utilities", () => {
  it("cleanFloat should parse valid floats, ints, strings and handle edge cases", () => {
    expect(cleanFloat(12.5)).toBe(12.5);
    expect(cleanFloat(" 80.4 kg ")).toBe(80.4);
    expect(cleanFloat("-")).toBeNull();
    expect(cleanFloat("- -")).toBeNull();
    expect(cleanFloat("--")).toBeNull();
    expect(cleanFloat(null)).toBeNull();
    expect(cleanFloat(undefined)).toBeNull();
  });

  it("parseSegmental should parse mass/pct/level", () => {
    expect(parseSegmental("2.8kg / 14.5% / Normal")).toEqual([2.8, 14.5, "Normal"]);
    expect(parseSegmental("-")).toEqual([null, null, null]);
    expect(parseSegmental(null)).toEqual([null, null, null]);
  });

  it("parseImpedance should parse high/low impedance", () => {
    expect(parseImpedance("420.5 / 380.2")).toEqual([420.5, 380.2]);
    expect(parseImpedance("-")).toEqual([null, null]);
  });

  it("parseDate should handle multiple date formats and normalize to UTC minute precision", () => {
    const d1 = parseDate("06:37 20/03/2026");
    expect(d1).not.toBeNull();
    expect(d1?.getUTCFullYear()).toBe(2026);
    expect(d1?.getUTCMonth()).toBe(2); // 0-indexed March
    expect(d1?.getUTCDate()).toBe(20);
    expect(d1?.getUTCHours()).toBe(6);
    expect(d1?.getUTCMinutes()).toBe(37);
    expect(d1?.getUTCSeconds()).toBe(0);

    // Different formats and seconds precision for the same minute should produce the exact same timestamp
    const d2 = parseDate("06:37:45 20/03/2026");
    const d3 = parseDate("20/03/2026 06:37:12");
    const d4 = parseDate("2026-03-20 06:37:59");
    expect(formatRecordDateKey(d1)).toBe("2026-03-20 06:37:00");
    expect(formatRecordDateKey(d2)).toBe("2026-03-20 06:37:00");
    expect(formatRecordDateKey(d3)).toBe("2026-03-20 06:37:00");
    expect(formatRecordDateKey(d4)).toBe("2026-03-20 06:37:00");
  });

  it("classifyColumn accurately identifies muscle, fat, and vital headers in PT and EN", () => {
    // Skeletal Muscle % vs kg
    expect(classifyColumn("Massa Musc. Esquelética(%)")).toBe("skeletalMuscleMassPct");
    expect(classifyColumn("Massa Muscular Esquelética(%)")).toBe("skeletalMuscleMassPct");
    expect(classifyColumn("Músculo Esquelético(kg)")).toBe("skeletalMuscleMass");
    expect(classifyColumn("Massa Muscular(kg)")).toBe("muscleMass");
    expect(classifyColumn("Taxa Muscular(%)")).toBe("muscleRatePct");

    // English equivalents
    expect(classifyColumn("Skeletal Muscle Mass(%)")).toBe("skeletalMuscleMassPct");
    expect(classifyColumn("Skeletal Muscle(%)")).toBe("skeletalMuscleMassPct");
    expect(classifyColumn("Skeletal Muscle Mass(kg)")).toBe("skeletalMuscleMass");
    expect(classifyColumn("Skeletal Muscle Mass")).toBe("skeletalMuscleMass");
    expect(classifyColumn("Muscle Mass(kg)")).toBe("muscleMass");
    expect(classifyColumn("Muscle Rate(%)")).toBe("muscleRatePct");

    // Fat & Water & Protein
    expect(classifyColumn("Gordura Corporal(%)")).toBe("bodyFatPct");
    expect(classifyColumn("Massa Gorda(kg)")).toBe("fatMass");
    expect(classifyColumn("Gordura Subcutânea(%)")).toBe("subcutaneousFatPct");
    expect(classifyColumn("Gordura Visceral")).toBe("visceralFat");
    expect(classifyColumn("Água Corporal(%)")).toBe("bodyWaterPct");
    expect(classifyColumn("Teor de Umidade(kg)")).toBe("moistureContent");
    expect(classifyColumn("Proteína(%)")).toBe("proteinPct");
    expect(classifyColumn("Massa Protéica(kg)")).toBe("proteinMass");

    // Real Fitdays exports without unit suffixes in headers, using sample cell values
    expect(classifyColumn("Massa Musc.  Esquelética", "34.6%")).toBe("skeletalMuscleMassPct");
    expect(classifyColumn("Músculo esquelético", "40.9(32.8-40.1)kg")).toBe("skeletalMuscleMass");
    expect(classifyColumn("Massa Muscular", "66.4(51.9-64.6)kg")).toBe("muscleMass");
    expect(classifyColumn("Taxa muscular", "56.2%")).toBe("muscleRatePct");

    // Fallback heuristics when both header and sample lack explicit unit tokens
    expect(classifyColumn("Massa Musc.  Esquelética")).toBe("skeletalMuscleMassPct");
    expect(classifyColumn("Músculo esquelético")).toBe("skeletalMuscleMass");
  });

  it("parseRecompFile should correctly parse a Portuguese spreadsheet buffer with correct skeletal muscle mappings", () => {
    const data = [
      {
        "Hora/Data": "06:37 20/03/2026",
        "Peso(kg)": "78.5",
        "IMC": "24.2",
        "Gordura Corporal(%)": "18.5",
        "Gordura Subcutânea(%)": "15.2",
        "Gordura Visceral": "6",
        "Água Corporal(%)": "60.2",
        "Massa Musc. Esquelética(%)": "48.5",
        "Massa Muscular(kg)": "60.5",
        "Massa Óssea(kg)": "3.4",
        "Proteína(%)": "19.2",
        "TMB(kcal)": "1750",
        "Idade Metabólica": "28",
        "Massa Gorda(kg)": "14.5",
        "Teor de Umidade(kg)": "47.2",
        "Músculo Esquelético(kg)": "38.1",
        "Taxa Muscular(%)": "77.1",
        "Massa Protéica(kg)": "15.1",
        "Obesidade(%)": "0",
        "Massa Livre de Gordura(kg)": "64.0",
        "SMI(kg/m²)": "8.1",
        "Pontuação Corporal": "88",
        "Peso-alvo(kg)": "75.0",
        "Controle de Peso(kg)": "-3.5",
        "Controle de Gordura(kg)": "-2.0",
        "Controle Muscular(kg)": "+1.5",
        "Right Arm Gordura": "1.2kg / 12.0% / Baixo",
        "Right Arm Equil. Musc.": "3.5kg / 105% / Normal",
        "Right Arm Impedância": "350 / 310",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const records = parseRecompFile(buf);
    expect(records.length).toBe(1);
    const r = records[0];
    expect(r.weight).toBe(78.5);
    expect(r.bmi).toBe(24.2);
    expect(r.bodyFatPct).toBe(18.5);
    expect(r.skeletalMuscleMassPct).toBe(48.5);
    expect(r.muscleMass).toBe(60.5);
    expect(r.skeletalMuscleMass).toBe(38.1);
    expect(r.muscleRatePct).toBe(77.1);
    expect(r.fatMass).toBe(14.5);
    expect(r.proteinPct).toBe(19.2);
    expect(r.proteinMass).toBe(15.1);
    expect(r.rightArmFatMass).toBe(1.2);
    expect(r.rightArmFatPct).toBe(12.0);
    expect(r.rightArmFatLevel).toBe("Baixo");
    expect(r.rightArmMuscleMass).toBe(3.5);
    expect(r.rightArmMusclePct).toBe(105);
    expect(r.rightArmMuscleLevel).toBe("Normal");
    expect(r.rightArmImpedanceHigh).toBe(350);
    expect(r.rightArmImpedanceLow).toBe(310);
  });

  it("parseRecompFile should correctly parse an English spreadsheet buffer with distinct skeletal muscle % and kg", () => {
    const data = [
      {
        "Time of measurement": "2026-03-20 06:37:00",
        "Weight(kg)": "82.0",
        "BMI": "25.1",
        "Body Fat(%)": "17.0",
        "Subcutaneous Fat(%)": "13.8",
        "Visceral Fat": "5",
        "Body Water(%)": "61.0",
        "Skeletal Muscle Mass(%)": "50.2",
        "Muscle Mass(kg)": "65.0",
        "Bone Mass(kg)": "3.5",
        "Protein(%)": "19.5",
        "BMR": "1800",
        "Metabolic Age": "27",
        "Fat Mass(kg)": "13.9",
        "Water Content(kg)": "50.0",
        "Skeletal Muscle Mass(kg)": "41.2",
        "Muscle Rate(%)": "79.3",
        "Protein Mass(kg)": "16.0",
        "Obesity(%)": "0",
        "Fat-Free Mass(kg)": "68.1",
        "SMI": "8.3",
        "Body Score": "90",
        "Target Weight(kg)": "80.0",
        "Weight Control(kg)": "-2.0",
        "Fat Control(kg)": "-1.5",
        "Muscle Control(kg)": "+0.5",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const records = parseRecompFile(buf);
    expect(records.length).toBe(1);
    const r = records[0];
    expect(r.weight).toBe(82.0);
    expect(r.bmi).toBe(25.1);
    expect(r.bodyFatPct).toBe(17.0);
    expect(r.skeletalMuscleMassPct).toBe(50.2);
    expect(r.muscleMass).toBe(65.0);
    expect(r.skeletalMuscleMass).toBe(41.2);
    expect(r.muscleRatePct).toBe(79.3);
    expect(r.fatMass).toBe(13.9);
    expect(r.proteinPct).toBe(19.5);
    expect(r.proteinMass).toBe(16.0);
  });

  it("parseRecompFile should correctly parse actual recomp-test-data.csv without swapping skeletal muscle % and kg", () => {
    const filePath = path.resolve(process.cwd(), "test-data/recomp-test-data.csv");
    if (!fs.existsSync(filePath)) {
      return;
    }
    const buf = fs.readFileSync(filePath);
    const records = parseRecompFile(buf);

    expect(records.length).toBe(4);
    const r = records[0];
    expect(r.weight).toBe(118.1);
    expect(r.bmi).toBe(34.1);
    expect(r.bodyFatPct).toBe(39.8);
    expect(r.subcutaneousFatPct).toBe(28.3);
    expect(r.visceralFat).toBe(20.0);
    expect(r.bodyWaterPct).toBe(44.1);

    // Assert that skeletal muscle % and kg are NOT swapped:
    // "Massa Musc.  Esquelética" = 34.6%
    expect(r.skeletalMuscleMassPct).toBe(34.6);
    // "Músculo esquelético" = 40.9 kg
    expect(r.skeletalMuscleMass).toBe(40.9);

    // Total muscle metrics:
    // "Massa Muscular" = 66.4 kg
    expect(r.muscleMass).toBe(66.4);
    // "Taxa muscular" = 56.2%
    expect(r.muscleRatePct).toBe(56.2);

    expect(r.fatMass).toBe(47.0);
    expect(r.proteinPct).toBe(12.0);
    expect(r.rightArmMuscleMass).toBe(4.0);
    expect(r.rightArmMusclePct).toBe(92.5);
    expect(r.rightArmMuscleLevel).toBe("Padrão");
  });

  it("parseRecompFile and deduplicateParsedRecords should deduplicate rows sharing the same normalized minute timestamp", () => {
    const data = [
      {
        "Hora/Data": "06:37 20/03/2026",
        "Peso(kg)": "78.5",
        "IMC": "24.2",
      },
      {
        "Hora/Data": "2026-03-20 06:37:45",
        "Peso(kg)": "79.0",
        "IMC": "24.4",
      },
      {
        "Hora/Data": "19:15 20/03/2026",
        "Peso(kg)": "79.3",
        "IMC": "24.5",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const records = parseRecompFile(buf);
    // Two rows at 06:37 on 20/03/2026 should merge into 1, leaving 2 total records for the day
    expect(records.length).toBe(2);
    expect(records[0].weight).toBe(79.0);
    expect(records[0].bmi).toBe(24.4);
    expect(records[1].weight).toBe(79.3);

    // Direct call to deduplicateParsedRecords is also idempotent
    expect(deduplicateParsedRecords(records).length).toBe(2);
  });

  it("cleanFloat and parseDate should support international decimal commas and date formats", () => {
    expect(cleanFloat("80,4 kg")).toBe(80.4);
    expect(cleanFloat("-3,5kg")).toBe(-3.5);
    expect(cleanFloat("+1,2 kg")).toBe(1.2);

    // German dot-separated date
    const deDate = parseDate("20.03.2026 06:37");
    expect(formatRecordDateKey(deDate)).toBe("2026-03-20 06:37:00");

    // Spanish preposition "a las"
    const esDate = parseDate("20/03/2026 a las 06:37");
    expect(formatRecordDateKey(esDate)).toBe("2026-03-20 06:37:00");

    // US MM/DD/YYYY auto-disambiguation when second part > 12
    const usDate = parseDate("03/20/2026 06:37");
    expect(formatRecordDateKey(usDate)).toBe("2026-03-20 06:37:00");
  });

  it("Tier 1: classifyColumn and parseRecompFile should support Spanish (ES) headers and unit disambiguation", () => {
    expect(classifyColumn("Fecha/Hora")).toBe("date");
    expect(classifyColumn("Tiempo de medición")).toBe("date");
    expect(classifyColumn("Peso(kg)")).toBe("weight");
    expect(classifyColumn("Grasa Corporal(%)")).toBe("bodyFatPct");
    expect(classifyColumn("Grasa Subcutánea(%)")).toBe("subcutaneousFatPct");
    expect(classifyColumn("Frecuencia Cardíaca")).toBe("heartRate");
    expect(classifyColumn("Índice Cardíaco")).toBe("heartIndex");
    expect(classifyColumn("Grasa Visceral")).toBe("visceralFat");
    expect(classifyColumn("Agua Corporal(%)")).toBe("bodyWaterPct");
    expect(classifyColumn("Masa Muscular Esquelética(%)")).toBe("skeletalMuscleMassPct");
    expect(classifyColumn("Músculo Esquelético(kg)")).toBe("skeletalMuscleMass");
    expect(classifyColumn("Masa Muscular(kg)")).toBe("muscleMass");
    expect(classifyColumn("Tasa Muscular(%)")).toBe("muscleRatePct");
    expect(classifyColumn("Masa Ósea(kg)")).toBe("boneMass");
    expect(classifyColumn("Proteína(%)")).toBe("proteinPct");
    expect(classifyColumn("Masa Proteica(kg)")).toBe("proteinMass");
    expect(classifyColumn("Masa Grasa(kg)")).toBe("fatMass");
    expect(classifyColumn("Contenido de Humedad(kg)")).toBe("moistureContent");
    expect(classifyColumn("Edad Metabólica")).toBe("metabolicAge");
    expect(classifyColumn("Obesidad(%)")).toBe("obesityScore");
    expect(classifyColumn("Masa Libre de Grasa(kg)")).toBe("fatFreeMass");
    expect(classifyColumn("Puntuación Corporal")).toBe("bodyScore");
    expect(classifyColumn("Peso Objetivo(kg)")).toBe("targetWeight");
    expect(classifyColumn("Control de Peso(kg)")).toBe("weightControl");
    expect(classifyColumn("Control de Grasa(kg)")).toBe("fatControl");
    expect(classifyColumn("Control Muscular(kg)")).toBe("muscleControl");
    expect(classifyColumn("Brazo derecho Grasa")).toBe("right_arm_fat");
    expect(classifyColumn("Brazo izquierdo Músculo")).toBe("left_arm_muscle");
    expect(classifyColumn("Pierna derecha Impedancia")).toBe("right_leg_impedance");

    const esRows = [
      {
        "Fecha": "20/03/2026 a las 06:37",
        "Peso": "76,4kg",
        "IMC": "23,8",
        "Grasa corporal": "16,5%",
        "Grasa subcutánea": "13,2%",
        "Grasa visceral": "5",
        "Agua corporal": "61,4%",
        "Masa Musc. Esquelética": "49,8%",
        "Masa Muscular": "61,2kg",
        "Masa Ósea": "3,3kg",
        "Proteína": "19,0%",
        "TMB": "1720kcal",
        "Edad Metabólica": "26",
        "Masa grasa": "12,6kg",
        "Contenido de humedad": "46,9kg",
        "Músculo esquelético": "38,0kg",
        "Tasa muscular": "80,1%",
        "Masa proteica": "14,5kg",
        "Obesidad": "5",
        "Masa Libre de Grasa": "63,8kg",
        "SMI": "8,2kg/m²",
        "Puntuación corporal": "91",
        "Peso objetivo": "75,0kg",
        "Control de peso": "-1,4kg",
        "Control de grasa": "-1,4kg",
        "Control muscular": "0,0kg",
        "Brazo derecho-Grasa": "0,9kg/11,0%/Normal",
        "Brazo derecho-Músculo": "3,6kg/102,0%/Normal",
        "Brazo derecho-Impedancia": "340,2/305,1",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(esRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const records = parseRecompFile(buf);
    expect(records.length).toBe(1);
    const r = records[0];
    expect(r.weight).toBe(76.4);
    expect(r.bmi).toBe(23.8);
    expect(r.bodyFatPct).toBe(16.5);
    expect(r.skeletalMuscleMassPct).toBe(49.8);
    expect(r.skeletalMuscleMass).toBe(38.0);
    expect(r.muscleMass).toBe(61.2);
    expect(r.muscleRatePct).toBe(80.1);
    expect(r.fatFreeMass).toBe(63.8);
    expect(r.rightArmFatMass).toBe(0.9);
    expect(r.rightArmMuscleMass).toBe(3.6);
    expect(r.rightArmImpedanceHigh).toBe(340.2);
  });

  it("Tier 2: parseRecompFile should parse a 43-column German/Japanese Fitdays export via positional template fallback", () => {
    // 43 columns in German/Japanese where most headers are not in PT/EN/ES
    const row43: Record<string, string> = {
      "Messzeitpunkt (日時)": "30.03.2026 06:07",
      "Gewicht (体重)": "84.2(64.7-87.5)kg",
      "BMI": "25.4",
      "Körperfett (体脂肪率)": "19.2%",
      "Subkutanes Fett (皮下脂肪)": "15.1%",
      "Herzfrequenz (心拍数)": "64",
      "Herzindex (心臓指数)": "3.1",
      "Viszeralfett (内臓脂肪)": "7.0",
      "Körperwasser (体水分率)": "58.6%",
      "Skelettmuskel % (骨格筋率)": "47.5%",
      "Muskelmasse (筋肉量)": "64.3(51.9-64.6)kg",
      "Knochenmasse (骨量)": "3.6(3.7-4.6)kg",
      "Eiweiß % (タンパク質)": "17.8%",
      "Grundumsatz (基礎代謝)": "1820.0kcal",
      "Stoffwechselalter (体内年齢)": "29.0",
      "Fettmasse (脂肪量)": "16.2(9.1-18.2)kg",
      "Wassergehalt (水分量)": "49.3(40.7-50.8)kg",
      "Skelettmuskelmasse (骨格筋量)": "40.0(32.8-40.1)kg",
      "Muskelrate (筋肉率)": "76.4%",
      "Eiweißmasse (タンパク質量)": "15.0(11.1-13.9)kg",
      "Adipositas (肥満度)": "112",
      "Fettfreie Masse (除脂肪体重)": "68.0kg",
      "SMI": "8.6kg/m²",
      "Körperpunktzahl (身体スコア)": "86.0",
      "Zielgewicht (目標体重)": "80.0kg",
      "Gewichtskontrolle (体重制御)": "-4.2kg",
      "Fettkontrolle (脂肪制御)": "-4.2kg",
      "Muskelkontrolle (筋肉制御)": "0.0kg",
      "SegFat_RA": "1.1kg/14.0%/Standard",
      "SegFat_LA": "1.1kg/14.2%/Standard",
      "SegFat_TR": "8.5kg/19.5%/Standard",
      "SegFat_RL": "2.7kg/16.0%/Standard",
      "SegFat_LL": "2.8kg/16.2%/Standard",
      "SegMus_RA": "3.8kg/101.0%/Standard",
      "SegMus_LA": "3.7kg/100.2%/Standard",
      "SegMus_TR": "29.5kg/98.5%/Standard",
      "SegMus_RL": "10.8kg/102.1%/Standard",
      "SegMus_LL": "10.7kg/101.8%/Standard",
      "SegImp_RA": "310.2/275.4",
      "SegImp_LA": "314.0/279.1",
      "SegImp_TR": "22.4/18.1",
      "SegImp_RL": "265.0/238.5",
      "SegImp_LL": "268.1/240.2",
    };

    const ws = XLSX.utils.json_to_sheet([row43]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const records = parseRecompFile(buf);
    expect(records.length).toBe(1);
    const r = records[0];
    expect(formatRecordDateKey(r.date)).toBe("2026-03-30 06:07:00");
    expect(r.weight).toBe(84.2);
    expect(r.bmi).toBe(25.4);
    expect(r.bodyFatPct).toBe(19.2);
    expect(r.heartRate).toBe(64);
    expect(r.heartIndex).toBe(3.1);
    expect(r.skeletalMuscleMassPct).toBe(47.5);
    expect(r.skeletalMuscleMass).toBe(40.0);
    expect(r.muscleMass).toBe(64.3);
    expect(r.muscleRatePct).toBe(76.4);
    expect(r.obesityScore).toBe(112);
    expect(r.fatFreeMass).toBe(68.0);
    expect(r.rightArmFatMass).toBe(1.1);
    expect(r.leftLegMuscleMass).toBe(10.7);
    expect(r.trunkImpedanceHigh).toBe(22.4);
    expect(r.trunkImpedanceLow).toBe(18.1);

    // 41-column profile (8-electrode segmental export without Heart Rate & Heart Index columns)
    const row41: Record<string, string> = { ...row43 };
    delete row41["Herzfrequenz (心拍数)"];
    delete row41["Herzindex (心臓指数)"];

    const ws41 = XLSX.utils.json_to_sheet([row41]);
    const wb41 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb41, ws41, "Sheet1");
    const buf41 = XLSX.write(wb41, { type: "buffer", bookType: "xlsx" });

    const records41 = parseRecompFile(buf41);
    expect(records41.length).toBe(1);
    expect(records41[0].weight).toBe(84.2);
    expect(records41[0].visceralFat).toBe(7.0);
    expect(records41[0].skeletalMuscleMassPct).toBe(47.5);
    expect(records41[0].skeletalMuscleMass).toBe(40.0);
    expect(records41[0].rightArmFatMass).toBe(1.1);
    expect(records41[0].leftLegMuscleMass).toBe(10.7);
    expect(records41[0].trunkImpedanceHigh).toBe(22.4);
  });

  it("Tier 2: parseRecompFile should support 28-column and 26-column 4-electrode profiles and auto-detect swapped fatFreeMass/obesityScore", () => {
    // 28-column profile where slot 20 has fatFreeMass (with kg unit) and slot 21 has obesityScore (unitless/%)
    const row28Swapped: Record<string, string> = {
      "Col0_Zeit": "2026-03-30 07:15",
      "Col1_Gewicht": "79.5kg",
      "Col2_BMI": "24.1",
      "Col3_Körperfett": "17.5%",
      "Col4_Subkutan": "14.0%",
      "Col5_Puls": "60",
      "Col6_Herzindex": "3.0",
      "Col7_Viszeral": "6",
      "Col8_Wasser": "60.5%",
      "Col9_SkelettPct": "49.0%",
      "Col10_MuskelKg": "62.0kg",
      "Col11_KnochenKg": "3.4kg",
      "Col12_ProteinPct": "18.5%",
      "Col13_Umsatz": "1760kcal",
      "Col14_Alter": "27",
      "Col15_FettKg": "13.9kg",
      "Col16_WasserKg": "48.1kg",
      "Col17_SkelettKg": "39.0kg",
      "Col18_MuskelPct": "78.0%",
      "Col19_ProteinKg": "14.7kg",
      "Col20_FettfreieMasse": "65.6kg", // Swapped: fatFreeMass at index 20
      "Col21_Adipositas": "105",        // Swapped: obesityScore at index 21
      "Col22_SMI": "8.4kg/m²",
      "Col23_Punkte": "89",
      "Col24_Ziel": "77.0kg",
      "Col25_GewichtDiff": "-2.5kg",
      "Col26_FettDiff": "-2.5kg",
      "Col27_MuskelDiff": "0.0kg",
    };

    const ws28 = XLSX.utils.json_to_sheet([row28Swapped]);
    const wb28 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb28, ws28, "Sheet1");
    const buf28 = XLSX.write(wb28, { type: "buffer", bookType: "xlsx" });

    const records28 = parseRecompFile(buf28);
    expect(records28.length).toBe(1);
    expect(records28[0].weight).toBe(79.5);
    expect(records28[0].fatFreeMass).toBe(65.6);
    expect(records28[0].obesityScore).toBe(105);

    // 26-column profile (omits Col5_Puls and Col6_Herzindex)
    const row26: Record<string, string> = { ...row28Swapped };
    delete row26["Col5_Puls"];
    delete row26["Col6_Herzindex"];

    const ws26 = XLSX.utils.json_to_sheet([row26]);
    const wb26 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb26, ws26, "Sheet1");
    const buf26 = XLSX.write(wb26, { type: "buffer", bookType: "xlsx" });

    const records26 = parseRecompFile(buf26);
    expect(records26.length).toBe(1);
    expect(records26[0].weight).toBe(79.5);
    expect(records26[0].visceralFat).toBe(6);
    expect(records26[0].fatFreeMass).toBe(65.6);
    expect(records26[0].obesityScore).toBe(105);
  });

  it("Tier 3: parseRecompFile should reject misaligned columns or implausible physiological values with descriptive errors", () => {
    // 1. Misaligned unit in positional template (e.g., weight column has % and bodyFatPct column has kg)
    const misalignedRow26: Record<string, string> = {
      "C0": "2026-03-30 07:15",
      "C1": "18.5%", // Mapped to weight (kg), but has %!
      "C2": "24.1",
      "C3": "80.0kg", // Mapped to bodyFatPct (%), but has kg!
      "C4": "14.0%",
      "C5": "6",
      "C6": "60.5%",
      "C7": "49.0%",
      "C8": "62.0kg",
      "C9": "3.4kg",
      "C10": "18.5%",
      "C11": "1760kcal",
      "C12": "27",
      "C13": "13.9kg",
      "C14": "48.1kg",
      "C15": "39.0kg",
      "C16": "78.0%",
      "C17": "14.7kg",
      "C18": "105",
      "C19": "65.6kg",
      "C20": "8.4kg/m²",
      "C21": "89",
      "C22": "77.0kg",
      "C23": "-2.5kg",
      "C24": "-2.5kg",
      "C25": "0.0kg",
    };

    const wsMisaligned = XLSX.utils.json_to_sheet([misalignedRow26]);
    const wbMisaligned = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbMisaligned, wsMisaligned, "Sheet1");
    const bufMisaligned = XLSX.write(wbMisaligned, { type: "buffer", bookType: "xlsx" });

    expect(() => parseRecompFile(bufMisaligned)).toThrow(/Sanity check failed/i);

    // 2. Implausible physiological range (e.g., BMR shifted into Body Fat % without unit strings: bodyFatPct = 1750)
    const implausibleRangeData = [
      {
        "Date": "2026-03-30 07:15",
        "Weight": "80.0",
        "BMI": "24.5",
        "Body Fat": "1750", // 1750% is impossible (1-85% allowed)
      },
    ];
    const wsRange = XLSX.utils.json_to_sheet(implausibleRangeData);
    const wbRange = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbRange, wsRange, "Sheet1");
    const bufRange = XLSX.write(wbRange, { type: "buffer", bookType: "xlsx" });

    expect(() => parseRecompFile(bufRange)).toThrow(/outside plausible physiological range/i);

    // 3. Unrelated spreadsheet with unrecognized headers and non-matching column count
    const unrelatedData = [
      {
        "Konto": "1001",
        "Betrag": "450.00",
        "Währung": "EUR",
      },
    ];
    const wsUnrelated = XLSX.utils.json_to_sheet(unrelatedData);
    const wbUnrelated = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbUnrelated, wsUnrelated, "Sheet1");
    const bufUnrelated = XLSX.write(wbUnrelated, { type: "buffer", bookType: "xlsx" });

    expect(() => parseRecompFile(bufUnrelated)).toThrow(/Unsupported spreadsheet format/i);
  });
});


