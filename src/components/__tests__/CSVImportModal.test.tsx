import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CSVImportModal from "../CSVImportModal";
import { api } from "@/lib/api";
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
    }),
  };
});

vi.mock("@/lib/api", () => ({
  api: {
    uploadCSV: vi.fn(),
  },
}));

describe("CSVImportModal Component", () => {
  const mockOnClose = vi.fn();
  const mockOnImportSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <CSVImportModal
        isOpen={false}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    );
    expect(screen.queryByText(/Import CSV Data/i)).not.toBeInTheDocument();
  });

  it("renders when isOpen is true and shows dropzone", () => {
    render(
      <CSVImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    );
    expect(screen.getByText(/Import CSV Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Compatible with Fitdays CSV exports up to 5MB/i)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <CSVImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    );
    const closeBtn = screen.getByLabelText(/Close/i);
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("handles valid file selection and successful upload", async () => {
    const mockResponse = {
      message: "Uploaded",
      total_processed: 15,
      inserted: 10,
      updated: 5,
    };
    (api.uploadCSV as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    render(
      <CSVImportModal
        isOpen={true}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    );

    const file = new File(["date,weight\n2026-08-01,75.0"], "fitdays.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("fitdays.csv")).toBeInTheDocument();

    const uploadBtn = screen.getByRole("button", { name: /Upload & Parse/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(api.uploadCSV).toHaveBeenCalledWith(file);
      expect(mockOnImportSuccess).toHaveBeenCalledWith(mockResponse);
      expect(screen.getByText(/Import Completed Successfully!/i)).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });
});
