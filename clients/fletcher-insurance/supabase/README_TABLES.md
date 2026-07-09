# Tables

This app uses **`public.agents`** and **`public.leads`** only.

- **`agents`** — Default assignee (`assigned_agent_id` on `leads`).
- **`leads`** — Contact fields (`first_name`, `last_name`, `email`, `phone`, …) **and** Typeform/scoring fields on the same row: `budget`, `purchase_timeline`, `urgency_tier`, `lead_score`, `lead_category`, `raw_typeform`, `typeform_token`, `form_submitted_at`.

There is **no** `lead_responses` table in the current design.

Other tables in your project (`lead_activities`, `lead_routing_rules`, etc.) are **not** used by this codebase unless you extend it.

## New columns on existing `leads`

Run **`migrations/20250318190000_typeform_columns_on_leads.sql`** in the SQL editor, or apply the full **`schema.sql`** on a fresh project.
