import { describe, it, expect, beforeAll } from "vitest";

// lib/auth.ts importiert lib/db.ts (neon braucht eine Connection-URL) –
// Dummy-Werte setzen, BEVOR das Modul geladen wird.
beforeAll(() => {
  process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";
  process.env.ADMIN_PASSWORD = "test-admin-secret";
  process.env.ADMIN_EMAIL = "admin@example.com";
});

describe("signAdminToken", () => {
  it("erzeugt ein Token im Format payload.hmac", async () => {
    const { signAdminToken } = await import("@/lib/auth");
    const token = signAdminToken("Admin@Example.com");
    expect(token).toBeTruthy();
    const [payload, mac] = token!.split(".");
    expect(Buffer.from(payload, "base64url").toString("utf8")).toBe("admin@example.com");
    expect(mac).toMatch(/^[0-9a-f]{64}$/);
  });

  it("liefert für dieselbe E-Mail deterministisch dasselbe Token", async () => {
    const { signAdminToken } = await import("@/lib/auth");
    expect(signAdminToken("a@b.de")).toBe(signAdminToken("A@B.DE"));
  });

  it("gibt null zurück, wenn kein ADMIN_PASSWORD gesetzt ist", async () => {
    const { signAdminToken } = await import("@/lib/auth");
    const prev = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;
    try {
      expect(signAdminToken("a@b.de")).toBeNull();
    } finally {
      process.env.ADMIN_PASSWORD = prev;
    }
  });
});

describe("stripSensitive", () => {
  it("entfernt Passwort-Hash und Reset-Token aus Objekten", async () => {
    const { stripSensitive } = await import("@/lib/auth");
    const user = {
      id: "1",
      email: "x@y.de",
      passwort: "hash",
      reset_token: "tok",
      reset_token_expires: "2026-01-01",
    };
    const clean = stripSensitive(user) as Record<string, unknown>;
    expect(clean).toEqual({ id: "1", email: "x@y.de" });
    // Original bleibt unverändert (keine Mutation)
    expect(user.passwort).toBe("hash");
  });

  it("verarbeitet Arrays elementweise", async () => {
    const { stripSensitive } = await import("@/lib/auth");
    const rows = [
      { id: "1", passwort: "a" },
      { id: "2", reset_token: "b" },
    ];
    expect(stripSensitive(rows)).toEqual([{ id: "1" }, { id: "2" }]);
  });

  it("reicht Primitives und null unverändert durch", async () => {
    const { stripSensitive } = await import("@/lib/auth");
    expect(stripSensitive(null)).toBeNull();
    expect(stripSensitive("text")).toBe("text");
    expect(stripSensitive(42)).toBe(42);
  });
});

describe("unauthorized / forbidden", () => {
  it("unauthorized liefert 401 mit Fehlermeldung", async () => {
    const { unauthorized } = await import("@/lib/auth");
    const res = unauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeTruthy();
  });

  it("forbidden liefert 403 mit eigener Meldung", async () => {
    const { forbidden } = await import("@/lib/auth");
    const res = forbidden("Adminrechte erforderlich");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Adminrechte erforderlich");
  });
});
