# How to Test the ezTickets Client Request Flow

## 1. Test the form (submit to Supabase)

1. **Serve the form** (pick one):
   - **Local:** From `ezTickets` folder run `npx serve .` → open **http://localhost:3000/white-label-form.html**
   - **Vercel:** Deploy and open your project URL + `/white-label-form.html`

2. **Fill the form:**
   - **Client name** and **Client display name** (required).
   - Optionally fill other fields or use **Pre-fill example**.

3. **Click “Submit Client Request”.**
   - You should see: **“Request submitted. It will be processed shortly.”**
   - If you see a config or CORS error, check [SUPABASE_CLIENT_REQUESTS.md](./SUPABASE_CLIENT_REQUESTS.md) and that `config.json` or Vercel env has `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

4. **Verify in Supabase:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Table Editor** → **client_ticket_requests**.
   - You should see a new row with **status = pending** and the data you entered.

---

## 2. Test the automation script (process pending requests)

1. **Ensure env is set:**
   - In **EventBrella/.env** you must have:
     - `SUPABASE_URL=https://your-project.supabase.co`
     - `SUPABASE_SERVICE_KEY=your-service-role-key`  
   (Get the service role key from Supabase → Settings → API → service_role.)

2. **Run the script:**
   ```bash
   cd /Users/missioncontrol/SeamlessMarketplace/EventBrella
   node process-client-requests.js
   ```

3. **Expected output:**
   - If there are pending rows: `Fetching pending client_ticket_requests...` → `Found N pending request(s).` → for each: `Processing request <id>` → `Wrote prompt to ...` → then it runs `agent chat ...` (or errors if `agent` isn’t installed).
   - If none: `No pending requests.`

4. **Verify in Supabase again:**
   - After a successful run, the row’s **status** should change to **completed** (with **generated_directory_path** and **agent_output**) or **error** (with **error_message** and **agent_output**).

---

## 3. Quick checklist

| Step | What to do | How to confirm |
|------|------------|-----------------|
| Form loads | Open white-label-form.html via http(s) | Page loads, no file:// banner |
| Config loads | Click “Submit Client Request” (with required fields) | No config/CORS error |
| Insert works | Submit once | “Request submitted…” + new row in Supabase with status = pending |
| Script runs | `node process-client-requests.js` | Logs “Processing request…” and exits without crash |
| Script updates DB | After script run | Row status = completed or error in Supabase |

---

## 4. Common issues

- **Config / CORS:** Don’t open the form as `file://`. Use `npx serve .` or Vercel. For local, have `ezTickets/config.json` (copy from `config.json.example`) with `supabaseUrl` and `supabaseAnonKey`.
- **404 on client_ticket_requests:** Run the SQL in [supabase-client-requests.sql](./supabase-client-requests.sql) in Supabase SQL Editor once to create the table.
- **“Install Supabase JS”:** From EventBrella run `npm install @supabase/supabase-js`.
- **Script can’t find agent:** The script uses the Cursor Agent CLI: `agent chat "..."`. Install it with `curl https://cursor.com/install -fsSL | bash`, then restart the terminal. See [SUPABASE_CLIENT_REQUESTS.md](./SUPABASE_CLIENT_REQUESTS.md) for details.
