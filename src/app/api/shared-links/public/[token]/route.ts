import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sharedLinks } from "@/db/schema";
import { safeToISOString } from "@/lib/dateUtils";
import { eq } from "drizzle-orm";

export async function GET(
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
      with: {
        owner: true,
      },
    });

    if (!link) {
      return NextResponse.json({ detail: "Shared link not found" }, { status: 404 });
    }

    const now = new Date();
    if (link.expiresAt && new Date(link.expiresAt) < now) {
      return NextResponse.json({ detail: "Shared link has expired" }, { status: 410 });
    }

    let latestMeasurementDate: string | null = null;
    try {
      const entries = JSON.parse(link.snapshotData);
      if (entries && entries.length > 0) {
        const dates = entries
          .map((e: { date: string }) => new Date(e.date).getTime())
          .filter((t: number) => !isNaN(t) && t > 0);
        if (dates.length > 0) {
          latestMeasurementDate = safeToISOString(new Date(Math.max(...dates)));
        }
      }
    } catch {
      // ignore
    }

    return NextResponse.json({
      id: link.id,
      description: link.description,
      has_password: Boolean(link.passwordHash),
      expires_at: safeToISOString(link.expiresAt),
      created_at: safeToISOString(link.createdAt, true),
      owner_name: link.owner?.displayName || link.owner?.email || "User",
      owner_email: link.owner?.email || "",
      latest_measurement_date: latestMeasurementDate,
    });
  } catch (err) {
    console.error("Get public link metadata error:", err);
    return NextResponse.json(
      { detail: "An error occurred while fetching shared link metadata" },
      { status: 500 }
    );
  }
}
