import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import sql from "@/lib/db";

/**
 * Zentraler Auth-Layer.
 *
 * Wichtig: API-Routen dürfen Autorisierungs-Entscheidungen NIE auf IDs aus
 * Body/Query stützen, sondern ausschließlich auf die hier ermittelte Session.
 */

export type UserType = "segler" | "verein";

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

/**
 * Verlangt eine eingeloggte Session, deren E-Mail in ADMIN_EMAILS steht.
 */
export async function requireAdmin(): Promise<AuthContext | NextResponse> {
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
  return auth;
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
