import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = withAuth(async (req, { user }) => {
  try {
    await db
      .update(users)
      .set({
        pendingEmail: null,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        verificationAttempts: 0,
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ message: "Email change cancelled." });
  } catch (err) {
    console.error("Cancel email change error:", err);
    return NextResponse.json(
      { detail: "An error occurred while cancelling email change" },
      { status: 500 }
    );
  }
});
