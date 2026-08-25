import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { MAX_RESET_PASSWORD_ATTEMPTS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tokenOrCode = body.token_or_code || body.token || body.code;
    const email = body.email;

    if (!tokenOrCode) {
      return NextResponse.json({ valid: false });
    }

    const cleanToken = String(tokenOrCode).trim();

    let user;
    if (email) {
      user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase().trim()),
      });
      if (!user) {
        return NextResponse.json({ valid: false });
      }
      const match = user.resetPasswordToken === cleanToken || user.resetPasswordCode === cleanToken;
      if (!match) {
        return NextResponse.json({ valid: false });
      }
    } else {
      user = await db.query.users.findFirst({
        where: or(
          eq(users.resetPasswordToken, cleanToken),
          eq(users.resetPasswordCode, cleanToken)
        ),
      });
      if (!user) {
        return NextResponse.json({ valid: false });
      }
    }

    if (user.resetPasswordAttempts >= MAX_RESET_PASSWORD_ATTEMPTS) {
      return NextResponse.json({ valid: false });
    }

    if (!user.resetPasswordExpiresAt) {
      return NextResponse.json({ valid: false });
    }

    const now = new Date();
    const expiry = new Date(user.resetPasswordExpiresAt);
    if (expiry < now) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, email: user.email });
  } catch (err) {
    console.error("Validate reset token error:", err);
    return NextResponse.json({ valid: false });
  }
}
