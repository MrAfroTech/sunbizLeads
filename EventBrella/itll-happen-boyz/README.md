# EventBrella New Client White Lable System

**Client-agnostic baseline** for new ticketing clients. No client-specific values are committed; all such inputs are placeholders or environment variables.

---

## Quick links

| Document | Purpose |
|----------|---------|
| **[TEMPLATE_README.md](./TEMPLATE_README.md)** | What this system includes, what stays placeholder, how deploy works. |
| **[SOP_ONBOARDING_NEW_TICKETING_CLIENT.md](./SOP_ONBOARDING_NEW_TICKETING_CLIENT.md)** | Step-by-step checklist of client-specific inputs when onboarding a new ticketing client. |
| **[PLACEHOLDERS_REFERENCE.md](./PLACEHOLDERS_REFERENCE.md)** | Quick reference of config/env placeholders. |
| **[WHITE_LABEL_PLACEHOLDERS.md](./WHITE_LABEL_PLACEHOLDERS.md)** | **Full list of white-label placeholders** (CLIENT_*) for find-and-replace when onboarding a new client. |

---

## For new clients

1. **Do not** commit a `.vercel` directory—each deployment is a **new Vercel project**.
2. **Stripe & Klaviyo** – Tied to the **service we provide** (EventBrella). Same Stripe and Klaviyo across clients; **not** templated or per-client.
3. **Placeholders** – Only client identity, database, and copy: replace or set `CLIENT_NAME`, `ORGANIZER_NAME`, `BASE_URL`, `DATABASE_URL` per client using the SOP.

Follow **[SOP_ONBOARDING_NEW_TICKETING_CLIENT.md](./SOP_ONBOARDING_NEW_TICKETING_CLIENT.md)** for the full onboarding checklist.

---

## Tech stack

- **Payments:** Stripe Checkout + webhook  
- **Hosting:** Vercel (new project per client)  
- **Database:** PostgreSQL (e.g. Vercel Postgres, Supabase)  
- **Email / marketing:** Klaviyo  

See [TEMPLATE_README.md](./TEMPLATE_README.md) for structure and [TEST_MODE.md](./TEST_MODE.md) for test mode.
