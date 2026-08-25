import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.SECRET_KEY || "fitdays_super_secret_key_12345_change_in_production";
  return new Uint8Array(Buffer.from(secret, "utf-8"));
}
const ALGORITHM = "HS256";

export const MAX_VERIFICATION_ATTEMPTS = 5;
export const MAX_RESET_PASSWORD_ATTEMPTS = 5;
export const VERIFICATION_CODE_EXPIRE_HOURS = 24;
export const RESET_PASSWORD_EXPIRE_HOURS = 1;
export function getAccessTokenExpiryMinutes(): number {
  const envVal = process.env.ACCESS_TOKEN_EXPIRE_MINUTES;
  if (envVal && !isNaN(Number(envVal)) && Number(envVal) > 0) {
    return Number(envVal);
  }
  return 1440; // Default: 24 hours
}

export function getAccessTokenExpiry(): string {
  return `${getAccessTokenExpiryMinutes()}m`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function getVerificationExpiry(): Date {
  const d = new Date();
  d.setHours(d.getHours() + VERIFICATION_CODE_EXPIRE_HOURS);
  return d;
}

export function getResetExpiry(): Date {
  const d = new Date();
  d.setHours(d.getHours() + RESET_PASSWORD_EXPIRE_HOURS);
  return d;
}

export interface TokenPayload {
  sub: string;
  userId?: number;
  email?: string;
  [key: string]: unknown;
}

export async function createAccessToken(payload: TokenPayload, expiresIn?: string): Promise<string> {
  const exp = expiresIn || getAccessTokenExpiry();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(getSecretKey());
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: [ALGORITHM],
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  return null;
}

export async function getSessionFromRequest(req: Request): Promise<TokenPayload | null> {
  // 1. Check Authorization: Bearer <token> header
  const authHeader = req.headers.get("authorization");
  const bearerToken = extractTokenFromHeader(authHeader);
  if (bearerToken) {
    return verifyAccessToken(bearerToken);
  }

  // 2. Check cookie header
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/session=([^;]+)/);
    if (match && match[1]) {
      return verifyAccessToken(match[1]);
    }
  }

  return null;
}
