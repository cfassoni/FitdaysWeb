import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { formatUserResponse } from "@/lib/userFormat";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq, or, and, ne } from "drizzle-orm";
import { generateVerificationCode, getVerificationExpiry } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export const PUT = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const {
      email,
      display_name,
      gender,
      birthday,
      height_cm,
      target_weight_kg,
      preferred_language,
    } = body;

    const updates: Partial<typeof users.$inferInsert> = {};

    // Check if email is being updated
    if (email && email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      const cleanEmail = email.toLowerCase().trim();

      const existing = await db.query.users.findFirst({
        where: and(
          or(eq(users.email, cleanEmail), eq(users.pendingEmail, cleanEmail)),
          ne(users.id, user.id)
        ),
      });

      if (existing) {
        return NextResponse.json(
          { detail: "Email already registered" },
          { status: 400 }
        );
      }

      const code = generateVerificationCode();
      const expiry = getVerificationExpiry();

      updates.pendingEmail = cleanEmail;
      updates.verificationCode = code;
      updates.verificationCodeExpiresAt = expiry;
      updates.verificationAttempts = 0;

      sendVerificationEmail(
        cleanEmail,
        code,
        preferred_language || user.preferredLanguage || "en",
        true
      ).catch((err) => console.error("Async email dispatch error:", err));
    }

    if (display_name !== undefined) updates.displayName = display_name;
    if (gender !== undefined) updates.gender = gender;
    if (birthday !== undefined) updates.birthday = birthday;
    if (height_cm !== undefined) updates.heightCm = Number(height_cm);
    if (target_weight_kg !== undefined) updates.targetWeightKg = Number(target_weight_kg);
    if (preferred_language !== undefined) updates.preferredLanguage = preferred_language;

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json(formatUserResponse(updatedUser));
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json(
      { detail: "An error occurred while updating profile" },
      { status: 500 }
    );
  }
});
