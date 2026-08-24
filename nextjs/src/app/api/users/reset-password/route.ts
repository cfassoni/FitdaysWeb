import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import {
  hashPassword,
  createAccessToken,
  MAX_RESET_PASSWORD_ATTEMPTS,
} from "@/lib/auth";
import { sendPasswordChangedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tokenOrCode = body.token_or_code || body.token || body.code;
    const email = body.email;
    const new_password = body.new_password || body.newPassword;

    if (!tokenOrCode || !new_password || new_password.length < 6) {
      return NextResponse.json(
        { detail: "Invalid password reset parameters" },
        { status: 400 }
      );
    }

    const cleanToken = String(tokenOrCode).trim();

    let user;
    if (email) {
      user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase().trim()),
      });

      if (!user) {
        return NextResponse.json(
          { detail: "Invalid or expired reset token/code" },
          { status: 400 }
        );
      }

      if (user.resetPasswordAttempts >= MAX_RESET_PASSWORD_ATTEMPTS) {
        return NextResponse.json(
          { detail: "Too many failed attempts. Please request a new password reset link." },
          { status: 400 }
        );
      }

      if (!user.resetPasswordExpiresAt || new Date(user.resetPasswordExpiresAt) < new Date()) {
        return NextResponse.json(
          { detail: "Password reset link or code has expired. Please request a new one." },
          { status: 400 }
        );
      }

      if (user.resetPasswordToken !== cleanToken && user.resetPasswordCode !== cleanToken) {
        const attempts = user.resetPasswordAttempts + 1;
        await db
          .update(users)
          .set({ resetPasswordAttempts: attempts })
          .where(eq(users.id, user.id));

        const remaining = Math.max(0, MAX_RESET_PASSWORD_ATTEMPTS - attempts);
        if (remaining <= 0) {
          return NextResponse.json(
            { detail: "Too many failed attempts. Please request a new password reset link." },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { detail: `Invalid reset code or token. ${remaining} attempt(s) remaining.` },
          { status: 400 }
        );
      }
    } else {
      user = await db.query.users.findFirst({
        where: or(
          eq(users.resetPasswordToken, cleanToken),
          eq(users.resetPasswordCode, cleanToken)
        ),
      });

      if (!user) {
        return NextResponse.json(
          { detail: "Invalid or expired reset token/code" },
          { status: 400 }
        );
      }

      if (user.resetPasswordAttempts >= MAX_RESET_PASSWORD_ATTEMPTS) {
        return NextResponse.json(
          { detail: "Too many failed attempts. Please request a new password reset link." },
          { status: 400 }
        );
      }

      if (!user.resetPasswordExpiresAt || new Date(user.resetPasswordExpiresAt) < new Date()) {
        return NextResponse.json(
          { detail: "Password reset link or code has expired. Please request a new one." },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await hashPassword(new_password);

    await db
      .update(users)
      .set({
        hashedPassword,
        emailConfirmed: true,
        resetPasswordToken: null,
        resetPasswordCode: null,
        resetPasswordExpiresAt: null,
        resetPasswordAttempts: 0,
      })
      .where(eq(users.id, user.id));

    sendPasswordChangedEmail(user.email, user.preferredLanguage || "en").catch(
      (err) => console.error("Async email error:", err)
    );

    const accessToken = await createAccessToken({
      sub: user.email,
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
      access_token: accessToken,
      token_type: "bearer",
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { detail: "An error occurred while resetting password" },
      { status: 500 }
    );
  }
}
