import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db/client";
import { sharedLinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { formatSharedLinkResponse } from "@/lib/sharedLinkFormat";
import { hashPassword } from "@/lib/auth";

export const GET = withAuth(async (req, { user, params }) => {
  try {
    const linkId = String(params?.id);
    if (!linkId) {
      return NextResponse.json({ detail: "Invalid link ID" }, { status: 400 });
    }

    const link = await db.query.sharedLinks.findFirst({
      where: and(
        eq(sharedLinks.id, linkId),
        eq(sharedLinks.ownerId, user.id)
      ),
      with: {
        auditLogs: true,
      },
    });

    if (!link) {
      return NextResponse.json({ detail: "Shared link not found" }, { status: 404 });
    }

    return NextResponse.json(formatSharedLinkResponse(link, link.auditLogs));
  } catch (err) {
    console.error("Get shared link details error:", err);
    return NextResponse.json(
      { detail: "An error occurred while fetching shared link details" },
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (req, { user, params }) => {
  try {
    const linkId = String(params?.id);
    if (!linkId) {
      return NextResponse.json({ detail: "Invalid link ID" }, { status: 400 });
    }

    const link = await db.query.sharedLinks.findFirst({
      where: and(
        eq(sharedLinks.id, linkId),
        eq(sharedLinks.ownerId, user.id)
      ),
      with: {
        auditLogs: true,
      },
    });

    if (!link) {
      return NextResponse.json({ detail: "Shared link not found" }, { status: 404 });
    }

    const body = await req.json();
    const { description, expires_at, clear_password, password } = body;

    const updates: Partial<typeof sharedLinks.$inferInsert> = {};

    if (description !== undefined) {
      updates.description = description;
    }

    if (expires_at !== undefined) {
      updates.expiresAt = expires_at ? new Date(expires_at) : null;
    }

    if (clear_password) {
      updates.passwordHash = null;
    } else if (password !== undefined && password !== "") {
      updates.passwordHash = await hashPassword(password);
    }

    const [updatedLink] = await db
      .update(sharedLinks)
      .set(updates)
      .where(eq(sharedLinks.id, linkId))
      .returning();

    return NextResponse.json(formatSharedLinkResponse(updatedLink, link.auditLogs));
  } catch (err) {
    console.error("Update shared link error:", err);
    return NextResponse.json(
      { detail: "An error occurred while updating shared link" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req, { user, params }) => {
  try {
    const linkId = String(params?.id);
    if (!linkId) {
      return NextResponse.json({ detail: "Invalid link ID" }, { status: 400 });
    }

    const link = await db.query.sharedLinks.findFirst({
      where: and(
        eq(sharedLinks.id, linkId),
        eq(sharedLinks.ownerId, user.id)
      ),
    });

    if (!link) {
      return NextResponse.json({ detail: "Shared link not found" }, { status: 404 });
    }

    await db.delete(sharedLinks).where(eq(sharedLinks.id, linkId));

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Delete shared link error:", err);
    return NextResponse.json(
      { detail: "An error occurred while deleting shared link" },
      { status: 500 }
    );
  }
});
