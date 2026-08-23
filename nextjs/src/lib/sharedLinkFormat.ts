import { sharedLinks, sharedLinkAuditLogs, users } from "@/db/schema";
import { verifyAccessToken } from "./auth";
import { db } from "@/db/client";

export type SharedLinkSelect = typeof sharedLinks.$inferSelect;
export type AuditLogSelect = typeof sharedLinkAuditLogs.$inferSelect;

export function formatSharedLinkResponse(
  link: SharedLinkSelect,
  auditLogs: AuditLogSelect[] = []
) {
  let entryCount = 0;
  try {
    const entries = JSON.parse(link.snapshotData);
    entryCount = entries.length;
  } catch {
    entryCount = 0;
  }

  const successLogs = auditLogs.filter((log) => log.status === "success" || log.status.startsWith("success"));
  const accessCount = successLogs.length;

  let lastAccessedAt: string | null = null;
  if (successLogs.length > 0) {
    const dates = successLogs
      .map((l) => l.accessedAt ? new Date(l.accessedAt).getTime() : 0)
      .filter((t) => t > 0);
    if (dates.length > 0) {
      lastAccessedAt = new Date(Math.max(...dates)).toISOString();
    }
  }

  return {
    id: link.id,
    token: link.token,
    description: link.description,
    has_password: Boolean(link.passwordHash),
    include_attachments: link.includeAttachments,
    expires_at: link.expiresAt ? new Date(link.expiresAt).toISOString() : null,
    created_at: link.createdAt ? new Date(link.createdAt).toISOString() : new Date().toISOString(),
    entry_count: entryCount,
    access_count: accessCount,
    last_accessed_at: lastAccessedAt,
  };
}

export async function logSharedLinkAccess(
  linkId: string,
  statusStr: string,
  req: Request
) {
  try {
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;

    await db.insert(sharedLinkAuditLogs).values({
      sharedLinkId: linkId,
      status: statusStr,
      ipAddress: ipAddress ? ipAddress.split(",")[0].trim() : null,
      userAgent,
      accessedAt: new Date(),
    });
  } catch (err) {
    console.error("Failed to log shared link access:", err);
  }
}

export async function verifyGuestToken(
  link: SharedLinkSelect,
  authHeader: string | null,
  queryGuestToken: string | null = null
): Promise<boolean> {
  if (!link.passwordHash) {
    return true;
  }

  let tokenVal: string | null = null;
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    tokenVal = authHeader.substring(7).trim();
  } else if (queryGuestToken) {
    tokenVal = queryGuestToken;
  }

  if (!tokenVal) {
    return false;
  }

  const payload = await verifyAccessToken(tokenVal);
  if (!payload || payload.type !== "guest" || payload.link_id !== link.id) {
    return false;
  }

  return true;
}
