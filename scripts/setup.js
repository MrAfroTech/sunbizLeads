/**
 * One-time setup: create Est-Live and New-Live tabs and write header rows.
 * Run once locally: npm run setup
 */
import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import 'dotenv/config';

const SPREADSHEET_ID = process.env.SUNBIZ_SPREADSHEET_ID;

const HEADERS = [
  'Name',
  'Source',
  'Layer',
  'Filing Date',
  'County',
  'Type',
  'Locations',
  'Score',
  'Tech Fit',
  'Status',
  'Contact',
  'Outreach Status',
  'Run Date',
];

const TABS = ['Est-Live', 'New-Live'];

function getCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (raw) return typeof raw === 'string' ? JSON.parse(raw) : raw;
  const credPath = resolve(
    process.cwd(),
    'credentials',
    'google-sheets-service-account.json'
  );
  if (existsSync(credPath)) return JSON.parse(readFileSync(credPath, 'utf8'));
  throw new Error(
    'GOOGLE_SERVICE_ACCOUNT env or credentials/google-sheets-service-account.json required'
  );
}

async function setup() {
  if (!SPREADSHEET_ID)
    throw new Error('SUNBIZ_SPREADSHEET_ID is required');

  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existing = meta.data.sheets.map((s) => s.properties.title);

  const toCreate = TABS.filter((t) => !existing.includes(t));
  if (toCreate.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: toCreate.map((title) => ({
          addSheet: { properties: { title } },
        })),
      },
    });
    console.log(`Created tabs: ${toCreate.join(', ')}`);
  }

  for (const tab of TABS) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [HEADERS] },
    });
    console.log(`✓ Headers written to ${tab}`);
  }

  console.log('Setup complete.');
}

setup().catch(console.error);
