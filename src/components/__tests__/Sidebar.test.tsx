import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "../Sidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "sidebar.navigation": "Navigation",
        "sidebar.dashboard": "Dashboard",
        "sidebar.history": "Detailed History",
        "sidebar.import": "Import CSV Data",
        "sidebar.sharedReports": "Shared Reports",
        "sidebar.closeMenu": "Close Menu",
        "sidebar.nutrition": "Nutrition",
        "sidebar.activities": "Activities",
      };
      return translations[key] || key;
    },
  }),
}));

const mockUseAuth = vi.fn(() => ({
  enableWipPages: false,
}));

// Mock @/context/AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("Sidebar Component", () => {
  const mockProps = {
    isMobileOpen: false,
    onMobileClose: vi.fn(),
    sharedLinksCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders desktop navigation links with correct href attributes", () => {
    render(<Sidebar {...mockProps} />);

    const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
    const historyLink = screen.getByRole("link", { name: /Detailed History/i });
    const importLink = screen.getByRole("link", { name: /Import CSV Data/i });

    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    expect(historyLink).toHaveAttribute("href", "/history");
    expect(importLink).toHaveAttribute("href", "/import");
  });

  it("shows shared reports link when sharedLinksCount > 0", () => {
    render(<Sidebar {...mockProps} sharedLinksCount={3} />);

    const sharedLink = screen.getByRole("link", { name: /Shared Reports/i });
    expect(sharedLink).toHaveAttribute("href", "/shared-reports");
  });

  it("does not show shared reports link when sharedLinksCount is 0", () => {
    render(<Sidebar {...mockProps} sharedLinksCount={0} />);

    expect(screen.queryByRole("link", { name: /Shared Reports/i })).not.toBeInTheDocument();
  });

  it("renders mobile drawer when isMobileOpen is true and handles close", () => {
    render(<Sidebar {...mockProps} isMobileOpen={true} />);

    const closeButtons = screen.getAllByLabelText("Close Menu");
    expect(closeButtons.length).toBeGreaterThan(0);

    fireEvent.click(closeButtons[0]);
    expect(mockProps.onMobileClose).toHaveBeenCalledTimes(1);
  });

  it("does not render WiP items when enableWipPages is false", () => {
    mockUseAuth.mockReturnValue({ enableWipPages: false });
    render(<Sidebar {...mockProps} />);

    expect(screen.queryByRole("link", { name: /Nutrition/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Activities/i })).not.toBeInTheDocument();
  });

  it("renders WiP items when enableWipPages is true", () => {
    mockUseAuth.mockReturnValue({ enableWipPages: true });
    render(<Sidebar {...mockProps} />);

    const nutritionLink = screen.getByRole("link", { name: /Nutrition/i });
    const activitiesLink = screen.getByRole("link", { name: /Activities/i });
    expect(nutritionLink).toHaveAttribute("href", "/nutrition");
    expect(activitiesLink).toHaveAttribute("href", "/activities");
  });
});
