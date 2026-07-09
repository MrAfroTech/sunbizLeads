/**
 * Import Event_Company.csv into public.event_companies (salesMastery Supabase).
 *
 * Run from playwrightAutomation:
 *   node scripts/import-event-companies.js [path/to/Event_Company.csv]
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TABLE = "event_companies";
const UPSERT_CHUNK = 50;
const DEFAULT_CSV = join(
  __dirname,
  "..",
  "..",
  "lists",
  "emailLists",
  "Event_Company.csv"
);

function loadOptionalEnvFiles() {
  const roots = [
    join(__dirname, ".env"),
    join(__dirname, "..", ".env"),
    join(__dirname, "..", "..", "salesMasteryTracker", ".env"),
  ];
  for (const filePath of roots) {
    if (!existsSync(filePath)) continue;
    const text = readFileSync(filePath, "utf8");
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  fields.push(current);
  return fields;
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function clean(value) {
  const s = String(value ?? "").trim();
  return s || null;
}

function mapRow(row) {
  const email = clean(row.email);
  if (!email) return null;
  return {
    segment: clean(row.segment),
    region: clean(row.region),
    company_name: clean(row.company_name),
    website: clean(row.website),
    email,
    phone: clean(row.phone),
    target_title: clean(row.target_title),
    source_url: clean(row.source_url),
    notes: clean(row.notes),
    business_category: clean(row.business_category),
    business_type: clean(row.business_type),
    business_group: clean(row.business_group),
  };
}

async function upsertRows(supabaseUrl, supabaseKey, rows) {
  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${TABLE}?on_conflict=email`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upsert failed (${res.status}): ${body}`);
  }
}

async function main() {
  loadOptionalEnvFiles();

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  const csvPath = resolve(process.argv[2] || DEFAULT_CSV);
  if (!existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const raw = readFileSync(csvPath, "utf8");
  const parsed = parseCsv(raw);
  const rows = parsed.map(mapRow).filter(Boolean);

  if (!rows.length) {
    console.error("No rows with email found in CSV.");
    process.exit(1);
  }

  console.log(`Importing ${rows.length} contacts into ${TABLE} from ${csvPath}`);

  let upserted = 0;
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    await upsertRows(supabaseUrl, supabaseKey, chunk);
    upserted += chunk.length;
    console.log(`Upserted ${upserted}/${rows.length}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
