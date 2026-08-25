import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import NutritionMockupPage from "../(authenticated)/nutrition/page";
import ActivitiesMockupPage from "../(authenticated)/activities/page";
import * as navigation from "next/navigation";
import * as authContext from "@/context/AuthContext";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

// Mock @/context/AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    enableWipPages: false,
  })),
}));

describe("WIP Mockup Routes Feature Flag Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls notFound() for Nutrition page by default", () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      enableWipPages: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    NutritionMockupPage();
    expect(navigation.notFound).toHaveBeenCalledTimes(1);
  });

  it("calls notFound() for Activities page by default", () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      enableWipPages: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    ActivitiesMockupPage();
    expect(navigation.notFound).toHaveBeenCalledTimes(1);
  });

  it("renders Nutrition preview when explicitly enabled with 'true'", () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      enableWipPages: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(<NutritionMockupPage />);
    expect(screen.getByText("Nutrition & Macros")).toBeInTheDocument();
    expect(screen.getByText("Mockup Preview")).toBeInTheDocument();
  });

  it("renders Activities preview when explicitly enabled with 'true'", () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      enableWipPages: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(<ActivitiesMockupPage />);
    expect(screen.getByText("Workouts & Activities")).toBeInTheDocument();
    expect(screen.getByText("Mockup Preview")).toBeInTheDocument();
  });
});
