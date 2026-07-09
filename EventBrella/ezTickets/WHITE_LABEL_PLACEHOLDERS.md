# White-Label Ticketing SOP  — For New Client Onboarding

Use this list to quickly onboard a new ticketing client. **Find each placeholder** in the codebase and replace with the client’s value (or set in Vercel env where noted). The codebase contains **no** client names (e.g. Farmer Banks, Here On The Farm); every such reference is one of these placeholders.

---

## Identity & branding

| Placeholder | Replace with | Where used |
|-------------|--------------|------------|
| `CLIENT_APP_NAME` | Client’s app/product name | Titles, headings, config, JS |
| `CLIENT_ORGANIZER_NAME` | Organizer display name | All HTML/JS; set `ORGANIZER_NAME` in Vercel for API |
| `CLIENT_NAME` | Client business name | config.json |
| `CLIENT_TAGLINE` | Short tagline (e.g. “Guided Farm Tour & Harvest Experiences”) | Hero sections |
| `CLIENT_EVENT_TYPE_LABEL` | Label for primary event type (e.g. “Farm Tours”, “Tours”) | Badges, headings |
| `CLIENT_EVENT_TYPE_LABEL_2` | Label for secondary type (e.g. “Harvests”) | Badges |

---

## Venue & location

| Placeholder | Replace with | Where used |
|-------------|--------------|------------|
| `CLIENT_VENUE_NAME` | Venue name (e.g. “Here On The Farm”) | All pages, API (or set `CLIENT_VENUE_NAME` in Vercel) |
| `CLIENT_ADDRESS_LINE1` | Street address | Venue blocks, footer, API (or env) |
| `CLIENT_ADDRESS_LINE2` | City, state, ZIP | Venue blocks, footer, API (or env) |
| `CLIENT_GOOGLE_MAPS_DESTINATION` | URL-encoded address for “Get Directions” (e.g. `123+Main+St+City+ST+12345`) | Map link `destination=` |
| `CLIENT_GOOGLE_MAPS_EMBED_URL` | Full Google Maps embed iframe `src` URL | Map iframes |
| `CLIENT_PHONE` | Contact phone | Venue, footer, “For more information” |

---

## Contact & web

| Placeholder | Replace with | Where used |
|-------------|--------------|------------|
| `CLIENT_WEBSITE_URL` | Full website URL (e.g. `https://clientdomain.com`) | Footer, hero links |
| `CLIENT_CONTACT_EMAIL` | Contact or noreply email | Footer, “For more information”, mailto links |
| `CLIENT_ORGANIZER_IMAGE_URL` | Full URL to organizer/owner photo | Organizer section, API (or env) |

---

## Images (paths or URLs)

| Placeholder | Replace with | Where used |
|-------------|--------------|------------|
| `/images/CLIENT_HERO_IMAGE_LEFT.png` | Path or URL for left hero image | Hero sections |
| `/images/CLIENT_HERO_IMAGE_RIGHT.png` | Path or URL for right hero image | Hero sections |
| `CLIENT_EVENT_POSTER_IMAGE_URL` | URL for event poster (e.g. index event page) | public/index.html |

---

## Copy (paragraphs / descriptions)

