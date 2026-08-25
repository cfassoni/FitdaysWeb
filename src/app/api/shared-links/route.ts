import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db/client";
import { sharedLinks, fitdaysRecords } from "@/db/schema";
import { eq, and, gt, isNull, or, inArray, desc } from "drizzle-orm";
import { hashPassword, generateResetToken } from "@/lib/auth";
import { formatSharedLinkResponse } from "@/lib/sharedLinkFormat";
import { formatRecordResponse } from "@/lib/recordFormat";
import crypto from "crypto";

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const {
      description,
      entry_ids,
      password,
      include_attachments = true,
      expires_at,
    } = body;

    if (!description || !entry_ids || !Array.isArray(entry_ids) || entry_ids.length === 0) {
      return NextResponse.json(
        { detail: "Description and at least one entry_id are required" },
        { status: 400 }
      );
    }

    const maxActiveLinks = parseInt(process.env.MAX_ACTIVE_SHARED_LINKS || "10", 10);
    const now = new Date();

    const activeLinks = await db.query.sharedLinks.findMany({
      where: and(
        eq(sharedLinks.ownerId, user.id),
        or(isNull(sharedLinks.expiresAt), gt(sharedLinks.expiresAt, now))
      ),
    });

    if (activeLinks.length >= maxActiveLinks) {
      return NextResponse.json(
        {
          detail: `You have reached the maximum limit of ${maxActiveLinks} active shared links. Please revoke or let old links expire before creating a new one.`,
        },
        { status: 400 }
      );
    }

    // Fetch and validate records belonging to user
    const records = await db.query.fitdaysRecords.findMany({
      where: and(
        eq(fitdaysRecords.userId, user.id),
        inArray(fitdaysRecords.id, entry_ids.map(Number))
      ),
      with: {
        report: true,
      },
    });

    if (!records || records.length === 0) {
      return NextResponse.json(
        { detail: "No valid records selected for sharing" },
        { status: 400 }
      );
    }

    // Serialize snapshot entries
    const serializedEntries = records.map((r) => {
      const formatted = formatRecordResponse(r, r.report);
      if (r.report && formatted.report) {
        (formatted.report as Record<string, unknown>).file_path = r.report.filePath;
      }
      return formatted;
    });

    const token = generateResetToken();
    const passwordHash = password ? await hashPassword(password) : null;
    const linkId = crypto.randomUUID();

    const [newLink] = await db
      .insert(sharedLinks)
      .values({
        id: linkId,
        ownerId: user.id,
        token,
        description,
        passwordHash,
        includeAttachments: Boolean(include_attachments),
        expiresAt: expires_at ? new Date(expires_at) : null,
        snapshotData: JSON.stringify(serializedEntries),
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(formatSharedLinkResponse(newLink, []), { status: 201 });
  } catch (err) {
    console.error("Create shared link error:", err);
    return NextResponse.json(
      { detail: "An error occurred while creating shared link" },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (req, { user }) => {
  try {
    const links = await db.query.sharedLinks.findMany({
      where: eq(sharedLinks.ownerId, user.id),
      orderBy: [desc(sharedLinks.createdAt)],
      with: {
        auditLogs: true,
      },
    });

    const formatted = links.map((l) => formatSharedLinkResponse(l, l.auditLogs));
    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Get shared links error:", err);
    return NextResponse.json(
      { detail: "An error occurred while fetching shared links" },
      { status: 500 }
    );
  }
});
