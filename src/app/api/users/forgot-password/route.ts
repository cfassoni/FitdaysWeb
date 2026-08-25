import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  generateResetToken,
  generateVerificationCode,
  getResetExpiry,
} from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ detail: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.query.users.findFirst({
      where: eq(users.email, cleanEmail),
    });

    if (user) {
      const token = generateResetToken();
      const code = generateVerificationCode();
      const expiry = getResetExpiry();

      await db
        .update(users)
        .set({
          resetPasswordToken: token,
          resetPasswordCode: code,
          resetPasswordExpiresAt: expiry,
          resetPasswordAttempts: 0,
        })
        .where(eq(users.id, user.id));

      sendPasswordResetEmail(
        user.email,
        token,
        code,
        user.preferredLanguage || "en"
      ).catch((err) => console.error("Async reset email error:", err));
    }

    // Generic response to prevent user enumeration
    return NextResponse.json({
      message: "If an account exists with this email, a password reset link and code have been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { detail: "An error occurred while processing password reset" },
      { status: 500 }
    );
  }
}
