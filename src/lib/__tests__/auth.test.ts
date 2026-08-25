import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  verifyAccessToken,
  generateVerificationCode,
  generateResetToken,
  getVerificationExpiry,
  getResetExpiry,
  extractTokenFromHeader,
} from "../auth";

describe("Auth Utilities", () => {
  it("should hash and verify passwords correctly", async () => {
    const password = "mySecretPassword123!";
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);

    const isMatch = await verifyPassword(password, hash);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword("wrongPassword", hash);
    expect(isWrong).toBe(false);
  });

  it("should sign and verify JWT access tokens with sub and payload", async () => {
    const token = await createAccessToken({
      sub: "user@example.com",
      userId: 42,
      email: "user@example.com",
    });

    expect(typeof token).toBe("string");

    const payload = await verifyAccessToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("user@example.com");
    expect(payload?.userId).toBe(42);
    expect(payload?.email).toBe("user@example.com");
  });

  it("should generate 6-digit verification codes", () => {
    const code = generateVerificationCode();
    expect(code).toMatch(/^[0-9]{6}$/);
  });

  it("should generate 32-byte url-safe reset tokens", () => {
    const token = generateResetToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThanOrEqual(32);
  });

  it("should calculate correct verification and reset expiration dates", () => {
    const now = new Date();
    const verExpiry = getVerificationExpiry();
    const resetExpiry = getResetExpiry();

    expect(verExpiry.getTime()).toBeGreaterThan(now.getTime());
    expect(resetExpiry.getTime()).toBeGreaterThan(now.getTime());
    expect(verExpiry.getTime() - now.getTime()).toBeGreaterThan(23 * 3600 * 1000);
    expect(resetExpiry.getTime() - now.getTime()).toBeLessThan(2 * 3600 * 1000);
  });

  it("should extract token from Bearer authorization header", () => {
    expect(extractTokenFromHeader("Bearer my-token-123")).toBe("my-token-123");
    expect(extractTokenFromHeader("bearer my-token-123")).toBe("my-token-123");
    expect(extractTokenFromHeader("Basic 123")).toBeNull();
    expect(extractTokenFromHeader(null)).toBeNull();
  });

  it("should respect ACCESS_TOKEN_EXPIRE_MINUTES environment variable", async () => {
    const originalEnv = process.env.ACCESS_TOKEN_EXPIRE_MINUTES;
    try {
      process.env.ACCESS_TOKEN_EXPIRE_MINUTES = "120";
      const token = await createAccessToken({ sub: "exp@example.com" });
      const payload = await verifyAccessToken(token);
      expect(payload).not.toBeNull();
      // exp is in seconds (unix epoch)
      const nowSec = Math.floor(Date.now() / 1000);
      const expSec = payload?.exp as number;
      // Should expire approximately 120 minutes (7200 seconds) from now
      expect(expSec - nowSec).toBeGreaterThan(7100);
      expect(expSec - nowSec).toBeLessThanOrEqual(7205);
    } finally {
      process.env.ACCESS_TOKEN_EXPIRE_MINUTES = originalEnv;
    }
  });
});
