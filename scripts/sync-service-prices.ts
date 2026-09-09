/** Imports service prices and durations from the Bookly SQL export. */
import { readFileSync } from "node:fs";
import { getDb } from "../src/lib/db.server";

const file = process.argv[2] ?? "/mnt/user-uploads/wp_bookly_services.sql";
const dump = readFileSync(file, "utf8");
const rows = [...dump.matchAll(
  /^\((\d+), (?:\d+|NULL), '(?:simple|collaborative|compound|package)', '((?:[^'\\]|\\.)*)', (?:NULL|\d+), (\d+), 'default', ([\d.]+),/gm,
)];

const ALIAS: Record<string, string> = { chin: "chinfrom", side: "sidefrom" };
const norm = (t: string) => t.replace(/\\'/g, "'").toLowerCase().replace(/makeup/g, "make up").replace(/[^a-z0-9]+/g, " ").trim();
const map = new Map<string, { price: number; dur: number }>();
for (const m of rows) {
  const price = Number(m[4]);
  const dur = Math.max(10, Math.round(Number(m[3]) / 60));
  if (price <= 0) continue;
  map.set(norm(m[2]!), { price, dur });
}

const sql = getDb();
const tokens = (t: string) => new Set(norm(t).split(" ").filter((w) => w.length > 1 && !["with","and","the","for","only","per"].includes(w)));
const sourceTokens = [...map.entries()].map(([key, value]) => ({ key, value, set: tokens(key) }));
function fuzzy(name: string) {
  const want = tokens(name);
  let best: { value: { price: number; dur: number }; score: number } | null = null;
  for (const entry of sourceTokens) {
    let shared = 0;
    for (const w of want) if (entry.set.has(w)) shared++;
    const score = shared / Math.max(want.size, entry.set.size, 1);
    if (!best || score > best.score) best = { value: entry.value, score };
  }
  return best && best.score >= 0.6 ? best.value : null;
}

const svc = await sql<{ id: string; name: string }[]>`select id, name from services`;
let updated = 0;
const missing: string[] = [];
for (const row of svc) {
  const key = norm(row.name);
  const hit = map.get(ALIAS[key] ?? key) ?? map.get(key) ?? fuzzy(row.name);
  if (!hit) { missing.push(row.name); continue; }
  await sql`update services set price = ${hit.price}, duration_minutes = ${hit.dur}, updated_at = now() where id = ${row.id}`;
  updated++;
}
console.log(JSON.stringify({ source: map.size, services: svc.length, updated, missing }, null, 1));
process.exit(0);
