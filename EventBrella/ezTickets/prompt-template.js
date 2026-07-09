// prompt-template.js - Cursor Prompt Generator

/**
 * Builds a comprehensive Cursor instruction prompt with all client data
 * @param {Object} data - Form data object with all client information
 * @returns {String} - Formatted prompt for Cursor
 */
window.buildCursorPrompt = function(data) {
  // Sanitize client name for directory naming
  const clientDirName = (data.CLIENT_NAME || 'new-client')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const clientDirPath = `/Users/missioncontrol/SeamlessMarketplace/EventBrella/${clientDirName}/`;
  const clientSubdomain = clientDirName;

  // Resolve image path: prefer uploaded filename → /images/filename, else use URL/path from form
  const imgPath = (fileName, urlOrPath) => (fileName ? '/images/' + fileName : (urlOrPath || '')).replace(/"/g, '\\"');
  const organizerPath = imgPath(data.organizerImageFileName, data.CLIENT_ORGANIZER_IMAGE_URL);
  const heroBgPath = imgPath(data.heroBackgroundImageFileName, data.CLIENT_HERO_BACKGROUND_IMAGE);
  const eventPosterPath = imgPath(data.eventPosterImageFileName, data.CLIENT_EVENT_POSTER_IMAGE_URL);
  const heroLeftPath = imgPath(data.heroLeftImageFileName, data.CLIENT_HERO_IMAGE_LEFT);
  const heroRightPath = imgPath(data.heroRightImageFileName, data.CLIENT_HERO_IMAGE_RIGHT);

  // Handle organizer image block for STEP 4
  let organizerImageInstructions = '';
  if (data.organizerImageFileName) {
    organizerImageInstructions = `### Organizer / host photo (Venue section)
- File uploaded: ${data.organizerImageFileName}
- Place in: ${clientDirPath}public/images/${data.organizerImageFileName}
- Update organizer-image references to: /images/${data.organizerImageFileName}`;
  } else if (data.CLIENT_ORGANIZER_IMAGE_URL) {
    organizerImageInstructions = `### Organizer / host photo
- Using URL: ${data.CLIENT_ORGANIZER_IMAGE_URL}`;
  } else {
    organizerImageInstructions = `### Organizer / host photo
- No image provided`;
  }

  // Handle ticketing tiers
  let ticketingTiersSection = '';
  if (data.ticketingTiers && data.ticketingTiers.length > 0) {
    ticketingTiersSection = `
## STEP 3: Update Ticketing Tiers Configuration

In ${clientDirPath}config/ticketing-tiers.json (or equivalent config file), update the ticketing structure:

\`\`\`json
${JSON.stringify(data.ticketingTiers, null, 2)}
\`\`\`

Also update any hardcoded tier references in:
- app.js (TICKET_PRICES constant)
- allevents.js (SPECIAL_EVENTS prices)
- Any other files with pricing logic
`;
  } else {
    ticketingTiersSection = `
## STEP 3: Update Ticketing Tiers Configuration

In ${clientDirPath}config/ticketing-tiers.json (or equivalent config file), set the ticketing structure:

\`\`\`json
[]
\`\`\`
`;
  }

  // Build the complete prompt
  return `# White-Label Ticketing Client Setup: ${data.CLIENT_NAME || 'New Client'}

## Overview
Clone the white-label template directory and customize it for this client by replacing all placeholder values.

---

## STEP 1: Create New Client Directory

### Action Required
1. **Identify current template directory** (the directory you're currently in with this prompt)
2. **Create new client directory**: \`${clientDirPath}\`
   - Client directory name: \`${clientDirName}\` (lowercase, hyphens for spaces)
3. **Copy entire template directory** into the new client directory
   - Include all files and subdirectories
   - Preserve file structure exactly as-is
   - The template remains unchanged for future clients

**Full path for new client:** \`${clientDirPath}\`

---

## STEP 1.5: Verify package.json Configuration

After copying the template directory, verify that \`${clientDirPath}package.json\` contains:
- "build" script (even if it just echoes)
- "dev", "start", "deploy" scripts
- "stripe" dependency

The package.json "name" field should have CLIENT_NAME placeholder - it will be replaced in the next step.

---

## STEP 2: Find and Replace All Placeholders

In \`${clientDirPath}\`, perform these replacements across ALL files:

### Identity & Branding
- Replace \`CLIENT_APP_NAME\` with: "${(data.CLIENT_APP_NAME || data.CLIENT_ORGANIZER_NAME || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_ORGANIZER_NAME\` with: "${(data.CLIENT_ORGANIZER_NAME || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_NAME\` with: "${(data.CLIENT_NAME || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_TAGLINE\` with: "${(data.CLIENT_TAGLINE || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_EVENT_TYPE_LABEL\` with: "${(data.CLIENT_EVENT_TYPE_LABEL || data.CLIENT_EVENT_NAME || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_EVENT_TYPE_LABEL_2\` with: "${(data.CLIENT_EVENT_TYPE_LABEL_2 || '').replace(/"/g, '\\"')}"

### Venue & Location
- Replace \`CLIENT_VENUE_NAME\` with: "${(data.CLIENT_VENUE_NAME || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_ADDRESS_LINE1\` with: "${(data.CLIENT_ADDRESS_LINE1 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_ADDRESS_LINE2\` with: "${(data.CLIENT_ADDRESS_LINE2 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_PHONE\` with: "${(data.CLIENT_PHONE || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_GOOGLE_MAPS_DESTINATION\` with: "${(data.CLIENT_GOOGLE_MAPS_DESTINATION || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_GOOGLE_MAPS_EMBED_URL\` with: "${(data.CLIENT_GOOGLE_MAPS_EMBED_URL || '').replace(/"/g, '\\"')}"

### Contact & Web
- Replace \`CLIENT_WEBSITE_URL\` with: "${(data.CLIENT_WEBSITE_URL || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_CONTACT_EMAIL\` with: "${(data.CLIENT_CONTACT_EMAIL || '').replace(/"/g, '\\"')}"
### Images (by UI location; use uploaded filename or URL)
- Replace \`CLIENT_ORGANIZER_IMAGE_URL\` / organizer-image src (Venue section) with: "${organizerPath}"
- Replace \`/images/CLIENT_HERO_IMAGE_LEFT.png\` and any left-panel hero image (e.g. farmer-banks-field.png, Banks-overalls...) with: "${heroLeftPath}"
- Replace \`/images/CLIENT_HERO_IMAGE_RIGHT.png\` and any right-panel hero image (e.g. Banks-with-a-shovel, farmer-banks-greenhouse) with: "${heroRightPath}"
- Replace \`CLIENT_EVENT_POSTER_IMAGE_URL\` and event-poster src (index.html hero) with: "${eventPosterPath}"
- Replace \`CLIENT_HERO_BACKGROUND_IMAGE\` and hero background image: "${heroBgPath}"
- In \`public/styles/main.css\` and any \`background-image: url('/vertical-garden-farming-iron-rack-260nw-1938275770.webp')\`, replace with the client's hero background path (e.g. \`url('/images/hero-bg.webp')\` or the uploaded filename in \`/images/\`)

### Copy & Descriptions
- Replace \`CLIENT_VENUE_DESCRIPTION\` with: "${(data.CLIENT_VENUE_DESCRIPTION || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_ABOUT_PARAGRAPH_1\` with: "${(data.CLIENT_ABOUT_PARAGRAPH_1 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_ABOUT_PARAGRAPH_2\` with: "${(data.CLIENT_ABOUT_PARAGRAPH_2 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_EVENTS_INTRO_LINE_1\` with: "${(data.CLIENT_EVENTS_INTRO_LINE_1 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_EVENTS_INTRO_LINE_2\` with: "${(data.CLIENT_EVENTS_INTRO_LINE_2 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_WHAT_TO_EXPECT_2\` with: "${(data.CLIENT_WHAT_TO_EXPECT_2 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_WHAT_TO_EXPECT_3\` with: "${(data.CLIENT_WHAT_TO_EXPECT_3 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_WHAT_TO_EXPECT_4\` with: "${(data.CLIENT_WHAT_TO_EXPECT_4 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_FARM_TOURS_DESCRIPTION\` with: "${(data.CLIENT_FARM_TOURS_DESCRIPTION || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_HARVEST_DESCRIPTION\` with: "${(data.CLIENT_HARVEST_DESCRIPTION || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_MONTHLY_EVENT_DESCRIPTION\` with: "${(data.CLIENT_MONTHLY_EVENT_DESCRIPTION || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_MONTHLY_EVENT_NAME\` with: "${(data.CLIENT_MONTHLY_EVENT_NAME || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_SPECIAL_EVENT_DESCRIPTION\` with: "${(data.CLIENT_SPECIAL_EVENT_DESCRIPTION || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_SPECIAL_EVENT_DESCRIPTION_2\` with: "${(data.CLIENT_SPECIAL_EVENT_DESCRIPTION_2 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_SPECIAL_EVENT_NAME_1\` with: "${(data.CLIENT_SPECIAL_EVENT_NAME_1 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_SPECIAL_EVENT_NAME_2\` with: "${(data.CLIENT_SPECIAL_EVENT_NAME_2 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_EVENT_NAME\` with: "${(data.CLIENT_EVENT_NAME || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_EVENT_DATE_TIME\` with: "${(data.CLIENT_EVENT_DATE_TIME || data.CLIENT_EVENT_TIME || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_EVENT_DESCRIPTION_1\` with: "${(data.CLIENT_EVENT_DESCRIPTION_1 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_EVENT_DESCRIPTION_2\` with: "${(data.CLIENT_EVENT_DESCRIPTION_2 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_EVENT_DESCRIPTION_3\` with: "${(data.CLIENT_EVENT_DESCRIPTION_3 || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_EVENT_DESCRIPTION\` with: "${(data.CLIENT_EVENT_DESCRIPTION || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_EVENT_TIME\` with: "${(data.CLIENT_EVENT_TIME || '').replace(/"/g, '\\"')}"

### Event Slugs & IDs
- Replace \`CLIENT_EVENT_SLUG_FIRST\` with: "${(data.CLIENT_EVENT_SLUG_FIRST || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_EVENT_SLUG_SECOND\` with: "${(data.CLIENT_EVENT_SLUG_SECOND || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_EVENT_SLUG\` with: "${(data.CLIENT_EVENT_SLUG || '').replace(/"/g, '\\"')}"
- Replace \`CLIENT_DEFAULT_EVENT_NAME\` with: "${(data.CLIENT_DEFAULT_EVENT_NAME || data.CLIENT_EVENT_NAME || '').replace(/"/g, '\\"')}"

---
${ticketingTiersSection}
---

## STEP 4: Handle Client Images (by UI location)

${organizerImageInstructions}

### Hero section — full-width background
${data.heroBackgroundImageFileName ? `- Place uploaded file \`${data.heroBackgroundImageFileName}\` in \`${clientDirPath}public/images/\`. Update CSS \`background-image\` (e.g. main.css, tour pages) from \`vertical-garden-farming-iron-rack-260nw-1938275770.webp\` to \`/images/${data.heroBackgroundImageFileName}\`.` : data.CLIENT_HERO_BACKGROUND_IMAGE ? `- Use URL/path: ${data.CLIENT_HERO_BACKGROUND_IMAGE}. Update hero background in main.css and any inline styles.` : '- No hero background image provided.'}

### Homepage — main event poster
${data.eventPosterImageFileName ? `- Place \`${data.eventPosterImageFileName}\` in \`${clientDirPath}public/images/\`. Set event-poster src (e.g. public/index.html) to \`/images/${data.eventPosterImageFileName}\`.` : data.CLIENT_EVENT_POSTER_IMAGE_URL ? `- Use URL: ${data.CLIENT_EVENT_POSTER_IMAGE_URL}` : '- Not provided.'}

### About / Events page — left photo
${data.heroLeftImageFileName ? `- Place \`${data.heroLeftImageFileName}\` in \`${clientDirPath}public/images/\`. Set left-panel hero/about image to \`/images/${data.heroLeftImageFileName}\`.` : data.CLIENT_HERO_IMAGE_LEFT ? `- Use: ${data.CLIENT_HERO_IMAGE_LEFT}` : '- Not provided.'}

### About / Events page — right photo
${data.heroRightImageFileName ? `- Place \`${data.heroRightImageFileName}\` in \`${clientDirPath}public/images/\`. Set right-panel hero/about image to \`/images/${data.heroRightImageFileName}\`.` : data.CLIENT_HERO_IMAGE_RIGHT ? `- Use: ${data.CLIENT_HERO_IMAGE_RIGHT}` : '- Not provided.'}

**Note:** Uploaded files go in \`public/images/\`. If a URL was entered instead, reference it directly in the client code.

---

## STEP 5: Configure Environment Variables

Create/update \`${clientDirPath}config/config.env\` with:

\`\`\`env
# Client Identity
ORGANIZER_NAME=${(data.CLIENT_ORGANIZER_NAME || '').replace(/"/g, '\\"')}
CLIENT_NAME=${(data.CLIENT_NAME || '').replace(/"/g, '\\"')}

# Deployment
BASE_URL=https://${clientSubdomain}.eventbrella.us

# Venue
CLIENT_VENUE_NAME=${(data.CLIENT_VENUE_NAME || '').replace(/"/g, '\\"')}
CLIENT_ADDRESS_LINE1=${(data.CLIENT_ADDRESS_LINE1 || '').replace(/"/g, '\\"')}
CLIENT_ADDRESS_LINE2=${(data.CLIENT_ADDRESS_LINE2 || '').replace(/"/g, '\\"')}

# Events
CLIENT_EVENT_SLUG=${(data.CLIENT_EVENT_SLUG || '').replace(/"/g, '\\"')}
CLIENT_DEFAULT_EVENT_NAME=${(data.CLIENT_DEFAULT_EVENT_NAME || data.CLIENT_EVENT_NAME || '').replace(/"/g, '\\"')}

# Payment: copy STRIPE_* from FarmerBanks except webhook secret (created in STEP 5.5)
STRIPE_TEST_SECRET_KEY=<copy from FarmerBanks>
STRIPE_LIVE_SECRET_KEY=<copy from FarmerBanks>
STRIPE_PUBLISHABLE_KEY=<copy from FarmerBanks>
TEST_MODE=<copy from FarmerBanks>
STRIPE_WEBHOOK_TEST_SECRET=<from scripts/create-stripe-webhook.sh output>
STRIPE_WEBHOOK_LIVE_SECRET=<from scripts/create-stripe-webhook.sh --live output>

# Cloudflare Turnstile (checkout bot protection; copy from FarmerBanks — same keys)
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Email (to be configured by client)
KLAVIYO_API_KEY=
SENDGRID_API_KEY=
\`\`\`

### Vercel Environment Variables
- **Stripe, TEST_MODE, Turnstile:** Added automatically by \`scripts/setup-vercel-stripe-env.sh\` (STEP 5.5) — script copies from FarmerBanks .env and adds via Vercel CLI. The form does not transfer these. Checkout Turnstile steps: see \`CLOUDFLARE_TURNSTILE_INTEGRATION.md\` (and \`../farmerBanks/CLOUDFLARE_TURNSTILE_INTEGRATION.md\`).
- **Other vars** (set in Vercel dashboard or CLI as needed): \`ORGANIZER_NAME\`, \`BASE_URL\` (https://${clientSubdomain}.eventbrella.us), \`CLIENT_VENUE_NAME\`, \`CLIENT_ADDRESS_LINE1\`, \`CLIENT_ADDRESS_LINE2\`, \`CLIENT_EVENT_SLUG\`, \`CLIENT_DEFAULT_EVENT_NAME\`, and email (Klaviyo/SendGrid) keys.

---

## STEP 5.5: Stripe + Vercel Env (Copy from FarmerBanks, Add via CLI)

**The form does not transfer env vars.** As soon as the new client codebase exists, run the template script so Stripe variables are copied from FarmerBanks' \`.env\` and added to this client's Vercel project via the Vercel CLI.

1. **Ensure FarmerBanks .env exists** at \`${clientDirPath}../farmerBanks/.env\` (STRIPE_* and TEST_MODE).
2. **From the new client directory**, run (Vercel CLI and Stripe CLI must be installed):
   \`\`\`bash
   cd ${clientDirPath}
   chmod +x scripts/setup-vercel-stripe-env.sh
   ./scripts/setup-vercel-stripe-env.sh https://${clientSubdomain}.eventbrella.us
   \`\`\`
   This script:
   - Reads \`STRIPE_TEST_SECRET_KEY\`, \`STRIPE_LIVE_SECRET_KEY\`, \`STRIPE_PUBLISHABLE_KEY\` (or \`STRIPE_LIVE_PUBLISHABLE_KEY\`) from FarmerBanks \`.env\`
   - Creates the Stripe webhook for this client (test mode), gets the new \`whsec_...\` secret
   - Sets \`TEST_MODE=true\` for the new client
   - Adds all of the above plus \`STRIPE_WEBHOOK_TEST_SECRET\` and \`TURNSTILE_SITE_KEY\` / \`TURNSTILE_SECRET_KEY\` to the Vercel project via \`vercel env add\` (production + preview)
3. **Optional:** For live mode, create the live webhook and add \`STRIPE_WEBHOOK_LIVE_SECRET\` manually or extend the script. Do not create new Stripe API keys; they are client-agnostic and copied from FarmerBanks.

---

## STEP 6: Update Email Templates

In \`${clientDirPath}emails/\`, update these files with client-specific placeholders:
- ticket-confirmation.html
- order-receipt.html
- Any newsletter templates

All \`CLIENT_*\` placeholders should be replaced in these templates.

---

## STEP 7: Verify All Replacements

### Verification Checklist

1. **Search for remaining placeholders:**
   - Search entire \`${clientDirPath}\` directory for "CLIENT_"
   - List any remaining placeholders that weren't replaced

2. **Count replacements made:**
   - Total number of files modified
   - Total number of placeholder replacements

3. **Critical files check:**
   - [ ] package.json - "name" field uses client name (not CLIENT_NAME)
   - [ ] package.json - All scripts present (dev, build, deploy)
   - [ ] index.html - Main event page customized
   - [ ] allevents.js - Event data updated
   - [ ] app.js - No CLIENT_ placeholders remain
   - [ ] config.json - Client configuration set
   - [ ] vercel.json - Deployment config present

---

## STEP 8: Generate Deployment Summary

**Client System Ready: ${(data.CLIENT_NAME || 'New Client').replace(/"/g, '\\"')}**

**Directory:** \`${clientDirPath}\`

**Next Steps for Developer:**
1. Add client images to \`/public/images/\` (see STEP 4 for each UI location):
   - Organizer/host photo${data.organizerImageFileName ? ': ' + data.organizerImageFileName : ''}
   - Hero background${data.heroBackgroundImageFileName ? ': ' + data.heroBackgroundImageFileName : ''}
   - Event poster (homepage)${data.eventPosterImageFileName ? ': ' + data.eventPosterImageFileName : ''}
   - About/Events left photo${data.heroLeftImageFileName ? ': ' + data.heroLeftImageFileName : ''}
   - About/Events right photo${data.heroRightImageFileName ? ': ' + data.heroRightImageFileName : ''}

2. Test package.json scripts:
   \`\`\`bash
   cd ${clientDirPath}
   npm install
   npm run build  # Should echo "Static site - no build step required"
   npm run dev    # Should start Vercel dev server
   \`\`\`

3. Configure Stripe and Vercel env (run once from new client dir; form does not transfer vars):
   - **Run** \`./scripts/setup-vercel-stripe-env.sh https://${clientSubdomain}.eventbrella.us\`
   - Script reads FarmerBanks \`.env\`, creates webhook, and adds Stripe + Turnstile vars + \`TEST_MODE=true\` to Vercel via CLI

4. Configure Email Service:
   - Set up Klaviyo or SendGrid account
   - Add API keys to Vercel environment variables

5. Deploy to Vercel:
   \`\`\`bash
   cd ${clientDirPath}
   vercel --prod
   \`\`\`

6. Test complete workflow:
   - [ ] Event pages load correctly
   - [ ] Checkout process works
   - [ ] Stripe payment processes
   - [ ] Confirmation emails send
   - [ ] Tickets display with QR codes

**Production URL:** \`https://${clientSubdomain}.eventbrella.us\`

---

## Execution Checklist

- [ ] Step 1: New client directory created at ${clientDirPath}
- [ ] Step 1.5: package.json verified
- [ ] Step 2: All placeholders replaced with actual values
- [ ] Step 3: Ticketing tiers configured (if applicable)
- [ ] Step 4: Image instructions provided
- [ ] Step 5: Environment variables documented
- [ ] Step 5.5: \`scripts/setup-vercel-stripe-env.sh\` run from new client dir — copies FarmerBanks .env (Stripe + Turnstile) and adds to Vercel via CLI; creates webhook and sets TEST_MODE=true
- [ ] Step 6: Email templates updated
- [ ] Step 7: Verification complete - no CLIENT_* placeholders remain
- [ ] Step 8: Deployment summary generated
- [ ] Template directory unchanged

**Begin execution. Report progress and any issues encountered.**`;
};

