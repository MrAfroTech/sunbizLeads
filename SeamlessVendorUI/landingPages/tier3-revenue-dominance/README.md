# Tier 3 Revenue Dominance

This landing page is **fully self-contained**. It has its own **`/api/submit-lead`** route in this folder (`api/submit-lead.js`) and **does not depend on any external app or root directory**.

- Deploy this folder as its own Vercel project. The form posts to **`window.location.origin + '/api/submit-lead'`**, so it always calls its own endpoint regardless of the Vercel deployment URL.
- Set in Vercel **Environment Variables**: `BREVO_API_KEY`, `BREVO_LIST_ID`, `BREVO_TEMPLATE_ID`.

**Standard pattern for all future landing pages:** Use this structure—a self-contained folder with its own `api/submit-lead.js` and `index.html` that posts to the same origin—so each landing page can be deployed independently.
