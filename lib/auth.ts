import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import sql from "@/lib/db";

/**
 * Zentraler Auth-Layer.
 *
 * Wichtig: API-Routen dürfen Autorisierungs-Entscheidungen NIE auf IDs aus
 * Body/Query stützen, sondern ausschließlich auf die hier ermittelte Session.
 */

export type UserType = "segler" | "verein" | "federation";

export interface AuthContext {
  sessionId: string;
  userId: string;
  userType: UserType;
}

/**
 * Liest die Session aus dem httpOnly-Cookie und validiert sie gegen die DB.
 * Gibt null zurück, wenn keine gültige Session existiert.
 */
export async function getAuth(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const sessionId =
    cookieStore.get("session_id")?.value || cookieStore.get("session")?.value;

  if (!sessionId) return null;

  const rows = await sql`
    SELECT id, "userId", "userType", expires
    FROM "Session"
    WHERE id = ${sessionId}
    LIMIT 1
  `;
  const session = rows[0];

  if (!session || new Date(session.expires) < new Date()) return null;

  return {
    sessionId: session.id,
    userId: session.userId,
    userType: session.userType as UserType,
  };
}

export function unauthorized(message = "Nicht autorisiert") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbidden(message = "Kein Zugriff") {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

/**
 * Verlangt eine eingeloggte Session. Verwendung in Route-Handlern:
 *
 *   const auth = await requireAuth();
 *   if (auth instanceof NextResponse) return auth;
 *   // ab hier ist auth vom Typ AuthContext
 */
export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const auth = await getAuth();
  if (!auth) return unauthorized();
  return auth;
}

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/* ----------------------------------------------------------------------- */
/* Eigenständiger Admin-Login (E-Mail + Passwort aus Env)                  */
/* ----------------------------------------------------------------------- */

export const ADMIN_COOKIE_NAME = "admin_auth";

function adminSecret(): string {
  return process.env.ADMIN_PASSWORD || "";
}

/**
 * Erstellt ein signiertes Admin-Token (payload.HMAC). Gibt null zurück,
 * wenn kein ADMIN_PASSWORD konfiguriert ist.
 */
export function signAdminToken(email: string): string | null {
  const secret = adminSecret();
  if (!secret) return null;
  const payload = Buffer.from(email.toLowerCase()).toString("base64url");
  const mac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

/**
 * Prüft ein Admin-Token gegen Signatur UND die konfigurierte ADMIN_EMAIL.
 * Gibt die E-Mail zurück, wenn gültig, sonst null.
 */
function verifyAdminToken(token: string | undefined): string | null {
  if (!token) return null;
  const secret = adminSecret();
  if (!secret) return null;

  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    if (mac.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  } catch {
    return null;
  }

  const email = Buffer.from(payload, "base64url").toString("utf8").toLowerCase();
  const expectedEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  if (!expectedEmail || email !== expectedEmail) return null;
  return email;
}

export interface AdminContext {
  via: "session" | "password";
  userId: string | null;
}

/**
 * Verlangt Admin-Rechte. Zwei Wege werden akzeptiert:
 *  1) Gültiges Admin-Cookie (eigenständiger Admin-Login via E-Mail+Passwort).
 *  2) Eingeloggte Session, deren E-Mail in ADMIN_EMAILS steht.
 */
export async function requireAdmin(): Promise<AdminContext | NextResponse> {
  const cookieStore = await cookies();

  // Weg 1: Admin-Cookie
  const adminEmail = verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  if (adminEmail) return { via: "password", userId: null };

  // Weg 2: Session + ADMIN_EMAILS-Allowlist
  const auth = await getAuth();
  if (!auth) return unauthorized();

  const rows =
    auth.userType === "verein"
      ? await sql`SELECT email FROM "Verein" WHERE id = ${auth.userId} LIMIT 1`
      : await sql`SELECT email FROM "Segler" WHERE id = ${auth.userId} LIMIT 1`;

  const email = String(rows[0]?.email || "").toLowerCase();
  const admins = getAdminEmails();

  if (!email || admins.length === 0 || !admins.includes(email)) {
    return forbidden("Adminrechte erforderlich");
  }
  return { via: "session", userId: auth.userId };
}

/** Felder, die niemals an den Client gelangen dürfen. */
const SENSITIVE_FIELDS = ["passwort", "reset_token", "reset_token_expires"];

/**
 * Entfernt sensible Felder (Passwort-Hash, Reset-Token) aus einem DB-Objekt
 * oder einem Array von Objekten.
 */
export function stripSensitive<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map((item) => stripSensitive(item)) as unknown as T;
  }
  if (data && typeof data === "object") {
    const copy: Record<string, unknown> = { ...(data as Record<string, unknown>) };
    for (const field of SENSITIVE_FIELDS) delete copy[field];
    return copy as T;
  }
  return data;
}
