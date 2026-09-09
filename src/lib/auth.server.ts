import { scrypt } from "@noble/hashes/scrypt.js";
import { bytesToHex, hexToBytes, randomBytes } from "@noble/hashes/utils.js";

import { getDb } from "./db.server";

const SCRYPT_PARAMS = { N: 2 ** 14, r: 8, p: 1, dkLen: 32 };
export const SESSION_COOKIE = "mbp_admin_session";
const SESSION_DAYS = 7;
const REMEMBER_DAYS = 30;

export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  last_login: string | null;
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const dk = scrypt(new TextEncoder().encode(password), salt, SCRYPT_PARAMS);
  return `scrypt$${bytesToHex(salt)}$${bytesToHex(dk)}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = hexToBytes(parts[1]!);
  const dk = scrypt(new TextEncoder().encode(password), salt, SCRYPT_PARAMS);
  const expected = hexToBytes(parts[2]!);
  if (dk.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < dk.length; i++) diff |= dk[i]! ^ expected[i]!;
  return diff === 0;
}

export async function createSession(userId: string, remember: boolean) {
  const sql = getDb();
  const token = bytesToHex(randomBytes(32));
  const days = remember ? REMEMBER_DAYS : SESSION_DAYS;
  const expires = new Date(Date.now() + days * 86400_000);
  await sql`insert into admin_sessions (token, user_id, expires_at) values (${token}, ${userId}, ${expires})`;
  return { token, expires, maxAge: days * 86400 };
}

function cookieFlags(request?: Request) {
  // Browsers drop `Secure` cookies on plain http (local dev), which would make
  // login silently fail there. On https we also need SameSite=None so the
  // cookie survives being served inside an iframe (the Lovable preview).
  let https = true;
  if (request) {
    const proto = request.headers.get("x-forwarded-proto");
    if (proto) {
      https = proto.split(",")[0]!.trim() === "https";
    } else {
      try {
        https = new URL(request.url).protocol === "https:";
      } catch {
        https = true;
      }
    }
  }
  return https ? "; SameSite=None; Secure" : "; SameSite=Lax";
}

export function sessionCookie(token: string, maxAge: number, request?: Request) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly${cookieFlags(request)}; Max-Age=${maxAge}`;
}

export function clearedCookie(request?: Request) {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly${cookieFlags(request)}; Max-Age=0`;
}


export function readSessionToken(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return rest.join("=") || null;
  }
  return null;
}

export async function getAdminFromRequest(
  request: Request,
): Promise<AdminUser | null> {
  const token = readSessionToken(request);
  if (!token) return null;
  const sql = getDb();
  const rows = await sql<AdminUser[]>`
    select u.id, u.full_name, u.email, u.role, u.avatar_url, u.is_active, u.last_login
    from admin_sessions s
    join admin_users u on u.id = s.user_id
    where s.token = ${token} and s.expires_at > now() and u.is_active = true
    limit 1`;
  return rows[0] ?? null;
}

export async function destroySession(request: Request) {
  const token = readSessionToken(request);
  if (!token) return;
  const sql = getDb();
  await sql`delete from admin_sessions where token = ${token}`;
}

export async function requireAdmin(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return admin;
}

export function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}
