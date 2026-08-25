import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const pathSegments = resolvedParams?.path || [];

    if (pathSegments.length === 0) {
      return NextResponse.json({ detail: "File not found" }, { status: 404 });
    }

    const relativePath = pathSegments.join("/");

    // Determine upload directory base
    const baseDir =
      process.env.UPLOAD_DIR
        ? path.resolve(process.env.UPLOAD_DIR, "..")
        : process.env.DOCKER_MODE === "true"
        ? "/app/data/uploads"
        : path.resolve(process.cwd(), "./uploads");

    let filePath = path.resolve(baseDir, relativePath);

    // If not found in baseDir, check custom UPLOAD_DIR or REPORTS_DIR directly
    if (!fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
      if (process.env.UPLOAD_DIR && relativePath.startsWith("profile_pics/")) {
        const sub = relativePath.replace(/^profile_pics\//, "");
        const candidate = path.resolve(process.env.UPLOAD_DIR, sub);
        if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
          filePath = candidate;
        }
      } else if (process.env.REPORTS_DIR && relativePath.startsWith("reports/")) {
        const sub = relativePath.replace(/^reports\//, "");
        const candidate = path.resolve(process.env.REPORTS_DIR, sub);
        if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
          filePath = candidate;
        }
      }
    }

    // Also check backend uploads directory during side-by-side local development
    if (!fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
      const backendUploads = path.resolve(process.cwd(), "../backend/uploads", relativePath);
      if (fs.existsSync(/*turbopackIgnore: true*/ backendUploads)) {
        filePath = backendUploads;
      }
    }

    if (!fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
      return NextResponse.json({ detail: "File not found" }, { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".csv": "text/csv",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";
    const fileBuffer = fs.readFileSync(/*turbopackIgnore: true*/ filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    console.error("Static file error:", err);
    return NextResponse.json({ detail: "File not found" }, { status: 404 });
  }
}
