import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sharedLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logSharedLinkAccess, verifyGuestToken } from "@/lib/sharedLinkFormat";

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
    });

    if (!link) {
      return NextResponse.json({ detail: "Shared link not found" }, { status: 404 });
    }

    const now = new Date();
    if (link.expiresAt && new Date(link.expiresAt) < now) {
      await logSharedLinkAccess(link.id, "expired_access", req);
      return NextResponse.json({ detail: "Shared link has expired" }, { status: 410 });
    }

    const authHeader = req.headers.get("authorization");
    const isGuestAuthorized = await verifyGuestToken(link, authHeader);

    if (!isGuestAuthorized) {
      return NextResponse.json(
        { detail: "Password required for this shared link" },
        { status: 401 }
      );
    }

    await logSharedLinkAccess(link.id, "success", req);

    let entries: Array<Record<string, unknown>> = [];
    try {
      entries = JSON.parse(link.snapshotData);
    } catch {
      return NextResponse.json(
        { detail: "Failed to parse shared data snapshot" },
        { status: 500 }
      );
    }

    // Sort by date ascending
    entries.sort(
      (a, b) => new Date(String(a.date)).getTime() - new Date(String(b.date)).getTime()
    );

    let dashboardSummary = {
      total_records: 0,
      weight_history: [] as Array<Record<string, unknown>>,
    };

    if (entries.length > 0) {
      const first = entries[0];
      const last = entries[entries.length - 1];

      const weightHistory = entries.map((r) => ({
        date: r.date,
        weight: r.weight,
        body_fat_pct: r.body_fat_pct,
        body_fat_mass: r.fat_mass,
        muscle_mass: r.muscle_mass,
        skeletal_muscle_mass: r.skeletal_muscle_mass,
        skeletal_muscle_mass_pct: r.skeletal_muscle_mass_pct,
      }));

      const round2 = (num: number) => Math.round(num * 100) / 100;

      dashboardSummary = {
        total_records: entries.length,
        first_record_date: first.date as string,
        latest_record_date: last.date as string,
        starting_weight: first.weight as number,
        current_weight: last.weight as number,
        weight_change: round2((last.weight as number) - (first.weight as number)),
        starting_body_fat: first.body_fat_pct as number,
        current_body_fat: last.body_fat_pct as number,
        body_fat_change: round2((last.body_fat_pct as number) - (first.body_fat_pct as number)),
        starting_body_fat_mass: first.fat_mass as number,
        current_body_fat_mass: last.fat_mass as number,
        body_fat_mass_change: round2((last.fat_mass as number) - (first.fat_mass as number)),
        starting_muscle_mass: first.muscle_mass as number,
        current_muscle_mass: last.muscle_mass as number,
        muscle_mass_change: round2((last.muscle_mass as number) - (first.muscle_mass as number)),
        starting_skeletal_muscle_mass: first.skeletal_muscle_mass as number,
        current_skeletal_muscle_mass: last.skeletal_muscle_mass as number,
        skeletal_muscle_mass_change: round2(
          (last.skeletal_muscle_mass as number) - (first.skeletal_muscle_mass as number)
        ),
        starting_skeletal_muscle_mass_pct: first.skeletal_muscle_mass_pct as number,
        current_skeletal_muscle_mass_pct: last.skeletal_muscle_mass_pct as number,
        skeletal_muscle_mass_pct_change: round2(
          (last.skeletal_muscle_mass_pct as number) - (first.skeletal_muscle_mass_pct as number)
        ),
        weight_history: weightHistory,
      } as unknown as typeof dashboardSummary;
    }

    // Process attachment URLs for guests
    const processedEntries = entries.map((entry) => {
      const entryCopy = { ...entry };
      const report = entryCopy.report as { id: number; url?: string } | null | undefined;
      if (link.includeAttachments && report && report.id) {
        entryCopy.report = {
          ...report,
          url: `/api/shared-links/public/${token}/attachments/${report.id}`,
        };
      } else {
        entryCopy.report = null;
      }
      return entryCopy;
    });

    return NextResponse.json({
      dashboard: dashboardSummary,
      entries: processedEntries,
    });
  } catch (err) {
    console.error("Get public link data error:", err);
    return NextResponse.json(
      { detail: "An error occurred while fetching shared link data" },
      { status: 500 }
    );
  }
}
