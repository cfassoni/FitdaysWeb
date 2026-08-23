import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sharedLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createAccessToken } from "@/lib/auth";
import { logSharedLinkAccess } from "@/lib/sharedLinkFormat";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const token = resolvedParams?.token;

    if (!token) {
      return NextResponse.json({ detail: "Token is required" }, { status: 400 });
    }

    const link = await db.query.sharedLinks.findFirst({
      where: eq(sharedLinks.token, token),
    });

    if (!link) {
      return NextResponse.json({ detail: "Shared link not found" }, { status: 404 });
    }

    const now = new Date();
    if (link.expiresAt && new Date(link.expiresAt) < now) {
      return NextResponse.json({ detail: "Shared link has expired" }, { status: 410 });
    }

    if (!link.passwordHash) {
      return NextResponse.json({ message: "No password required for this link" });
    }

    const body = await req.json();
    const { password } = body;

    if (!password || !(await verifyPassword(password, link.passwordHash))) {
      await logSharedLinkAccess(link.id, "failed_password", req);
      return NextResponse.json({ detail: "Incorrect password" }, { status: 401 });
    }

    await logSharedLinkAccess(link.id, "success_password_verified", req);

    const guestJwt = await createAccessToken(
      {
        sub: `guest:${link.id}`,
        type: "guest",
        link_id: link.id,
      },
      "60m"
    );

    return NextResponse.json({ guest_token: guestJwt });
  } catch (err) {
    console.error("Verify public link error:", err);
    return NextResponse.json(
      { detail: "An error occurred during password verification" },
      { status: 500 }
    );
  }
}
