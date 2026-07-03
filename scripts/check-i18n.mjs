// Prüft, ob alle Sprachdateien in messages/ dieselben Keys wie de.json haben.
// Aufruf: node scripts/check-i18n.mjs   (Exit-Code 1 bei fehlenden Keys)
import { readFileSync, readdirSync } from "fs";
import path from "path";

const messagesDir = path.join(process.cwd(), "messages");
const reference = "de.json";

function flattenKeys(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

const refKeys = new Set(
  flattenKeys(JSON.parse(readFileSync(path.join(messagesDir, reference), "utf-8")))
);

let failed = false;
for (const file of readdirSync(messagesDir).filter((f) => f.endsWith(".json"))) {
  if (file === reference) continue;
  const keys = new Set(
    flattenKeys(JSON.parse(readFileSync(path.join(messagesDir, file), "utf-8")))
  );
  const missing = [...refKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !refKeys.has(k));

  if (missing.length > 0) {
    failed = true;
    console.error(`\n${file}: ${missing.length} Keys fehlen (vorhanden in ${reference}):`);
    for (const k of missing) console.error(`  - ${k}`);
  }
  if (extra.length > 0) {
    console.warn(`\n${file}: ${extra.length} überzählige Keys (nicht in ${reference}):`);
    for (const k of extra) console.warn(`  + ${k}`);
  }
  if (missing.length === 0 && extra.length === 0) {
    console.log(`${file}: OK (${keys.size} Keys)`);
  }
}

process.exit(failed ? 1 : 0);
