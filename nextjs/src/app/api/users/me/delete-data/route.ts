import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { verifyPassword } from "@/lib/auth";
import { db } from "@/db/client";
import { fitdaysRecords, sharedLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendDataDeletedEmail } from "@/lib/email";

export const POST = withAuth(async (req, { user }) => {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ detail: "Password is required" }, { status: 400 });
    }

    const isValid = await verifyPassword(password, user.hashedPassword);
    if (!isValid) {
      return NextResponse.json({ detail: "Incorrect password" }, { status: 400 });
    }

    // Delete records and shared links belonging to user
    const deletedRecords = await db
      .delete(fitdaysRecords)
      .where(eq(fitdaysRecords.userId, user.id))
      .returning();

    const deletedLinks = await db
      .delete(sharedLinks)
      .where(eq(sharedLinks.ownerId, user.id))
      .returning();

    sendDataDeletedEmail(user.email, user.preferredLanguage || "en").catch((err) =>
      console.error("Async email error:", err)
    );

    return NextResponse.json({
      message: "All workout records and shared links have been deleted successfully",
      deleted_records_count: deletedRecords.length,
      deleted_shared_links_count: deletedLinks.length,
    });
  } catch (err) {
    console.error("Delete data error:", err);
    return NextResponse.json(
      { detail: "An error occurred while deleting user data" },
      { status: 500 }
    );
  }
});
