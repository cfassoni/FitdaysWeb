import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "../AuthContext";
import i18n from "@/lib/i18n";
import React from "react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock api client
vi.mock("@/lib/api", () => ({
  api: {
    getMe: vi.fn().mockResolvedValue(null),
    getSharedLinks: vi.fn().mockResolvedValue([]),
    updateProfile: vi.fn(),
  },
  getAuthToken: vi.fn().mockReturnValue(null),
  removeAuthToken: vi.fn(),
}));

import { type User } from "@/lib/api";

function ConsumerComponent() {
  const { user, setUser } = useAuth();
  return (
    <div>
      <span data-testid="current-lang">{i18n.language}</span>
      <span data-testid="user-email">{user?.email || "none"}</span>
      <button
        onClick={() => {
          i18n.changeLanguage("es");
        }}
      >
        Change to ES
      </button>
      <button
        onClick={() => {
          setUser({
            id: 1,
            email: "test@example.com",
            display_name: "Test User",
            gender: "M",
            birthday: "1990-01-01",
            height_cm: 180,
            target_weight_kg: 75,
            profile_image_path: null,
            profile_image_url: null,
            preferred_language: "pt",
            email_confirmed: true,
            pending_email: null,
            created_at: "2026-06-20T10:00:00Z",
          } satisfies User);
        }}
      >
        Set User PT
      </button>
    </div>
  );
}

describe("AuthContext Language Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize initialLang on first mount and not reset it when language is changed", async () => {
    const { rerender } = render(
      <AuthProvider initialLang="en">
        <ConsumerComponent />
      </AuthProvider>
    );

    // Initial language is English
    expect(screen.getByTestId("current-lang").textContent).toBe("en");

    // User changes language to Spanish
    act(() => {
      screen.getByText("Change to ES").click();
    });

    expect(i18n.language).toBe("es");
    expect(screen.getByTestId("current-lang").textContent).toBe("es");

    // Force re-render of AuthProvider with original initialLang="en" prop
    rerender(
      <AuthProvider initialLang="en">
        <ConsumerComponent />
      </AuthProvider>
    );

    // It MUST NOT revert back to "en"
    expect(i18n.language).toBe("es");
    expect(screen.getByTestId("current-lang").textContent).toBe("es");
  });

  it("should synchronize language when user preferred_language changes", async () => {
    render(
      <AuthProvider initialLang="en">
        <ConsumerComponent />
      </AuthProvider>
    );

    act(() => {
      screen.getByText("Set User PT").click();
    });

    expect(i18n.language).toBe("pt");
    expect(screen.getByTestId("current-lang").textContent).toBe("pt");
  });
});
