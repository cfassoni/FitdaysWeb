import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { generateVerificationCode, getVerificationExpiry } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ detail: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.query.users.findFirst({
      where: or(eq(users.email, cleanEmail), eq(users.pendingEmail, cleanEmail)),
    });

    if (!user) {
      // Prevent user enumeration
      return NextResponse.json({
        message: "If an account exists with this email, a verification code has been sent.",
      });
    }

    if (user.emailConfirmed && !user.pendingEmail) {
      return NextResponse.json({
        message: "Email is already verified.",
      });
    }

    const code = generateVerificationCode();
    const expiry = getVerificationExpiry();

    await db
      .update(users)
      .set({
        verificationCode: code,
        verificationCodeExpiresAt: expiry,
        verificationAttempts: 0,
      })
      .where(eq(users.id, user.id));

    const targetEmail = user.pendingEmail ? user.pendingEmail : user.email;
    sendVerificationEmail(
      targetEmail,
      code,
      user.preferredLanguage || "en",
      Boolean(user.pendingEmail)
    ).catch((err) => console.error("Async email dispatch error:", err));

    return NextResponse.json({
      message: "Verification code sent.",
    });
  } catch (err) {
    console.error("Resend verification error:", err);
    return NextResponse.json(
      { detail: "An error occurred while resending verification code" },
      { status: 500 }
    );
  }
}
