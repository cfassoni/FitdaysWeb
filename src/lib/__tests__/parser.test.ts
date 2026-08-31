import { describe, it, expect } from "vitest";
import { cleanFloat, parseSegmental, parseImpedance, parseDate, parseFitdaysFile, classifyColumn } from "../parser";
import * as XLSX from "xlsx";

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

  it("parseDate should handle HH:mm dd/MM/yyyy and ISO strings", () => {
    const d1 = parseDate("06:37 20/03/2026");
    expect(d1).not.toBeNull();
    expect(d1?.getFullYear()).toBe(2026);
    expect(d1?.getMonth()).toBe(2); // 0-indexed March
    expect(d1?.getDate()).toBe(20);
    expect(d1?.getHours()).toBe(6);
    expect(d1?.getMinutes()).toBe(37);
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
  });

  it("parseFitdaysFile should correctly parse a Portuguese spreadsheet buffer with correct skeletal muscle mappings", () => {
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

    const records = parseFitdaysFile(buf);
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

  it("parseFitdaysFile should correctly parse an English spreadsheet buffer with distinct skeletal muscle % and kg", () => {
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

    const records = parseFitdaysFile(buf);
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
});
