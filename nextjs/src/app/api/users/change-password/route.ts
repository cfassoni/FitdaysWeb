import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendPasswordChangedEmail } from "@/lib/email";

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const { current_password, new_password } = body;

    if (!current_password || !new_password || new_password.length < 6) {
      return NextResponse.json(
        { detail: "Invalid password parameters" },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(current_password, user.hashedPassword);
    if (!isValid) {
      return NextResponse.json(
        { detail: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(new_password);

    await db
      .update(users)
      .set({
        hashedPassword,
        resetPasswordToken: null,
        resetPasswordCode: null,
        resetPasswordExpiresAt: null,
        resetPasswordAttempts: 0,
      })
      .where(eq(users.id, user.id));

    sendPasswordChangedEmail(user.email, user.preferredLanguage || "en").catch(
      (err) => console.error("Async email error:", err)
    );

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json(
      { detail: "An error occurred while changing password" },
      { status: 500 }
    );
  }
});
