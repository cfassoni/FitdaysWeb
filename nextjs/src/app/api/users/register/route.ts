import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  generateVerificationCode,
  getVerificationExpiry,
} from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { formatUserResponse } from "@/lib/userFormat";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      display_name,
      gender,
      birthday,
      height_cm,
      target_weight_kg,
      preferred_language,
    } = body;

    if (!email || !password || password.length < 6 || !display_name || !gender || !birthday || !height_cm || !target_weight_kg) {
      return NextResponse.json(
        { detail: "Invalid registration payload" },
        { status: 400 }
      );
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });

    if (existingUser) {
      return NextResponse.json(
        { detail: "Email already registered" },
        { status: 400 }
      );
    }

    const code = generateVerificationCode();
    const expiry = getVerificationExpiry();
    const hashedPassword = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase().trim(),
        hashedPassword,
        displayName: display_name,
        gender,
        birthday,
        heightCm: Number(height_cm),
        targetWeightKg: Number(target_weight_kg),
        preferredLanguage: preferred_language || "en",
        emailConfirmed: false,
        verificationCode: code,
        verificationCodeExpiresAt: expiry,
        verificationAttempts: 0,
      })
      .returning();

    // Send verification email asynchronously
    sendVerificationEmail(newUser.email, code, newUser.preferredLanguage || "en", false).catch(
      (err) => console.error("Async email dispatch error:", err)
    );

    return NextResponse.json(formatUserResponse(newUser), { status: 201 });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { detail: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
