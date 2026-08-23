import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { formatUserResponse } from "@/lib/userFormat";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const POST = withAuth(async (req, { user }) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ detail: "No file provided" }, { status: 400 });
    }

    // 1. Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { detail: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // 2. Validate file size (max 4MB)
    const MAX_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { detail: "File size exceeds the 4MB limit." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Determine upload directory
    const uploadDir =
      process.env.UPLOAD_DIR ||
      (process.env.DOCKER_MODE === "true"
        ? "/app/data/uploads/profile_pics"
        : path.resolve(process.cwd(), "./uploads/profile_pics"));

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `user_${user.id}_${crypto.randomBytes(16).toString("hex")}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    // Delete old profile picture if exists
    if (user.profileImagePath && fs.existsSync(user.profileImagePath)) {
      try {
        fs.unlinkSync(user.profileImagePath);
      } catch (err) {
        console.warn("Failed to remove old avatar:", err);
      }
    }

    fs.writeFileSync(filepath, buffer);

    const [updatedUser] = await db
      .update(users)
      .set({ profileImagePath: filepath })
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json(formatUserResponse(updatedUser));
  } catch (err) {
    console.error("Profile picture upload error:", err);
    return NextResponse.json(
      { detail: "An error occurred while uploading profile picture" },
      { status: 500 }
    );
  }
});
