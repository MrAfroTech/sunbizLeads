# Week 2 Open Items — Completion Report

**Date:** 2026-07-07  
**Supabase project:** `smqwemfobrqxnpcooigd`

---

## Item 1 — Restore Missing Dashboard Tabs ✅

**Status:** Complete

- `salesMastery/leadManagement/revops/src/App.jsx` has three tabs: **Call List** (default), **Org Funnel**, **Calculator A/B**.
- Call list (`OrgFunnelDashboard.jsx`) unchanged; Org Funnel → `FollowUpDashboard.jsx`; Calculator A/B → `CalculatorAbDashboard.jsx`.
- Previously deployed to production (`revops-zeta.vercel.app`).

**Confirm:** Visit https://revops-zeta.vercel.app and switch between all three tabs.

---

## Item 2 — Deploy Phone Gate Fix + Smoke Test ✅ (partial UI)

**Status:** Deploy complete; Supabase smoke test passed (email-only)

### Deploy
- `seamlesslyUs` production deploy completed earlier in this sprint.

### Smoke test — email only, no phone
Submitted on https://www.seamlessly.us/calculator/wait:

| Field | Value |
|-------|-------|
| email | `week2gate20260707@example.com` |
| name | Week2 Smoke |
| phone | *(empty)* |

**Supabase row (verified):**

| id | email | engine_version | lead_source | phone | intent_score | intent_tier | emails_sent | created_at |
|----|-------|----------------|-------------|-------|--------------|-------------|-------------|------------|
| `fc7aad2f-bc08-48e3-997d-7150f7b57c79` | week2gate20260707@example.com | v2 | wait_calculator | null | 20 | COLD | 1 | 2026-07-07 10:03:23 UTC |

✅ `engine_version = 'v2'`  
✅ `phone = null`  
✅ `intent_score > 0`  
✅ `emails_sent = 1`

**Note:** UI showed “Something went wrong” after submit, but the row and email pipeline succeeded. Worth a follow-up on post-submit UI (DownloadReveal).

### Smoke test — with phone → `follow_up_tasks`
**Not run in this session.** Manually submit the same calculator with a phone number and verify:

```sql
SELECT * FROM follow_up_tasks
WHERE status = 'pending'
ORDER BY created_at DESC LIMIT 5;
```

---

## Item 3 — Wire Remaining 9 Calculators ✅

**Status:** Already wired via parent components; no code changes required.

| Component | Wiring |
|-----------|--------|
| `WaitCalculator.js` | Wrapper → `VenueLeakCalculator` (`wait_calculator`) |
| `RestaurantsBarsCalculator.js` | Wrapper → `VenueLeakCalculator` (`restaurants_calculator`) |
| `HotelsResortsCalculator.js` | Wrapper → `VenueLeakCalculator` (`hotels_calculator`) |
| `EventSpacesCalculator.js` | Wrapper → `EventLeakCalculator` (`events_calculator`) |
| `DistrictsCalculator.js` | `DistrictLeakCalculator` (`district_calculator`) |
| `DistrictCalculatorResults.js` | Display only — parent handles submit |
| `MagicBandsCalculator.js` | Input flow → `MagicBandsCalculatorResults` (`magic_bands_calculator`) |
| `StaffBurnoutCalculatorResults.js` | `submitUnifiedLead` (`staff_burnout_calculator`) |
| `SportsGatedCalculatorResults.js` | Display only — `Sports2RetentionCalculator` / `Sports3SponsorshipCalculator` handle submit |

**v2 lead_source counts (post smoke test):**

| lead_source | count | max(created_at) |
|-------------|-------|-----------------|
| wait_calculator | 3 | 2026-07-07 10:03:23 |

Other sources will appear as live traffic submits through each calculator.

---

## Item 4 — Test Lead Purge ✅

**Preview:** 1 row matched (`maurice@mauricethefirst.com`, v2, `wait_calculator`).

**Purge:** Executed DELETE across all 9 tables (in order). Used `setter_dispositions.email` (not `lead_email`).

**Post-purge verification:**

| Metric | Result |
|--------|--------|
| `remaining_test_leads` | **0** |
| `real_leads` (v2, non-test filters) | **2** (unchanged) |

---

## Item 5 — Sports 2 + Sports 3 Live ⚠️

**Routes load without errors:**
- https://www.seamlessly.us/calculator/sports-2 ✅
- https://www.seamlessly.us/calculator/sports-3 ✅

**Submit + Supabase verification:** Not completed in this session. Before newsletter send, run gate submit on each and confirm:

```sql
SELECT id, email, lead_source, engine_version, intent_score, created_at
FROM scan_and_scale_click_events
WHERE lead_source IN ('sports2_calculator', 'sports3_calculator')
AND created_at > NOW() - INTERVAL '30 minutes'
ORDER BY created_at DESC;
```

Then purge test rows (Item 4 queries).

---

## Item 6 — Newsletter Calculator Merge Tags ✅

**Sports fork (`July6SportsNewsletter.html`):** All three calculator links have full merge tags.

**Updated:**
- `salesMastery/newsletter/newsletterTemplate.html` (base template)
- All `salesMastery/newsletter/**/*.html` bare `seamlessly.us/calculator/*` URLs
- `SeamlessVendorUI/seamlesslyUs/public/chaosMasteryNewsletters/` and `chaosMasteryNewsletters/` (earlier in sprint)
- Added going-forward rule: `salesMastery/digitalMarketing/newsletters/NEWSLETTER_BUILD_CHECKLIST.md`

**Pre-send grep (newsletter HTML):**

```bash
grep -rn "seamlessly.us/calculator" salesMastery/newsletter --include="*.html" | grep -v "contact.EMAIL"
# Expected: empty
```

**Out of scope (not newsletter files):** Bare calculator links remain in `eCommerceSite/scan-and-scale/` marketing pages and `socialMedia/links/index.html` (IG bio link with `?source=ig_bio`).

---

## Final Verification Query

Run at 2026-07-07 ~10:03 UTC (after Item 2 smoke test):

| table_name | total | v2 | last_activity |
|------------|-------|-----|---------------|
| lead_events | 854 | — | 2026-07-07 10:03:23 UTC |
| scan_and_scale_click_events | 34 | 3 | 2026-07-07 10:03:23 UTC |
| follow_up_tasks (pending) | 12 | — | 2026-06-14 00:02:13 UTC |
| finished_calc_leads | 2 | — | 2026-06-13 15:18:49 UTC |
| setter_dispositions | 0 | — | null |

---

## Open Follow-ups

1. **Item 2:** Phone + `follow_up_tasks` smoke test (manual).
2. **Item 5:** Submit smoke test on sports-2 and sports-3 before newsletter fork.
3. **Item 2 UI:** Investigate post-submit error on wait calculator despite successful SSCE row.
4. **Cleanup:** Optional delete of smoke row `week2gate20260707@example.com` (not caught by test-lead purge filters).
5. **Deploy:** Redeploy `seamlesslyUs` if newsletter HTML in `public/chaosMasteryNewsletters` should go live on site assets.
