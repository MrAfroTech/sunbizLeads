# Supabase client request flow (ezTickets)

Automated submission and processing of client ticket requests using Supabase.

---

## 1. Create Supabase table

In **Supabase SQL Editor**, run the contents of:

- **`ezTickets/supabase-client-requests.sql`**

This creates `client_ticket_requests` with all form fields, `ticketing_tiers` (JSONB), `status`, `created_at`, `generated_directory_path`, `processed_at`, `error_message`, `agent_output` (Cursor agent stdout/stderr), and indexes on `status` and `created_at`. If the table already existed, run the migration in the SQL file to add `agent_output`: `ALTER TABLE client_ticket_requests ADD COLUMN IF NOT EXISTS agent_output TEXT;`

---

## 2. Environment and config

**EventBrella `.env`** (one level up from ezTickets):

- `SUPABASE_URL` — your Supabase project URL  
- `SUPABASE_ANON_KEY` — anon/public key (for frontend)  
- `SUPABASE_SERVICE_KEY` — service role key (for backend automation only; do not expose to frontend)

**Config for the form (two options):**

1. **Preferred when deployed on Vercel:** Set **SUPABASE_URL** and **SUPABASE_ANON_KEY** in the Vercel project’s environment variables. The form loads config from **`/api/supabase-config`**, which returns those values with **CORS** allowing:
   - Any **\*.vercel.app** origin (all Vercel deployment URLs)
   - Any **\*.eventbrella.com** origin
   So the form works when served from any Vercel or eventbrella.com domain without CORS errors.

2. **Static / same-origin:** Use **EventBrella `config.json`** (gitignored). Copy `EventBrella/config.json.example` to `EventBrella/config.json` and set `supabaseUrl` and `supabaseAnonKey`. The form falls back to `../config.json` when the API is not available. Do **not** put `SUPABASE_SERVICE_KEY` in `config.json`.

**Note:** Opening the form as a **file://** URL will always fail to load config (browser security). Serve the form over **https** (e.g. Vercel or eventbrella.com) to use “Submit Client Request”.

Serve the form from a server (e.g. Vercel or local dev server) so that `../config.json` resolves to EventBrella’s `config.json`.

---

## 3. Form: “Submit Client Request”

- **`ezTickets/white-label-form.html`** includes:
  - Supabase JS (CDN)
  - “Submit Client Request” button
  - Status message area
  - Validation of required fields (Client name, Client display name)
  - Insert into `client_ticket_requests` with `status = 'pending'`
  - Optional form clear after success

---

## 4. Automation script

**Location:** `EventBrella/process-client-requests.js`

**Requirements:**

- Node.js
- From EventBrella (or a directory that can require it): `npm install @supabase/supabase-js`
- `.env` with `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and **`CURSOR_API_KEY`** (for headless agent runs — get it from [Cursor Dashboard → Integrations → API keys](https://cursor.com/dashboard?tab=integrations))

**Make it executable (once):**

```bash
chmod +x /path/to/EventBrella/process-client-requests.js
```

**Run manually:**

```bash
cd /path/to/EventBrella
node process-client-requests.js
```

The script:

1. Connects to Supabase with the service key  
2. Selects rows where `status = 'pending'`  
3. For each row: builds the Cursor prompt via `buildCursorPrompt`, writes it to a temp file, runs the **Cursor Agent CLI** (`agent chat "$(cat promptfile)"`), captures stdout/stderr, then updates the row to `completed` (with `generated_directory_path` and `agent_output`) or `error` (with `error_message` and `agent_output`).

**Cursor Agent CLI (required):** The script uses Cursor’s agent, not the Anthropic API. Install once:

```bash
curl https://cursor.com/install -fsSL | bash
```

For **automation (cron)**: you do *not* need to run `source ~/.zshrc`. The script adds `$HOME/.local/bin` to PATH when running the agent. If `agent` is installed elsewhere, set **AGENT_PATH** in `.env` to the full path (e.g. `AGENT_PATH=/Users/you/.local/bin/agent`). Optional: **PROCESS_AGENT_CMD** to override the full command (use `%s` for the prompt file path).

---

## 5. Cron (every 5 minutes)

**macOS / Linux (crontab):**

```bash
crontab -e
```

Add:

```
*/5 * * * * cd /path/to/EventBrella && node process-client-requests.js >> /tmp/process-client-requests.log 2>&1
```

Replace `/path/to/EventBrella` with the real path (e.g. `/Users/missioncontrol/SeamlessMarketplace/EventBrella`).

**Alternative (launchd on macOS):** create a plist that runs the same command every 5 minutes.

---

## Flow summary

1. Client fills ezTickets form and clicks **Submit Client Request**.  
2. Data is saved to Supabase `client_ticket_requests` with `status = 'pending'`.  
3. Every 5 minutes (or on manual run), `process-client-requests.js` runs.  
4. It picks up pending rows, generates the Cursor prompt, runs the Cursor Agent CLI (`agent chat`) to build the client system, captures the agent output, then sets `status` to `completed` or `error` and stores the response in `agent_output` in Supabase.