| Placeholder | Replace with | Where used |
|-------------|--------------|------------|
| `CLIENT_VENUE_DESCRIPTION` | 1–2 paragraphs describing the venue | Event details sections |
| `CLIENT_ABOUT_PARAGRAPH_1` | First “about” paragraph | Event details |
| `CLIENT_ABOUT_PARAGRAPH_2` | Second “about” paragraph | Event details |
| `CLIENT_EVENTS_INTRO_LINE_1` | Intro line for events (e.g. “Monthly Harvest Events & Special Harvest Days”) | allevents |
| `CLIENT_EVENTS_INTRO_LINE_2` | Second intro line | allevents |
| `CLIENT_WHAT_TO_EXPECT_2` | “What to expect” bullet 2 copy | allevents |
| `CLIENT_WHAT_TO_EXPECT_3` | “What to expect” bullet 3 copy | allevents |
| `CLIENT_WHAT_TO_EXPECT_4` | “What to expect” bullet 4 copy | allevents |
| `CLIENT_FARM_TOURS_DESCRIPTION` | Short description for farm tours card | public/allevents, platformDrivenPages |
| `CLIENT_HARVEST_DESCRIPTION` | Short description for harvests card | public/allevents, platformDrivenPages |
| `CLIENT_MONTHLY_EVENT_DESCRIPTION` | Description for monthly/recurring event | public/js/allevents.js, farm-tours.js, platformDrivenPages |
| `CLIENT_MONTHLY_EVENT_NAME` | Name for monthly event (e.g. “Monthly Farm Tour”) | farm-tours.js |
| `CLIENT_SPECIAL_EVENT_DESCRIPTION` | Description for first special event | public/js/allevents.js, harvest-experiences.js |
| `CLIENT_SPECIAL_EVENT_DESCRIPTION_2` | Description for second special event | public/js/allevents.js, harvest-experiences.js |
| `CLIENT_SPECIAL_EVENT_NAME_1` | Name for first special event | harvest-experiences.js |
| `CLIENT_SPECIAL_EVENT_NAME_2` | Name for second special event | harvest-experiences.js, allevents.js |
| `CLIENT_EVENT_NAME` | Single-event page title (e.g. “Cassava Harvest”) | public/index.html |
| `CLIENT_EVENT_DATE_TIME` | Event date/time line | public/index.html |
| `CLIENT_EVENT_DESCRIPTION_1` | Event description line 1 | public/index.html |
| `CLIENT_EVENT_DESCRIPTION_2` | Event description line 2 | public/index.html |
| `CLIENT_EVENT_DESCRIPTION_3` | Event description line 3 | public/index.html |

---

## Event slugs / IDs (for JS and API)

| Placeholder | Replace with | Where used |
|-------------|--------------|------------|
| `CLIENT_EVENT_SLUG_FIRST` | First special event ID (e.g. `cassava-harvest-2026-01-03`) | public/js/allevents.js, harvest-experiences.js |
| `CLIENT_EVENT_SLUG_SECOND` | Second special event ID | public/js/allevents.js, harvest-experiences.js |
| `CLIENT_EVENT_SLUG` | Default event slug for API (e.g. `client_event_YYYY_MM_DD`) | Set `CLIENT_EVENT_SLUG` in Vercel; used in api/stripe-webhook, klaviyo-test-event |
| `CLIENT_DEFAULT_EVENT_NAME` | Default event name for API fallback | Set `CLIENT_DEFAULT_EVENT_NAME` in Vercel; used in api/stripe-webhook |

---

## Config & env (Vercel / config.env)

Set these in **Vercel** (and optionally in `config/config.env` for local) so the API stays white-label:

- `ORGANIZER_NAME` → same as `CLIENT_ORGANIZER_NAME`
- `BASE_URL` → `https://<client-subdomain>.eventbrella.us` (or client domain)
- `CLIENT_VENUE_NAME` → same as above
- `CLIENT_ADDRESS_LINE1`, `CLIENT_ADDRESS_LINE2` → for API/emails
- `CLIENT_EVENT_SLUG`, `CLIENT_DEFAULT_EVENT_NAME` → optional, for webhook/Klaviyo

---

## Email / newsletter templates

These files may still contain example copy from a previous client. Replace any remaining client-specific text with the placeholders above (or equivalent client copy):

- `public/farm-tour-newsletter-december-14.html`
- `monthly-farm-tour-email.html`
- `farm-tour-newsletter-email.html`
- `klaviyo-ticket-email-template.html`

---

## Quick onboarding flow

1. **Gather** client values for every placeholder in the tables above.
2. **Find** each placeholder in the repo (search for `CLIENT_` and the names in this doc).
3. **Replace** with client values (or set env in Vercel for API-driven ones).
4. **Images:** Add client images to `public/images/` and point hero/event placeholders to the correct filenames or URLs.
5. **Maps:** Get client’s Google Maps embed URL and directions link; replace `CLIENT_GOOGLE_MAPS_EMBED_URL` and `CLIENT_GOOGLE_MAPS_DESTINATION`.
6. **Deploy** and run through checkout, webhook, and scan flow.

See **SOP_ONBOARDING_NEW_TICKETING_CLIENT.md** for the full checklist (env, Vercel, DB, Stripe/Klaviyo, copy/assets).
