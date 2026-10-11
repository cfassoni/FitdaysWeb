import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Biometrics from "../Biometrics";
import { api } from "@/lib/api";
import type { FitdaysRecord } from "@/lib/api";
import enTranslations from "@/locales/en.json";

function getTranslation(obj: unknown, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: Record<string, unknown>) => {
        let val = getTranslation(enTranslations, key);
        if (options) {
          Object.entries(options).forEach(([k, v]) => {
            val = val.replace(`{{${k}}}`, String(v));
          });
        }
        return val || key;
      },
      i18n: {
        language: "en",
      },
    }),
  };
});

vi.mock("@/lib/api", () => ({
  api: {
    getRecords: vi.fn(),
    toggleRecordStar: vi.fn(),
    deleteRecords: vi.fn(),
    createSharedLink: vi.fn(),
    getSharedLinks: vi.fn(),
    uploadCSV: vi.fn(),
  },
}));

const mockRecords: FitdaysRecord[] = [
  {
    id: 1,
    date: "2026-08-01T08:00:00Z",
    weight: 80.0,
    bmi: 24.5,
    body_fat_pct: 18.0,
    skeletal_muscle_mass: 38.0,
    bmr: 1850,
    visceral_fat: 6,
    moisture_content: 48.0,
    bone_mass: 3.2,
    protein_mass: 12.0,
    metabolic_age: 26,
    fat_free_mass: 65.6,
    subcutaneous_fat_pct: 14.5,
    body_score: 85,
    starred: false,
    report: null,
  },
  {
    id: 2,
    date: "2026-08-15T08:00:00Z",
    weight: 78.5,
    bmi: 24.0,
    body_fat_pct: 16.5,
    skeletal_muscle_mass: 39.0,
    bmr: 1880,
    visceral_fat: 5,
    moisture_content: 49.0,
    bone_mass: 3.2,
    protein_mass: 12.5,
    metabolic_age: 25,
    fat_free_mass: 66.0,
    subcutaneous_fat_pct: 13.0,
    body_score: 88,
    starred: true,
    report: null,
  },
] as unknown as FitdaysRecord[];

describe("Biometrics View Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    (api.getRecords as ReturnType<typeof vi.fn>).mockResolvedValue(mockRecords);
  });

  it("renders Biometrics Analysis header and Bento highlight cards", async () => {
    render(<Biometrics />);

    await waitFor(() => {
      expect(screen.getByText(/Biometrics Analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/Basal Metabolic Rate \(BMR \/ TMB\)/i)).toBeInTheDocument();
      // Latest BMR should be formatted
      expect(screen.getByText("1,880")).toBeInTheDocument();
      // Evolution comparison card
      expect(screen.getByText(/Goals & Evolution Comparison/i)).toBeInTheDocument();
    });
  });

  it("renders table with records and star toggle", async () => {
    render(<Biometrics />);

    await waitFor(() => {
      expect(screen.getByText("80.0")).toBeInTheDocument();
      expect(screen.getByText("78.5")).toBeInTheDocument();
    });
  });

  it("opens CSV Import modal when Import CSV button is clicked", async () => {
    render(<Biometrics />);

    await waitFor(() => {
      expect(screen.getByText(/Biometrics Analysis/i)).toBeInTheDocument();
    });

    const importBtn = screen.getByRole("button", { name: /Import CSV/i });
    fireEvent.click(importBtn);

    expect(screen.getByText(/Compatible with Fitdays CSV exports up to 5MB/i)).toBeInTheDocument();
  });

  it("automatically opens CSV Import modal if ?import=open is in query params", async () => {
    mockSearchParams = new URLSearchParams("import=open");
    render(<Biometrics />);

    await waitFor(() => {
      expect(screen.getByText(/Compatible with Fitdays CSV exports up to 5MB/i)).toBeInTheDocument();
      expect(mockReplace).toHaveBeenCalledWith("/biometrics");
    });
  });
});