// Example client data for testing
window.exampleClientData = {
  CLIENT_NAME: 'Example Farm',
  CLIENT_ORGANIZER_NAME: 'Example Organizer',
  CLIENT_APP_NAME: 'Example Organizer',
  CLIENT_VENUE_NAME: 'Example Venue',
  CLIENT_ADDRESS_LINE1: '123 Example St',
  CLIENT_ADDRESS_LINE2: 'Example City, ST 12345',
  CLIENT_PHONE: '(555) 123-4567',
  CLIENT_WEBSITE_URL: 'https://example.com',
  CLIENT_CONTACT_EMAIL: 'contact@example.com',
  CLIENT_EVENT_NAME: 'Example Event',
  CLIENT_EVENT_DATE: '2026-01-03',
  CLIENT_EVENT_START_TIME: '9:00 AM',
  CLIENT_EVENT_END_TIME: '11:00 AM',
  CLIENT_EVENT_TIME: '9:00 AM - 11:00 AM',
  CLIENT_EVENT_DESCRIPTION: 'This is an example event description.',
  ticketingTiers: [
    { name: 'General Admission', id: 'general', price: '10.00', capacity: '50', description: 'Standard entry' },
    { name: 'VIP', id: 'vip', price: '25.00', capacity: '20', description: 'Premium experience' }
  ]
};
