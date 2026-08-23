import { NextResponse } from "next/server";
import { openApiSpec, isSwaggerEnabled } from "@/lib/openapi";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSwaggerEnabled()) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }

  return NextResponse.json(openApiSpec);
}
