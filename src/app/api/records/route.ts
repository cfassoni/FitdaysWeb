import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db/client";
import { recompRecords } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { formatRecordResponse } from "@/lib/recordFormat";

export const GET = withAuth(async (req, { user }) => {
  try {
    const records = await db.query.recompRecords.findMany({
      where: eq(recompRecords.userId, user.id),
      orderBy: [asc(recompRecords.date)],
      with: {
        report: true,
      },
    });

    const formatted = records.map((r) => formatRecordResponse(r, r.report));
    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Get records error:", err);
    return NextResponse.json(
      { detail: "An error occurred while fetching records" },
      { status: 500 }
    );
  }
});
