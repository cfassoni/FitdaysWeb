import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { MAX_VERIFICATION_ATTEMPTS } from "@/lib/auth";

export async function processEmailVerification(email: string, code: string) {
  const cleanEmail = email.toLowerCase().trim();

  const user = await db.query.users.findFirst({
    where: or(eq(users.email, cleanEmail), eq(users.pendingEmail, cleanEmail)),
  });

  if (!user) {
    return { error: "User not found or invalid email", status: 400 };
  }

  if (user.emailConfirmed && !user.pendingEmail) {
    return {
      data: {
        message: "Email already verified",
        email: user.email,
        email_confirmed: true,
      },
    };
  }

  if (user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
    return {
      error: "Too many failed attempts. Please request a new verification code.",
      status: 400,
    };
  }

  if (!user.verificationCode || !user.verificationCodeExpiresAt) {
    return {
      error: "No pending verification code found. Please request a new one.",
      status: 400,
    };
  }

  const now = new Date();
  const expiry = new Date(user.verificationCodeExpiresAt);

  if (expiry < now) {
    return {
      error: "Verification code has expired. Please request a new code.",
      status: 400,
    };
  }

  if (user.verificationCode !== code) {
    const attempts = user.verificationAttempts + 1;
    await db
      .update(users)
      .set({ verificationAttempts: attempts })
      .where(eq(users.id, user.id));

    const remaining = Math.max(0, MAX_VERIFICATION_ATTEMPTS - attempts);
    return {
      error: `Invalid verification code. ${remaining} attempt(s) remaining.`,
      status: 400,
    };
  }

  // Success
  let newEmail = user.email;
  if (user.pendingEmail && (user.pendingEmail === cleanEmail || user.email === cleanEmail)) {
    newEmail = user.pendingEmail;
  }

  await db
    .update(users)
    .set({
      email: newEmail,
      pendingEmail: null,
      emailConfirmed: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
      verificationAttempts: 0,
    })
    .where(eq(users.id, user.id));

  return {
    data: {
      message: "Email verified successfully",
      email: newEmail,
      email_confirmed: true,
    },
  };
}
