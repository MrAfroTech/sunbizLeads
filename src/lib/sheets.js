/**
 * Google Sheets push (gapi client in browser).
 * Append leads to 'Est-Live' and 'New-Live' tabs.
 * Requires REACT_APP_SPREADSHEET_ID and gapi loaded (e.g. via script tag + gapi.client.init).
 */
const SHEET_ID = typeof process !== 'undefined' && process.env?.REACT_APP_SPREADSHEET_ID
  ? process.env.REACT_APP_SPREADSHEET_ID
  : (typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_SPREADSHEET_ID) || import.meta.env?.VITE_SPREADSHEET_ID;

/**
 * Append rows to a sheet tab by name.
 * @param {string} tabName - Sheet tab name (e.g. 'Est-Live', 'New-Live')
 * @param {object[]} leads - Lead objects with name, source, layer, filed, county, type, locations, score, techFit, status, contact
 */
async function appendToTab(tabName, leads) {
  if (!leads.length) return;
  if (!window.gapi?.client?.sheets) {
    console.warn('Sheets API not loaded; skipping push to', tabName);
    return;
  }
  if (!SHEET_ID) {
    console.warn('REACT_APP_SPREADSHEET_ID not set; skipping push to', tabName);
    return;
  }

  const rows = leads.map((l) => [
    l.name,
    l.source,
    l.layer === 'est' ? 'Established' : 'New Biz',
    l.filed,
    l.county,
    l.type,
    l.locations,
    l.score,
    l.techFit,
    l.status,
    l.contact,
    'Pending',
    new Date().toISOString(),
  ]);

  await window.gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: rows },
  });
}

/**
 * Push leads to Est-Live and New-Live tabs.
 * Column order: Name | Source | Layer | Filing Date | County | Type | Locations | Score | Tech Fit | Status | Contact | Outreach Status | Run Date
 * @param {object[]} leads
 */
export async function pushToSheets(leads) {
  const estLeads = leads.filter((l) => l.layer === 'est');
  const newLeads = leads.filter((l) => l.layer === 'new');
  await appendToTab('Est-Live', estLeads);
  await appendToTab('New-Live', newLeads);
}
