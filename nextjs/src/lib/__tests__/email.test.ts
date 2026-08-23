import { describe, it, expect, vi } from "vitest";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendDataDeletedEmail,
  sendAccountDeletedEmail,
} from "../email";

describe("Email Service", () => {
  it("should dispatch verification email with development console fallback", async () => {
    const res = await sendVerificationEmail("test@example.com", "123456", "en", false);
    expect(res).toBe(true);

    const resPt = await sendVerificationEmail("teste@example.com", "654321", "pt", true);
    expect(resPt).toBe(true);

    const resEs = await sendVerificationEmail("prueba@example.com", "112233", "es", false);
    expect(resEs).toBe(true);
  });

  it("should dispatch password reset emails for all supported languages", async () => {
    const resEn = await sendPasswordResetEmail("user@example.com", "sample-token", "998877", "en");
    expect(resEn).toBe(true);

    const resPt = await sendPasswordResetEmail("user@example.com", "sample-token", "998877", "pt");
    expect(resPt).toBe(true);

    const resEs = await sendPasswordResetEmail("user@example.com", "sample-token", "998877", "es");
    expect(resEs).toBe(true);
  });

  it("should dispatch security notification emails", async () => {
    expect(await sendPasswordChangedEmail("user@example.com", "en")).toBe(true);
    expect(await sendDataDeletedEmail("user@example.com", "pt")).toBe(true);
    expect(await sendAccountDeletedEmail("user@example.com", "es")).toBe(true);
  });
});
