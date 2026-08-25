import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createAccessToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    let email = "";
    let password = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      email = body.email || body.username || "";
      password = body.password || "";
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      email = (formData.get("username") || formData.get("email") || "") as string;
      password = (formData.get("password") || "") as string;
    } else {
      const text = await req.text();
      try {
        const body = JSON.parse(text);
        email = body.email || body.username || "";
        password = body.password || "";
      } catch {
        const params = new URLSearchParams(text);
        email = params.get("username") || params.get("email") || "";
        password = params.get("password") || "";
      }
    }

    if (!email || !password) {
      return NextResponse.json(
        { detail: "Incorrect email or password" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });

    if (!user || !(await verifyPassword(password, user.hashedPassword))) {
      return NextResponse.json(
        { detail: "Incorrect email or password" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      );
    }

    if (!user.emailConfirmed) {
      return NextResponse.json(
        { detail: "EMAIL_NOT_CONFIRMED" },
        { status: 403 }
      );
    }

    const accessToken = await createAccessToken({
      sub: user.email,
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
      access_token: accessToken,
      token_type: "bearer",
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { detail: "An error occurred during login" },
      { status: 500 }
    );
  }
}
