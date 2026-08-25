import { NextRequest, NextResponse } from "next/server";
import { processEmailVerification } from "@/lib/verification";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const code = searchParams.get("code");

    if (!email || !code) {
      return NextResponse.json(
        { detail: "Email and code parameters are required" },
        { status: 400 }
      );
    }

    const result = await processEmailVerification(email, code);

    if (result.error) {
      return NextResponse.json({ detail: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data);
  } catch (err) {
    console.error("Verify email GET error:", err);
    return NextResponse.json(
      { detail: "An error occurred during verification" },
      { status: 500 }
    );
  }
}
