/**
 * Google Sheets client. Speaking workflow: getDoc()/getSheet() use SPREADSHEET_ID.
 * Florida Sunbiz: getSunbizDoc()/getSunbizSheet() use SUNBIZ_SPREADSHEET_ID.
 */
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env');
require('dotenv').config({ path: envPath });

const configPath = path.resolve(process.cwd(), 'config', 'credentials-config');
const { getGoogleSheetsCredentials } = require(configPath);
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

let doc = null;
let sunbizDoc = null;

async function getDoc() {
  if (doc) return doc;
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!spreadsheetId || spreadsheetId === 'PASTE_YOUR_SPREADSHEET_ID_HERE') {
    throw new Error('Set SPREADSHEET_ID in .env to your Google Sheet ID');
  }
  const creds = getGoogleSheetsCredentials();
  const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const newDoc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
  try {
    await newDoc.loadInfo();
  } catch (err) {
    const is404 = err.response?.status === 404 || err.message?.includes('404');
    if (is404) {
      throw new Error(
        `Google Sheets 404: Spreadsheet not found. Check SPREADSHEET_ID and share sheet with: ${creds.client_email}`
      );
    }
    throw err;
  }
  doc = newDoc;
  return doc;
}

async function getSheet(title) {
  const d = await getDoc();
  const sheet = d.sheetsByTitle[title];
  if (!sheet) throw new Error(`Sheet "${title}" not found. Create it in your spreadsheet.`);
  return sheet;
}

/** Opportunity row as object (headers from row 1) */
function rowToOpportunity(headers, values) {
  const row = {};
  headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
  return row;
}

/** Append one row to Error Log sheet (skips if sheet is unreachable, e.g. 404) */
async function logError(workflowName, errorMessage) {
  try {
    const msg = String(errorMessage);
    if (msg.includes('404') || msg.includes('Spreadsheet not found')) {
      console.error(`[${workflowName}]`, msg);
      return;
    }
    const sheet = await getSheet('Error Log');
    await sheet.addRow({
      workflow: workflowName,
      error: msg.slice(0, 500),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });
  } catch (e) {
    console.error('Failed to write to Error Log:', e.message);
  }
}

// ---- Florida Sunbiz (SUNBIZ_SPREADSHEET_ID) ----

async function getSunbizDoc() {
  if (sunbizDoc) return sunbizDoc;
  const spreadsheetId = process.env.SUNBIZ_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error('SUNBIZ_SPREADSHEET_ID env var missing');

  const creds = getGoogleSheetsCredentials();
  const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sunbizDoc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
  await sunbizDoc.loadInfo();
  return sunbizDoc;
}

async function getSunbizSheet(sheetTitle) {
  const d = await getSunbizDoc();
  let sheet = d.sheetsByTitle[sheetTitle];
  if (!sheet) sheet = await d.addSheet({ title: sheetTitle });
  if (sheet.rowCount > 0) await sheet.loadHeaderRow();
  return sheet;
}

module.exports = {
  getDoc,
  getSheet,
  rowToOpportunity,
  logError,
  getSunbizDoc,
  getSunbizSheet,
};
