import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db/client";
import { fitdaysRecords } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const ids = body.record_ids || body.ids;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ detail: "record_ids or ids must be an array of numbers" }, { status: 400 });
    }

    const deletedIds: number[] = [];
    const failedDeletions: { id: number; reason: string }[] = [];

    for (const rawId of ids) {
      const recId = Number(rawId);
      const record = await db.query.fitdaysRecords.findFirst({
        where: eq(fitdaysRecords.id, recId),
      });

      if (!record) {
        failedDeletions.push({ id: recId, reason: "not_found" });
      } else if (record.userId !== user.id) {
        failedDeletions.push({ id: recId, reason: "unauthorized" });
      } else {
        await db.delete(fitdaysRecords).where(eq(fitdaysRecords.id, recId));
        deletedIds.push(recId);
      }
    }

    return NextResponse.json({
      deleted: deletedIds,
      failed: failedDeletions,
    });
  } catch (err) {
    console.error("Delete records error:", err);
    return NextResponse.json(
      { detail: "An error occurred while deleting records" },
      { status: 500 }
    );
  }
});
