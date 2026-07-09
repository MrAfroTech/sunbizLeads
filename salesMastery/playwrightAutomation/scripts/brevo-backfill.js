/**
 * One-time Brevo → Supabase backfill for `brevo_contacts`.
 *
 * Requires (env): BREVO_API_KEY, VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
 * (same vars as salesMasteryTracker). Optionally loads sibling `.env` files
 * without adding dependencies — see `loadOptionalEnvFiles`.
 *
 * Run from playwrightAutomation:
 *   node scripts/brevo-backfill.js
 *
 * Uses Supabase PostgREST over fetch because this package does not include
 * @supabase/supabase-js (see package.json).
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BREVO_CONTACTS_URL = "https://api.brevo.com/v3/contacts";
/** Supabase / PostgREST target — must match your DB table name */
const BREVO_CONTACTS_TABLE = "brevo_contacts";
const LIST_LIMIT = 100;
const UPSERT_CHUNK = 80;

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

function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

function mapContactToRow(contact) {
  const email = String(contact.email || "")
    .trim()
    .toLowerCase();
  if (!email) return null;

  const attrs = contact.attributes || {};
  const listIds = Array.isArray(contact.listIds) ? contact.listIds : [];
  const listName = listIds.length ? listIds.join(",") : null;

  let tags = null;
  if (Array.isArray(contact.tags) && contact.tags.length) {
    tags = contact.tags.map((t) => String(t));
  }

  const createdAt = contact.createdAt || null;

  return {
    email,
    first_name: firstNonEmpty(
      attrs.FIRSTNAME,
      attrs.firstname,
      contact.firstName
    ),
    last_name: firstNonEmpty(attrs.LASTNAME, attrs.lastname, contact.lastName),
    phone: firstNonEmpty(attrs.SMS, attrs.PHONE, attrs.phone, contact.phone),
    company: firstNonEmpty(attrs.COMPANY, attrs.company, contact.company),
    title: firstNonEmpty(
      attrs.JOB_TITLE,
      attrs.TITLE,
      attrs.job_title,
      contact.title
    ),
    list_name: listName,
    tags,
    date_added: createdAt,
    updated_at: new Date().toISOString(),
  };
}

async function fetchBrevoPage(apiKey, limit, offset) {
  const url = new URL(BREVO_CONTACTS_URL);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "api-key": apiKey,
    },
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(text || `Brevo HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(`Brevo response JSON parse failed: ${e.message}`);
  }

  const contacts = Array.isArray(data.contacts) ? data.contacts : [];
  const count =
    typeof data.count === "number" && Number.isFinite(data.count)
      ? data.count
      : null;

  return { contacts, count };
}

async function upsertRows(supabaseUrl, supabaseKey, rows) {
  const base = supabaseUrl.replace(/\/$/, "");
  const url = `${base}/rest/v1/${BREVO_CONTACTS_TABLE}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(text || `Supabase HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
}

async function main() {
  loadOptionalEnvFiles();

  const brevoKey = process.env.BREVO_API_KEY;
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!brevoKey) {
    console.error("Missing BREVO_API_KEY");
    process.exit(1);
  }
  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Missing Supabase env: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL / SUPABASE_ANON_KEY)"
    );
    process.exit(1);
  }

  console.log(
    `Writing contacts to Supabase table "${BREVO_CONTACTS_TABLE}" (POST /rest/v1/${BREVO_CONTACTS_TABLE})`
  );

  let totalHint = null;
  let offset = 0;
  let processed = 0;
  let upserted = 0;

  while (true) {
    let page;
    try {
      page = await fetchBrevoPage(brevoKey, LIST_LIMIT, offset);
    } catch (e) {
      console.error(
        `[batch fetch failed] offset=${offset} limit=${LIST_LIMIT}:`,
        e.message || e
      );
      offset += LIST_LIMIT;
      if (totalHint !== null && offset >= totalHint) break;
      continue;
    }

    if (totalHint === null && page.count !== null) {
      totalHint = page.count;
      console.log(`Brevo reports total contacts: ${totalHint}`);
    }

    const { contacts } = page;
    if (!contacts.length) break;

    const rows = [];
    for (const c of contacts) {
      const row = mapContactToRow(c);
      if (row) rows.push(row);
    }

    for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
      const chunk = rows.slice(i, i + UPSERT_CHUNK);
      try {
        await upsertRows(supabaseUrl, supabaseKey, chunk);
        upserted += chunk.length;
      } catch (e) {
        console.error(
          `[upsert batch failed] offset=${offset} chunk ${i / UPSERT_CHUNK}:`,
          e.message || e
        );
      }
    }

    processed += contacts.length;
    const suffix =
      totalHint !== null ? ` / ${totalHint}` : "";
    console.log(`Processed ${processed}${suffix} contacts from Brevo...`);

    offset += LIST_LIMIT;
    if (contacts.length < LIST_LIMIT) break;
    if (totalHint !== null && offset >= totalHint) break;
  }

  console.log(`Done. Rows upserted (successful batches): ${upserted}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
