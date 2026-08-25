import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, TokenPayload } from "./auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AuthenticatedUser = typeof users.$inferSelect;

export type AuthenticatedHandler = (
  req: NextRequest,
  context: { user: AuthenticatedUser; tokenPayload: TokenPayload; params?: Record<string, string | string[]> }
) => Promise<NextResponse | Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, { params }: { params?: Promise<Record<string, string | string[]>> | Record<string, string | string[]> } = {}) => {
    const tokenPayload = await getSessionFromRequest(req);

    if (!tokenPayload || !tokenPayload.sub) {
      return NextResponse.json(
        { detail: "Could not validate credentials" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      );
    }

    // Find user by email (sub is email in current token convention) or id
    const email = tokenPayload.sub;
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.emailConfirmed) {
      return NextResponse.json(
        { detail: "Could not validate credentials" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;

    return handler(req, { user, tokenPayload, params: resolvedParams });
  };
}
