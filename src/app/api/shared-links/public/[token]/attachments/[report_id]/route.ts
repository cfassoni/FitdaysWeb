import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sharedLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logSharedLinkAccess, verifyGuestToken } from "@/lib/sharedLinkFormat";
import fs from "fs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; report_id: string }> | { token: string; report_id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const token = resolvedParams?.token;
    const reportId = Number(resolvedParams?.report_id);

    if (!token || !reportId) {
      return NextResponse.json({ detail: "Invalid token or report ID" }, { status: 400 });
    }

    const link = await db.query.sharedLinks.findFirst({
      where: eq(sharedLinks.token, token),
    });

    if (!link) {
      return NextResponse.json({ detail: "Shared link not found" }, { status: 404 });
    }

    const now = new Date();
    if (link.expiresAt && new Date(link.expiresAt) < now) {
      await logSharedLinkAccess(link.id, "expired_attachment_access", req);
      return NextResponse.json({ detail: "Shared link has expired" }, { status: 410 });
    }

    const authHeader = req.headers.get("authorization");
    const { searchParams } = new URL(req.url);
    const guestToken = searchParams.get("guest_token");

    const isGuestAuthorized = await verifyGuestToken(link, authHeader, guestToken);
    if (!isGuestAuthorized) {
      return NextResponse.json(
        { detail: "Password required for this shared link" },
        { status: 401 }
      );
    }

    if (!link.includeAttachments) {
      return NextResponse.json(
        { detail: "Attachments are not shared for this link" },
        { status: 403 }
      );
    }

    let entries: Array<Record<string, unknown>> = [];
    try {
      entries = JSON.parse(link.snapshotData);
    } catch {
      return NextResponse.json(
        { detail: "Failed to parse shared data snapshot" },
        { status: 500 }
      );
    }

    let reportInfo: { file_path: string; mime_type: string; filename: string } | null = null;
    for (const r of entries) {
      const rep = r.report as { id: number; file_path: string; mime_type: string; filename: string } | null | undefined;
      if (rep && rep.id === reportId) {
        reportInfo = rep;
        break;
      }
    }

    if (!reportInfo || !reportInfo.file_path) {
      return NextResponse.json(
        { detail: "Attachment report not found in this shared link" },
        { status: 404 }
      );
    }

    if (!fs.existsSync(reportInfo.file_path)) {
      return NextResponse.json(
        { detail: "Attachment file not found on disk" },
        { status: 404 }
      );
    }

    await logSharedLinkAccess(link.id, `success_attachment_download_${reportId}`, req);

    const fileBuffer = fs.readFileSync(reportInfo.file_path);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": reportInfo.mime_type || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(reportInfo.filename || "report")}"`,
      },
    });
  } catch (err) {
    console.error("Public attachment error:", err);
    return NextResponse.json(
      { detail: "An error occurred while fetching attachment" },
      { status: 500 }
    );
  }
}
