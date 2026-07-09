# Brevo Contact Automation – How It Works

End-to-end flow for creating Brevo contacts from `contacts.json` and adding them to the TeamLeads list.

---

## A. Prerequisites

- **Node.js 18+** (ES modules; native `fetch` used).
- **Brevo account** and API key.
- **Brevo list** (e.g. "TeamLeads") — you need its list ID (e.g. `18`).

---

## B. Configuration

1. **API key**  
   Get it from [Brevo → Settings → API Keys](https://app.brevo.com/settings/keys/api).

2. **`.env`**  
   In the **jira-automation** folder (sibling of `brevo-contact-automation`), set:
   - `BREVO_API_KEY` – your Brevo API key.
   - `BREVO_LIST_ID` – the list ID (e.g. `18` for TeamLeads).

3. **How the script finds `.env`**  
   The script loads `.env` from the sibling folder:  
   `../jira-automation/.env`.

---

## C. Input: contacts.json

- **File:** `contacts.json` in the `brevo-contact-automation` folder.
- **Shape:** `{ "contacts": [ { "firstName", "lastName", "email", "phone" } ] }`.
- **Required:** Only `email` is required per contact. See **CONTACT_DATA_FORMAT.md** for full rules.

---

## D. Create-contact flow (single contact)

1. **HTTP:** `POST https://api.brevo.com/v3/contacts`
2. **Headers:** `api-key: <BREVO_API_KEY>`, `Content-Type: application/json`
3. **Body:**  
   `{ "email", "attributes": { "FIRSTNAME", "LASTNAME", "PHONE" }, "listIds": [ <BREVO_LIST_ID> ], "updateEnabled": true }`
4. **Result:** Contact is created (or updated if same email). The script logs the email and records it in the output file.

---

## E. Full run

1. **Load** `.env` from `../jira-automation/.env`.
2. **Read** `contacts.json` from the script directory.
3. **For each** entry in `contacts`:
   - Build payload (email, FIRSTNAME, LASTNAME, PHONE, listIds, updateEnabled).
   - `POST` to Brevo `/v3/contacts`.
   - **Delay** 500 ms before the next request.
   - Log success or failure.
4. **Write** `created-contacts.json` (created emails, listId, summary) and `run.log` (console log) in `brevo-contact-automation`.

---

## F. Delays

- **500 ms** between each API call to reduce rate limiting and transient errors.

---

## G. Output files

- **created-contacts.json** – `createdAt`, `listId`, `created` (array of `{ email, id, firstName, lastName }`), `summary` (total, failed), and on errors `lastError`.
- **run.log** – Same lines as the console for the run.

---

## H. How to run

From **jira-automation** (inside seamlesslyAutomation):

```bash
npm run create-contacts
```

Or:

```bash
node ../brevo-contact-automation/create-contacts.js
```

From **brevo-contact-automation** (if you have dependencies in the parent):

```bash
node create-contacts.js
```

(Ensure `.env` is in `jira-automation` so the script can load it.)

---

## I. Summary diagram

```
.env (BREVO_API_KEY, BREVO_LIST_ID) in jira-automation
    ↓
contacts.json in brevo-contact-automation
    ↓
create-contacts.js (loads .env from ../jira-automation, reads contacts.json)
    ↓
For each contact: POST /v3/contacts (attributes + listIds) → delay
    ↓
Console log + created-contacts.json + run.log in brevo-contact-automation
```
