# How to Import CSV Files into Google Sheets

## Step 1: Create New Google Sheet
1. Go to: https://sheets.google.com
2. Click "+ Blank" to create new spreadsheet
3. Name it: "Speaking Opportunities - Automation"

## Step 2: Import Each CSV File

### Import opportunities.csv (Main Sheet)
1. The default "Sheet1" will become your Opportunities tab
2. File → Import
3. Upload tab → Select `opportunities.csv`
4. Import location: "Replace current sheet"
5. Separator type: "Comma"
6. Convert text to numbers: YES
7. Click "Import data"
8. Rename "Sheet1" to "Opportunities" (right-click tab → Rename)

### Import follow-up-log.csv
1. Click "+" at bottom left to create new sheet
2. File → Import
3. Upload tab → Select `follow-up-log.csv`
4. Import location: "Replace current sheet"
5. Click "Import data"
6. Rename sheet to "Follow-Up Log"

### Import response-log.csv
1. Create new sheet (click "+")
2. File → Import → Upload `response-log.csv`
3. Import location: "Replace current sheet"
4. Rename to "Response Log"

### Import error-log.csv
1. Create new sheet (click "+")
2. File → Import → Upload `error-log.csv`
3. Import location: "Replace current sheet"
4. Rename to "Error Log"

### Import metrics.csv
1. Create new sheet (click "+")
2. File → Import → Upload `metrics.csv`
3. Import location: "Replace current sheet"
4. Rename to "Metrics"

## Step 3: Format the Opportunities Sheet

### Freeze Header Row
1. Go to Opportunities tab
2. View → Freeze → 1 row

### Format Header Row
1. Select Row 1 (click the "1")
2. Make bold: Ctrl/Cmd + B
3. Background color: Blue (#4285F4)
4. Text color: White

### Set Up Dropdowns

**For Column C (event_type):**
1. Click column "C" header (selects entire column)
2. Data → Data validation
3. Criteria: "List of items"
4. Values: `Conference, University, Podcast, Association`
5. Save

**For Column N (status):**
1. Click column "N" header
2. Data → Data validation
3. Criteria: "List of items"
4. Values: `New, Qualified, Contacted, Interested, Declined, Booked, No Response`
5. Save

### Format Date Columns
1. Select columns D, Q, R, T, Z, AA (hold Ctrl/Cmd while clicking column headers)
2. Format → Number → Date

### Format Number Columns
1. Select columns A, L, O, Y
2. Format → Number → Number

## Step 4: Fix Metrics Formulas (IMPORTANT)

The Metrics sheet formulas reference "Opportunities" and "Follow-Up Log" sheets.

1. Go to Metrics tab
2. Click cell B2 (first formula)
3. If formula shows an error, manually update it:
   - Change `Opportunities!A:A` references to match your sheet name
   - Change `'Follow-Up Log'!C:C` references to match your sheet name
4. Copy formula down for all metric rows

## Step 5: Share with Service Account

1. Click "Share" button (top right)
2. Paste your service account email:
   `second-flame-338521@appspot.gserviceaccount.com`
3. Change permission to "Editor"
4. UNCHECK "Notify people"
5. Click "Share"

> **Note:** Your service account email may differ. Run `node config/test-credentials.js` from the aiAgents folder to see the correct email.

## Step 6: Get Sheet ID

1. Look at URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
2. Copy the SHEET_ID (between /d/ and /edit)
3. Save this - you'll need it for n8n workflows

## Step 7: Test Connection

1. In your terminal, run: `node config/test-credentials.js`
2. Verify credentials work
3. Update n8n workflows with your Sheet ID

## Troubleshooting

**Issue: Formulas not working in Metrics sheet**
- Solution: Manually re-type the formula in cell B2, replacing sheet names if needed

**Issue: Dropdowns not appearing**
- Solution: Re-apply data validation (Data → Data validation)

**Issue: Dates showing as numbers**
- Solution: Select date columns → Format → Number → Date

**Issue: "Permission denied" in n8n**
- Solution: Verify you shared sheet with service account email (Editor permission)

## You're Done!

Your Google Sheet is now ready for automation. The workflows will populate data automatically.
