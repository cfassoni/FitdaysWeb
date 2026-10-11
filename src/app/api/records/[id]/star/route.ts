import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db/client";
import { fitdaysRecords } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { syncAutoShareLinksForUser } from "@/lib/sharedLinkFormat";

export const POST = withAuth(async (req, { user, params }) => {
  try {
    const recordId = Number(params?.id);
    if (!recordId) {
      return NextResponse.json({ detail: "Invalid record ID" }, { status: 400 });
    }

    const record = await db.query.fitdaysRecords.findFirst({
      where: and(
        eq(fitdaysRecords.id, recordId),
        eq(fitdaysRecords.userId, user.id)
      ),
    });

    if (!record) {
      return NextResponse.json({ detail: "Record not found" }, { status: 404 });
    }

    let targetStarred: boolean;
    try {
      const body = await req.json();
      if (typeof body?.starred === "boolean") {
        targetStarred = body.starred;
      } else {
        targetStarred = !record.starred;
      }
    } catch {
      targetStarred = !record.starred;
    }

    const [updated] = await db
      .update(fitdaysRecords)
      .set({ starred: targetStarred })
      .where(and(eq(fitdaysRecords.id, recordId), eq(fitdaysRecords.userId, user.id)))
      .returning();

    // Sincroniza links compartilhados com auto-share ativo
    await syncAutoShareLinksForUser(user.id);

    return NextResponse.json({
      success: true,
      id: recordId,
      starred: Boolean(updated?.starred),
    });
  } catch (err) {
    console.error("Toggle record star error:", err);
    return NextResponse.json(
      { detail: "An error occurred while toggling star" },
      { status: 500 }
    );
  }
});
