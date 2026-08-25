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
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    let email = "";
    let password = "";
    let display_name = "";
    let gender: "male" | "female" = "male";
    let birthday = "";
    let height_cm: number | string = "";
    let target_weight_kg: number | string = "";
    let preferred_language = "en";
    let profilePicFile: File | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      email = (formData.get("email") as string) || "";
      password = (formData.get("password") as string) || "";
      display_name = (formData.get("display_name") as string) || "";
      gender = ((formData.get("gender") as string) || "male") as "male" | "female";
      birthday = (formData.get("birthday") as string) || "";
      height_cm = (formData.get("height_cm") as string) || "";
      target_weight_kg = (formData.get("target_weight_kg") as string) || "";
      preferred_language = (formData.get("preferred_language") as string) || "en";

      const file = formData.get("file") || formData.get("profile_pic");
      if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
        profilePicFile = file as File;
      }
    } else {
      const body = await req.json();
      email = body.email || "";
      password = body.password || "";
      display_name = body.display_name || "";
      gender = body.gender || "male";
      birthday = body.birthday || "";
      height_cm = body.height_cm || "";
      target_weight_kg = body.target_weight_kg || "";
      preferred_language = body.preferred_language || "en";
    }

    if (
      !email ||
      !password ||
      password.length < 6 ||
      !display_name ||
      !gender ||
      !birthday ||
      !height_cm ||
      !target_weight_kg
    ) {
      return NextResponse.json(
        { detail: "Invalid registration payload" },
        { status: 400 }
      );
    }

    // Validate profile picture if attached
    if (profilePicFile) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(profilePicFile.type)) {
        return NextResponse.json(
          { detail: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
          { status: 400 }
        );
      }
      const MAX_SIZE = 4 * 1024 * 1024;
      if (profilePicFile.size > MAX_SIZE) {
        return NextResponse.json(
          { detail: "File size exceeds the 4MB limit." },
          { status: 400 }
        );
      }
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

    let finalUser = newUser;

    // Persist profile picture if provided
    if (profilePicFile) {
      try {
        const bytes = await profilePicFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir =
          process.env.UPLOAD_DIR ||
          (process.env.DOCKER_MODE === "true"
            ? "/app/data/uploads/profile_pics"
            : path.resolve(process.cwd(), "./uploads/profile_pics"));

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const extension =
          profilePicFile.type === "image/png"
            ? "png"
            : profilePicFile.type === "image/webp"
            ? "webp"
            : "jpg";
        const filename = `user_${newUser.id}_${crypto.randomBytes(16).toString("hex")}.${extension}`;
        const filepath = path.join(uploadDir, filename);

        fs.writeFileSync(filepath, buffer);

        const [updatedUser] = await db
          .update(users)
          .set({ profileImagePath: filepath })
          .where(eq(users.id, newUser.id))
          .returning();

        if (updatedUser) {
          finalUser = updatedUser;
        }
      } catch (uploadErr) {
        console.error("Failed to save initial profile picture during registration:", uploadErr);
      }
    }

    // Send verification email asynchronously
    sendVerificationEmail(finalUser.email, code, finalUser.preferredLanguage || "en", false).catch(
      (err) => console.error("Async email dispatch error:", err)
    );

    return NextResponse.json(formatUserResponse(finalUser), { status: 201 });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { detail: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
