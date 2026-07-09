# The Capital Dinner — Landing Pages

Invite-only networking event landing pages: one for **investors**, one for **founders**. Built to match SeamlessVendorUI styling, components, and design system. Mobile responsive, minimal aesthetic.

## Routes

- **Investors:** `/capital-dinner/investors`
- **Founders:** `/capital-dinner/founders`

## How to Update Event Details (No Code Changes)

Event details are driven by **environment variables**. Set these in your `.env` or hosting dashboard (e.g. Vercel Environment Variables):

| Variable | Purpose | Example |
|----------|---------|---------|
| `REACT_APP_CAPITAL_DINNER_DATE` | Event date (display) | `Thursday, March 20, 2025` |
| `REACT_APP_CAPITAL_DINNER_TIME` | Event time | `7:00 PM - 10:00 PM` |
| `REACT_APP_CAPITAL_DINNER_VENUE_NAME` | Venue name | `Ferrari of Central Florida` |
| `REACT_APP_CAPITAL_DINNER_VENUE_LOCATION` | City/area | `Orlando` |
| `REACT_APP_CAPITAL_DINNER_CONTACT_EMAIL` | “Questions? Email …” | `events@seamlessly.us` |
| `REACT_APP_CAPITAL_DINNER_INVESTOR_SEATS` | “15 investor seats” text | `15` |
| `REACT_APP_CAPITAL_DINNER_FOUNDER_SEATS` | “12 founder spots” text | `12` |

If a variable is not set, the app uses defaults from `src/config/capitalDinnerConfig.js`. You can also edit that file for default values.

**After changing env vars:** rebuild and redeploy the app so the new values are baked in.

## Form: Request Invitation

- **Button:** “Request Invitation” opens a modal (follows SeamlessVendorUI popup patterns).
- **Endpoint:** `POST /api/capital-dinner-invite`
- **Validation:** All required fields; email format; description max 600 characters (2–3 sentences).
- **Success:** Message “Request Received” and modal can be closed; form resets on next open.

### Form Fields

| Field | Required | Notes |
|-------|----------|--------|
| Full Name | Yes | |
| Email | Yes | Valid email format |
| Company/Fund Name | Yes | Company for founders, Fund for investors |
| Brief description | Yes | Textarea, 2–3 sentences, max 600 characters (counter shown) |
| **Investors only:** Investment Focus | Yes | e.g. SaaS, AI, early-stage |
| **Founders only:** Current ARR or Funding Status | Yes | e.g. $500K ARR, Pre-seed from XYZ Angels |

### Storing Submissions

- **Optional DynamoDB:** Set `CAPITAL_DINNER_SUBMISSIONS_TABLE` (DynamoDB table name) and `AWS_REGION` (default `us-east-1`) in the **API** environment (e.g. Vercel → Project → Settings → Environment Variables). The handler will store each submission with fields: `id`, `audience`, `fullName`, `email`, `companyOrFundName`, `description`, `investmentFocus` or `arrOrFundingStatus`, `submittedAt`. Table should have a partition key (e.g. `id`).
- **Email/CRM:** To add email notifications or Klaviyo/CRM, extend the handler in `src/api/capital-dinner-invite.js` (see `api/vendor-registration.js` or `api/location-demo-request.js` for patterns).

## Local Development

- Run the app: `npm start` (from SeamlessVendorUI root).
- Open: `http://localhost:3000/capital-dinner/investors` or `http://localhost:3000/capital-dinner/founders`.
- The `/api/*` routes are served by Vercel serverless when deployed. For local testing of the form you can:
  - Deploy a preview and test against that URL, or
  - Add a proxy in `package.json` to your deployed API, or
  - Run a local server that implements `POST /api/capital-dinner-invite`.

## Files

| File | Purpose |
|------|---------|
| `src/config/capitalDinnerConfig.js` | Editable event config (env + defaults) |
| `src/components/CapitalDinnerInviteForm.js` | Reusable “Request Invitation” modal form |
| `src/components/CapitalDinnerInvestors.js` | Investor landing page |
| `src/components/CapitalDinnerFounders.js` | Founder landing page |
| `src/styles/CapitalDinner.css` | Styles for both pages |
| `src/styles/ContentPage.css` | Shared content-page layout (imported by both pages) |
| `src/api/capital-dinner-invite.js` | Serverless handler (Vercel `src/api`) |
| `api/capital-dinner-invite.js` | Same handler (root api, if used) |

## SEO & Accessibility

- Each page sets its own `document.title` and meta description in `useEffect`.
- Modal form uses `role="dialog"`, `aria-modal`, `aria-labelledby`/`aria-describedby`, and focus is moved to the first field when opened. Required fields use `aria-required` and `aria-invalid` where appropriate.

## Deliverables (from brief)

- [x] Two route pages: `/capital-dinner/investors`, `/capital-dinner/founders`
- [x] Request Invitation form component (reusable; modal; investor vs founder fields)
- [x] Form submission handling with validation and optional DynamoDB storage
- [x] Mobile responsive implementation
- [x] Configuration for editable event details (env + config file)
- [x] Documentation on how to update event details (this README)

---

## Questions for Human Review

These items may need product/ops decisions:

1. **Form backend:** Table name and region for DynamoDB (or switch to another store). Email notifications when someone requests an invite? Admin panel to review/approve requests?
2. **Configuration:** Keep env + config file, or move to CMS? Ability to close registration when events fill up?
3. **Analytics:** Track page views and form submissions (e.g. button click, form start, form submit)?
4. **Access:** Pages public as-is, or behind auth? Separate admin view for registrations?
5. **Multi-event:** One-time event or multiple Capital Dinners? Support multiple concurrent events (e.g. different dates/venues)?
