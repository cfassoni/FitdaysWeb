import { NextRequest, NextResponse } from "next/server";
import { processEmailVerification } from "@/lib/verification";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { detail: "Email and code are required" },
        { status: 400 }
      );
    }

    const result = await processEmailVerification(email, code);

    if (result.error) {
      return NextResponse.json({ detail: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data);
  } catch (err) {
    console.error("Verify code error:", err);
    return NextResponse.json(
      { detail: "An error occurred during verification" },
      { status: 500 }
    );
  }
}
