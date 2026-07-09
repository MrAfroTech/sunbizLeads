/**
 * Creates Brevo contacts from contacts.json and adds each to the TeamLeads list.
 * Reads from ./contacts.json and writes created contacts + log to this folder.
 *
 * Run from seamlesslyAutomation/jira-automation:
 *   npm run create-contacts
 * Or: node ../brevo-contact-automation/create-contacts.js
 *
 * Requires .env in jira-automation with BREVO_API_KEY and BREVO_LIST_ID.
 */
import dotenv from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env: optional sibling jira-automation, then local (local overrides)
dotenv.config({ path: join(__dirname, "..", "jira-automation", ".env") });
dotenv.config({ path: join(__dirname, ".env") });

const DELAY_MS = 500;
const CONTACTS_PATH = join(__dirname, "contacts.json");
const OUTPUT_JSON_PATH = join(__dirname, "created-contacts.json");
const OUTPUT_LOG_PATH = join(__dirname, "run.log");

const BREVO_CONTACTS_URL = "https://api.brevo.com/v3/contacts";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const logLines = [];

function log(msg) {
  const line = typeof msg === "string" ? msg : JSON.stringify(msg);
  console.log(line);
  logLines.push(line);
}

async function createContact(apiKey, listId, contact) {
  const email = String(contact.email || "").trim().toLowerCase();
  if (!email) throw new Error("Contact email is required.");

  const payload = {
    email,
    attributes: {
      FIRSTNAME: String(contact.firstName || "").trim(),
      LASTNAME: String(contact.lastName || "").trim(),
      PHONE: String(contact.phone || "").trim(),
    },
    listIds: [listId],
    updateEnabled: true,
  };

  const res = await fetch(BREVO_CONTACTS_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(text || `Brevo API ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  let id = null;
  try {
    if (text) id = JSON.parse(text).id;
  } catch (_) {}
  return { email, id };
}

async function main() {
  const apiKey = process.env.BREVO_API_KEY;
  const listIdRaw = process.env.BREVO_LIST_ID;
  const listId = listIdRaw ? parseInt(String(listIdRaw).trim(), 10) : NaN;

  if (!apiKey) {
    log("Missing BREVO_API_KEY in .env.");
    writeFileSync(OUTPUT_LOG_PATH, logLines.join("\n"), "utf8");
    process.exit(1);
  }
  if (!Number.isInteger(listId) || listId < 1) {
    log("Missing or invalid BREVO_LIST_ID in .env (e.g. 18 for TeamLeads).");
    writeFileSync(OUTPUT_LOG_PATH, logLines.join("\n"), "utf8");
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(readFileSync(CONTACTS_PATH, "utf8"));
  } catch (err) {
    log("Failed to read contacts.json: " + err.message);
    writeFileSync(OUTPUT_LOG_PATH, logLines.join("\n"), "utf8");
    process.exit(1);
  }

  const contacts = Array.isArray(data.contacts) ? data.contacts : [];
  if (!contacts.length) {
    log("contacts.json must contain a 'contacts' array with at least one contact.");
    writeFileSync(OUTPUT_LOG_PATH, logLines.join("\n"), "utf8");
    process.exit(1);
  }

  const output = {
    createdAt: new Date().toISOString(),
    listId,
    created: [],
    summary: { total: 0, failed: 0 },
  };

  log("Creating contacts and adding to list ID " + listId + " (TeamLeads)\n");

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const label = contact.email || `${contact.firstName} ${contact.lastName}`.trim() || "contact " + (i + 1);
    try {
      const result = await createContact(apiKey, listId, contact);
      log("  Created " + result.email);
      output.created.push({
        email: result.email,
        id: result.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
      });
      output.summary.total++;
      await delay(DELAY_MS);
    } catch (err) {
      log("  Failed " + label + ": " + (err.body || err.message));
      output.summary.failed++;
      if (err.status) output.lastError = { status: err.status, body: err.body };
    }
  }

  log("");
  log("Done. " + output.summary.total + " created, " + output.summary.failed + " failed.");
  writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2), "utf8");
  writeFileSync(OUTPUT_LOG_PATH, logLines.join("\n"), "utf8");
  log("Output saved to: " + OUTPUT_JSON_PATH + ", " + OUTPUT_LOG_PATH);
}

main();
