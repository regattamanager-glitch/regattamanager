import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * App-Einstieg (für die Desktop-App): keine Startseite.
 * - Gültige Session vorhanden  -> direkt auf das passende Dashboard.
 * - Keine/abgelaufene Session   -> Login.
 * Dadurch bleibt ein eingeloggter Nutzer nach dem Neustart der App angemeldet
 * (das Session-Cookie wird vom Desktop-Client dauerhaft gespeichert).
 */
export default async function StartPage() {
  let target = "/login";

  const cookieStore = await cookies();
  const sessionId =
    cookieStore.get("session_id")?.value || cookieStore.get("session")?.value;

  if (sessionId) {
    try {
      const sql = neon(process.env.DATABASE_URL!);
      const rows = await sql`
        SELECT "userId", "userType", expires
        FROM "Session"
        WHERE id = ${sessionId}
        LIMIT 1
      `;
      const s = rows[0];
      if (s && new Date(s.expires) > new Date()) {
        if (s.userType === "segler") target = `/dashboard/segler/${s.userId}`;
        else if (s.userType === "verein") target = `/dashboard/verein/${s.userId}`;
        else if (s.userType === "federation") target = `/dashboard/federation/${s.userId}`;
      }
    } catch {
      /* Bei DB-Fehler einfach zum Login */
    }
  }

  redirect(target);
}
