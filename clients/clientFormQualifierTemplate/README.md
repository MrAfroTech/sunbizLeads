## Client Form Qualifier Template — AI Lead Urgency Scoring

Blue/white themed **template** for lead intake + urgency scoring workflows you can white-label for individual clients.

### What this does

- **Form intake**: Captures `first_name`, `last_name`, `email`, `sms`, stores lead in Supabase.
- **Typeform delivery**: Sends the Typeform link via **Brevo email** (and optionally via SMS using a pluggable provider).
- **Typeform webhook**: Accepts Typeform “form_response” events, extracts `budget` + `purchase_timeline`.
- **Rule-based scoring**: Assigns **Tier 1 / 2 / 3** using your rules.
- **Storage**: Persists responses + tier in Supabase.
- **Sales alert**: If **Tier 1**, alerts sales via **Brevo email** and (optionally) SMS using the same SMS provider interface.

### Repo layout

- `apps/api`: Node API (webhooks + email/SMS sending + Supabase writes)
- `apps/web`: React UI (blue/white admin + intake test page)
- `packages/shared`: shared scoring + parsing utilities
- `supabase`: SQL schema

### Environment variables (per-deployment)

Create `apps/api/.env`:

```bash
PORT=8787
PUBLIC_BASE_URL=http://localhost:8787

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Typeform
TYPEFORM_WEBHOOK_SECRET=
TYPEFORM_FORM_URL=https://form.typeform.com/to/YOUR_FORM_ID

# Brevo (Sendinblue) - set per client
BREVO_API_KEY=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=Client Brand Name
SALES_ALERT_EMAIL=

# Optional: SMS adapter (not implemented yet)
SMS_PROVIDER=stub
SALES_ALERT_PHONE=
```

Create `apps/web/.env`:

```bash
VITE_API_BASE_URL=http://localhost:8787
```

### Supabase setup

Run the SQL in `supabase/schema.sql` in your Supabase project SQL editor.

### Run locally

```bash
cd apps/api
npm install
npm run dev
```

In another terminal:

```bash
cd apps/web
npm install
npm run dev
```

### Webhooks

- **Typeform webhook endpoint**: `POST /webhooks/typeform`
  - Configure Typeform to send “form response” events to:
    - `http://localhost:8787/webhooks/typeform` (local)
    - `https://<your-domain>/webhooks/typeform` (prod)

### Important: associating Typeform responses to the right lead

Best practice is to pass the lead id through Typeform as a hidden field.

- **In your Typeform link**, append a hidden param:
  - `https://form.typeform.com/to/YOUR_FORM_ID#lead_id=<LEAD_UUID>`
- The webhook handler will use that `lead_id` to attach the response to the correct row in `leads`.

