import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { db } from "@/db/client";
import { fitdaysRecords, fitdaysReports } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { formatReportResponse } from "@/lib/recordFormat";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const GET = withAuth(async (req, { user, params }) => {
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
      with: {
        report: true,
      },
    });

    if (!record) {
      return NextResponse.json({ detail: "Record not found" }, { status: 404 });
    }

    if (!record.report) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(formatReportResponse(record.report));
  } catch (err) {
    console.error("Get report error:", err);
    return NextResponse.json(
      { detail: "An error occurred while fetching report" },
      { status: 500 }
    );
  }
});

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
      with: {
        report: true,
      },
    });

    if (!record) {
      return NextResponse.json({ detail: "Record not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ detail: "No file provided" }, { status: 400 });
    }

    const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "application/pdf"];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { detail: "Invalid file type. Only PNG, JPEG, and PDF are allowed." },
        { status: 400 }
      );
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { detail: "File size exceeds the 5MB limit." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir =
      process.env.REPORTS_DIR ||
      (process.env.DOCKER_MODE === "true"
        ? "/app/data/uploads/reports"
        : path.resolve(process.cwd(), "./uploads/reports"));

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const extension = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
    const filename = `report_${recordId}_${crypto.randomBytes(16).toString("hex")}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    // If report already exists, remove old file and DB entry
    if (record.report) {
      if (fs.existsSync(record.report.filePath)) {
        try {
          fs.unlinkSync(record.report.filePath);
        } catch (err) {
          console.warn("Failed to delete previous report file:", err);
        }
      }
      await db.delete(fitdaysReports).where(eq(fitdaysReports.recordId, recordId));
    }

    fs.writeFileSync(filepath, buffer);

    const [newReport] = await db
      .insert(fitdaysReports)
      .values({
        recordId: recordId,
        userId: user.id,
        filePath: filepath,
        filename: file.name || filename,
        mimeType: file.type,
        fileSize: buffer.length,
        uploadedAt: new Date(),
      })
      .returning();

    return NextResponse.json(formatReportResponse(newReport), { status: 201 });
  } catch (err) {
    console.error("Upload report error:", err);
    return NextResponse.json(
      { detail: "An error occurred while uploading report" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req, { user, params }) => {
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
      with: {
        report: true,
      },
    });

    if (!record) {
      return NextResponse.json({ detail: "Record not found" }, { status: 404 });
    }

    if (!record.report) {
      return NextResponse.json(
        { detail: "No report attached to this record" },
        { status: 404 }
      );
    }

    if (fs.existsSync(record.report.filePath)) {
      try {
        fs.unlinkSync(record.report.filePath);
      } catch (err) {
        console.warn("Failed to delete report file:", err);
      }
    }

    await db.delete(fitdaysReports).where(eq(fitdaysReports.recordId, recordId));

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Delete report error:", err);
    return NextResponse.json(
      { detail: "An error occurred while deleting report" },
      { status: 500 }
    );
  }
});
