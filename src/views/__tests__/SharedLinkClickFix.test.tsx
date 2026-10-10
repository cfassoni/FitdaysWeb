import { describe, it, expect, vi, beforeEach } from "vitest";
import { copyTextToClipboard } from "@/lib/clipboard";
import { metadata as sharedPageMetadata } from "@/app/shared/[token]/page";

describe("Shared Link ClickFix Mitigation & Metadata", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exports anti-crawling/anti-phishing SSR metadata for /shared/[token]", () => {
    expect(sharedPageMetadata.title).toBe("Shared Body Composition Report");
    expect(sharedPageMetadata.description).toBe(
      "View a shared Recomp Pro body composition and progress report."
    );
    expect(sharedPageMetadata.robots).toEqual(
      expect.objectContaining({
        index: false,
        follow: false,
        nocache: true,
      })
    );
  });

  it("copies text via navigator.clipboard.writeText when available", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    const ok = await copyTextToClipboard("https://example.com/shared/123e4567-e89b-42d3-a456-426614174000");
    expect(ok).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith(
      "https://example.com/shared/123e4567-e89b-42d3-a456-426614174000"
    );
  });

  it("falls back gracefully to document.execCommand('copy') when Clipboard API rejects", async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error("Blocked by content blocker"));
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;

    const ok = await copyTextToClipboard("https://example.com/shared/123e4567-e89b-42d3-a456-426614174000");
    expect(ok).toBe(true);
    expect(execCommandMock).toHaveBeenCalledWith("copy");
  });

  it("returns false without throwing when empty string or both copy mechanisms fail", async () => {
    expect(await copyTextToClipboard("")).toBe(false);

    const writeTextMock = vi.fn().mockRejectedValue(new Error("Clipboard blocked"));
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });
    document.execCommand = vi.fn().mockReturnValue(false);

    expect(
      await copyTextToClipboard("https://example.com/shared/123e4567-e89b-42d3-a456-426614174000")
    ).toBe(false);
  });
});
