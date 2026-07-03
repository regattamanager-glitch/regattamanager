// Bereitet den Next.js-Standalone-Server für die Bündelung in der Desktop-App vor.
// Nach `next build` (output: 'standalone') fehlen im Standalone-Ordner noch
// `.next/static`, `public` und die Env-Datei – die kopieren wir hierher.
import { cpSync, existsSync, copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");

if (!existsSync(join(standalone, "server.js"))) {
  console.error("FEHLER: .next/standalone/server.js fehlt. Zuerst `next build` ausführen.");
  process.exit(1);
}

// 1) Statische Assets
mkdirSync(join(standalone, ".next"), { recursive: true });
cpSync(join(root, ".next", "static"), join(standalone, ".next", "static"), { recursive: true });

// 2) public/
if (existsSync(join(root, "public"))) {
  cpSync(join(root, "public"), join(standalone, "public"), { recursive: true });
}

// 3) Env-Dateien (DATABASE_URL, SMTP, STRIPE, ADMIN_* …) mitnehmen,
//    damit der gebündelte Server sie zur Laufzeit lesen kann.
for (const f of [".env", ".env.local", ".env.production"]) {
  if (existsSync(join(root, f))) copyFileSync(join(root, f), join(standalone, f));
}

console.log("✓ Standalone-Server vorbereitet:", standalone);
