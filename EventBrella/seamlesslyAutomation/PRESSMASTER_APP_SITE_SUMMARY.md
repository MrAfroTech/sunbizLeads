# app.pressmaster.ai — Site Scan Summary

Summary of **app.pressmaster.ai** (and related www.pressmaster.ai) based on fetched content and brand materials. Exact hex values are inferred from asset names and context; for pixel-perfect colors, use browser DevTools on the live site.

---

## Description

**Product:** Pressmaster.ai — AI-powered thought leadership and PR/content platform.

**Taglines / value proposition:**
- **Primary:** “Your Brand Has a Voice. We Help AI Speak It Fluently.”
- **Sub:** “Teach AI your brand’s voice and knowledge for content that’s unmistakably you.”
- **Homepage hero:** “Become a Thought Leader In Just 45 Days (That Converts Followers Into Opportunities)”
- **Positioning:** “From Unknown to Thought Leader in 45 Days” / “From Invisible to Authority”

**What it does:**
- AI “brand interview” to capture voice and knowledge
- Analyzes 30+ linguistic traits to build a “voice fingerprint”
- Creates content (articles, social posts, press releases) in the user’s voice
- Supports multiple “voices” (team, content type, platform) with brand consistency
- Repurposes content (e.g. YouTube/articles → posts)
- **Audience:** Founders, thought leaders, creators, marketers, agencies

**App entry points (app.pressmaster.ai):**
- **Sign-in:** “Sign in”, “Continue with Google”, Email + Password, “Forgot password?”, “Sign up”
- **Sign-up:** “Continue with Google”, “Continue with email”, “No credit card required”, “$15 in free credits”

**Trust / social proof:**
- G2 4.8, Product Hunt, “Users love us”, medals/badges
- “Trusted by 1500+ thought leaders, 150+ agencies and Fortune 500 teams”
- “Join over 2,000 Founders, Experts and Agencies”

---

## Colors (inferred)

From asset names and usage on www and brand guide:

| Use | Inferred color | Notes |
|-----|----------------|--------|
| **Logo on dark** | White | `Logotype_white.svg` on dark sections |
| **Logo on light** | Black | `Logotype_black.svg` on light sections |
| **Hero / dark sections** | Dark background | White logotype and light text |
| **Light sections** | Light background | Black logotype, dark text |
| **CTAs** | Likely solid accent | “Start for free” / “Start For Free” buttons |
| **Body text (dark)** | Light/white | On dark backgrounds |
| **Body text (light)** | Dark/black | On light backgrounds |

**Recommendation:** Open https://app.pressmaster.ai and https://www.pressmaster.ai in Chrome, use **Inspect → Computed** (or “Styles”) on the main background, nav, buttons, and headings to get exact hex/rgb values for:
- Page background (likely very dark for app auth)
- Card/panel background
- Primary button
- Text (heading vs body)
- Links

---

## Styling

- **Overall:** Clean, modern, minimal; product-led and trust-focused.
- **Platform:** Marketing site is **Webflow** (cdn.prod.website-files.com). App (app.pressmaster.ai) is a separate app (likely React/SPA given auth flows).
- **Typography:** Strong hierarchy — large hero headlines, clear subheads, short body copy. No specific font names in fetched content; check DevTools for `font-family` on the live site.
- **Layout:** 
  - Hero with headline + CTA + “No credit card” / “See it in action”
  - Feature blocks with headings and short bullets
  - Social proof (G2, Product Hunt, medals, testimonials with avatars)
  - FAQ section
  - Footer with Features, Solutions, Information, About, legal, social links
- **Components:** Buttons (“Start for free”, “Book a Call”, “Continue with Google”), form fields (Email, Password, “Show” for password), links (“Sign up”, “Forgot password?”).
- **Assets:** SVG logos, AVIF/PNG images, GIFs for product demos. Icons (e.g. Google) at paths like `/icons/google.svg`.

---

## App-specific (app.pressmaster.ai)

- **Sign-in page:** Centered form; “Continue with Google”; divider “Or”; Email, Password, “Show”, “Forgot password?”; “Sign In”; “Don’t have an account? Sign up”.
- **Sign-up page:** “Continue with Google”; “Or”; “Continue with email”; “No credit card required”, “$15 in free credits”; “Already have an account? Sign in”.
- **Page title:** “Sign in | Pressmaster” / “Sign up | Pressmaster”.

For exact colors and spacing on the app, inspect the live app in DevTools (background, input borders, button color, text color).

---

## Quick reference

- **Main marketing site:** https://www.pressmaster.ai  
- **Brand guide:** https://www.pressmaster.ai/brand-guide  
- **App (auth):** https://app.pressmaster.ai (sign-in), https://app.pressmaster.ai/sign-up  
- **Logo (white):** Used on dark backgrounds  
- **Logo (black):** Used on light backgrounds  

To get a precise color palette, use **Chrome DevTools → Inspect** on the live pages and copy computed background, color, and border values from the main containers and buttons.
