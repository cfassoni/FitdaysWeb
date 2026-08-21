import { describe, it, expect } from "vitest";
import { cleanFloat, parseSegmental, parseImpedance, parseDate, parseFitdaysFile } from "../parser";
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

  it("parseFitdaysFile should correctly parse a spreadsheet buffer", () => {
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
    expect(r.rightArmFatMass).toBe(1.2);
    expect(r.rightArmFatPct).toBe(12.0);
    expect(r.rightArmFatLevel).toBe("Baixo");
    expect(r.rightArmMuscleMass).toBe(3.5);
    expect(r.rightArmMusclePct).toBe(105);
    expect(r.rightArmMuscleLevel).toBe("Normal");
    expect(r.rightArmImpedanceHigh).toBe(350);
    expect(r.rightArmImpedanceLow).toBe(310);
  });
});
