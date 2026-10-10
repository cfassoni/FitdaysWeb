import { render, screen, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import GuestSharedReport from "../GuestSharedReport";
import i18n from "@/lib/i18n";
import enTranslations from "@/locales/en.json";
import ptTranslations from "@/locales/pt.json";
import esTranslations from "@/locales/es.json";
import type { SharedLinkPublicMetadata, SharedLinkPublicData } from "@/lib/api";

vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

vi.mock("@/lib/api", () => ({
  api: {
    getPublicSharedLinkMetadata: vi.fn(),
    getPublicSharedLinkData: vi.fn(),
    verifyPublicSharedLinkPassword: vi.fn(),
  },
}));

import { api } from "@/lib/api";

const mockMetadata: SharedLinkPublicMetadata = {
  id: "share-1",
  description: "Consultation with Dr. Silva",
  has_password: false,
  created_at: "2026-08-01T10:00:00Z",
  expires_at: null,
  owner_name: "Alice Tester",
  owner_email: "alice@example.com",
  latest_measurement_date: "2026-08-15T08:00:00Z",
};

const mockReportData: SharedLinkPublicData = {
  dashboard: {
    total_records: 7,
    first_record_date: "2026-07-01T08:00:00Z",
    latest_record_date: "2026-08-15T08:00:00Z",
    starting_weight: 72.0,
    current_weight: 70.5,
    weight_change: -1.5,
    starting_body_fat: 22.0,
    current_body_fat: 20.5,
    body_fat_change: -1.5,
    starting_body_fat_mass: 15.8,
    current_body_fat_mass: 14.5,
    body_fat_mass_change: -1.3,
    starting_muscle_mass: 52.0,
    current_muscle_mass: 52.8,
    muscle_mass_change: 0.8,
    starting_skeletal_muscle_mass: 28.0,
    current_skeletal_muscle_mass: 28.6,
    skeletal_muscle_mass_change: 0.6,
    starting_skeletal_muscle_mass_pct: 38.9,
    current_skeletal_muscle_mass_pct: 40.6,
    skeletal_muscle_mass_pct_change: 1.7,
    weight_history: [
      {
        date: "2026-08-15T08:00:00Z",
        weight: 70.5,
        body_fat_pct: 20.5,
        body_fat_mass: 14.5,
        muscle_mass: 52.8,
        skeletal_muscle_mass: 28.6,
        skeletal_muscle_mass_pct: 40.6,
      },
    ],
  },
  entries: [],
};

describe("GuestSharedReport View - i18n", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    vi.mocked(api.getPublicSharedLinkMetadata).mockResolvedValue(mockMetadata);
    vi.mocked(api.getPublicSharedLinkData).mockResolvedValue(mockReportData);
  });

  it("maintains exact key parity for sharing.reviewingMeasurements across en, pt, and es locales", () => {
    expect(enTranslations.sharing.reviewingMeasurements).toBe(
      "Reviewing {{count}} measurements shared with you"
    );
    expect(ptTranslations.sharing.reviewingMeasurements).toBe(
      "Revisando {{count}} medições compartilhadas com você"
    );
    expect(esTranslations.sharing.reviewingMeasurements).toBe(
      "Revisando {{count}} mediciones compartidas con usted"
    );
    expect(Object.keys(enTranslations.sharing).sort()).toEqual(
      Object.keys(ptTranslations.sharing).sort()
    );
    expect(Object.keys(enTranslations.sharing).sort()).toEqual(
      Object.keys(esTranslations.sharing).sort()
    );
  });

  it("renders localized reviewingMeasurements subtitle in English, Portuguese, and Spanish", async () => {
    render(<GuestSharedReport token="token-123" />);

    await waitFor(() => {
      expect(
        screen.getByText("Reviewing 7 measurements shared with you")
      ).toBeInTheDocument();
    });

    await act(async () => {
      await i18n.changeLanguage("pt");
    });
    await waitFor(() => {
      expect(
        screen.getByText("Revisando 7 medições compartilhadas com você")
      ).toBeInTheDocument();
    });

    await act(async () => {
      await i18n.changeLanguage("es");
    });
    await waitFor(() => {
      expect(
        screen.getByText("Revisando 7 mediciones compartidas con usted")
      ).toBeInTheDocument();
    });
  });
});
