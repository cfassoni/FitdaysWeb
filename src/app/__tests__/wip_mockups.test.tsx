import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import NutritionMockupPage from "../(authenticated)/nutrition/page";
import ActivitiesMockupPage from "../(authenticated)/activities/page";
import * as navigation from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

describe("WIP Mockup Routes Feature Flag Protection", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it("calls notFound() for Nutrition page by default", () => {
    delete process.env.NEXT_PUBLIC_ENABLE_WIP_PAGES;
    NutritionMockupPage();
    expect(navigation.notFound).toHaveBeenCalledTimes(1);
  });

  it("calls notFound() for Activities page by default", () => {
    delete process.env.NEXT_PUBLIC_ENABLE_WIP_PAGES;
    ActivitiesMockupPage();
    expect(navigation.notFound).toHaveBeenCalledTimes(1);
  });

  it("renders Nutrition preview when explicitly enabled with 'true'", () => {
    process.env.NEXT_PUBLIC_ENABLE_WIP_PAGES = "true";
    render(<NutritionMockupPage />);
    expect(screen.getByText("Nutrition & Macros")).toBeInTheDocument();
    expect(screen.getByText("Mockup Preview")).toBeInTheDocument();
  });

  it("renders Activities preview when explicitly enabled with 'true'", () => {
    process.env.NEXT_PUBLIC_ENABLE_WIP_PAGES = "true";
    render(<ActivitiesMockupPage />);
    expect(screen.getByText("Workouts & Activities")).toBeInTheDocument();
    expect(screen.getByText("Mockup Preview")).toBeInTheDocument();
  });
});
