import { NextResponse } from "next/server";
import { signAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * Eigenständiger Admin-Login: E-Mail + Passwort werden gegen ADMIN_EMAIL /
 * ADMIN_PASSWORD aus den Env-Variablen geprüft. Kein E-Mail-Code nötig.
 */
export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  const expectedEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD || "";

  if (!expectedEmail || !expectedPassword) {
    return NextResponse.json(
      { success: false, message: "Admin-Login ist nicht konfiguriert (ADMIN_EMAIL / ADMIN_PASSWORD fehlen)." },
      { status: 500 }
    );
  }

  const emailOk = String(email || "").toLowerCase() === expectedEmail;
  const pwOk = String(password || "") === expectedPassword;

  // TEMPORÄRE DIAGNOSE – nach dem Test wieder entfernen.
  console.log("[ADMIN-LOGIN DEBUG]", {
    receivedEmail: String(email || ""),
    receivedPwLength: String(password || "").length,
    expectedEmail,
    expectedPwLength: expectedPassword.length,
    emailOk,
    pwOk,
  });

  if (!emailOk || !pwOk) {
    return NextResponse.json(
      { success: false, message: "E-Mail oder Passwort falsch." },
      { status: 401 }
    );
  }

  const token = signAdminToken(expectedEmail);
  if (!token) {
    return NextResponse.json({ success: false, message: "Konfigurationsfehler." }, { status: 500 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}

/** Admin-Logout: Cookie entfernen. */
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return res;
}
