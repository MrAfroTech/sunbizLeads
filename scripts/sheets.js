import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const SPREADSHEET_ID = process.env.SUNBIZ_SPREADSHEET_ID;

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (raw) {
    const creds = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }
  const credPath = resolve(
    process.cwd(),
    'credentials',
    'google-sheets-service-account.json'
  );
  if (existsSync(credPath)) {
    const creds = JSON.parse(readFileSync(credPath, 'utf8'));
    return new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }
  throw new Error(
    'GOOGLE_SERVICE_ACCOUNT env var or credentials/google-sheets-service-account.json required'
  );
}

export async function appendToSheet(tab, leads) {
  if (!leads.length) return;
  if (!SPREADSHEET_ID)
  throw new Error('SUNBIZ_SPREADSHEET_ID env var is required');
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  const rows = leads.map((l) => [
    l.name,
    l.source,
    l.layer === 'est' ? 'Established' : 'New Biz',
    l.filingDate,
    l.county,
    l.type,
    l.locations,
    l.score,
    l.techFit,
    l.status,
    l.contact,
    'Pending',
    new Date().toISOString().slice(0, 10),
  ]);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A1`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: rows },
  });
}

export async function getExistingNames(tab) {
  if (!SPREADSHEET_ID) return new Set();
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A:A`,
  });
  return new Set((res.data.values || []).flat().filter(Boolean));
}

/**
 * Read both tabs and return { leads, lastRun } for the dashboard API.
 */
export async function getAllLeads() {
  if (!SPREADSHEET_ID) return { leads: [], lastRun: null };
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  const tabs = ['Est-Live', 'New-Live'];
  let allLeads = [];
  let lastRun = null;

  for (const tab of tabs) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${tab}!A:M`,
      });
      const [headers, ...rows] = res.data.values || [];
      if (!rows.length) continue;

      const leads = rows.map((r) => ({
        name: r[0],
        source: r[1],
        layer: r[2] === 'Established' ? 'est' : 'new',
        filingDate: r[3],
        county: r[4],
        type: r[5],
        locations: r[6],
        score: typeof r[7] === 'number' ? r[7] : +r[7] || 0,
        techFit: r[8],
        status: r[9],
        contact: r[10],
        outreachStatus: r[11],
        runDate: r[12],
      }));
      allLeads = [...allLeads, ...leads];
      const dates = leads.map((l) => l.runDate).filter(Boolean).sort();
      if (dates.length) {
        const latest = dates[dates.length - 1];
        if (!lastRun || latest > lastRun) lastRun = latest;
      }
    } catch {
      // tab may not exist yet
    }
  }

  return { leads: allLeads, lastRun };
}
