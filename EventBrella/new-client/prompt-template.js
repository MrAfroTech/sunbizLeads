/**
 * White-Label Onboarding — Cursor instruction builder
 * Generates a prompt that: clones the template to a new client directory,
 * then performs all find-and-replace in that new directory only.
 */

(function (global) {
  function buildCursorPrompt(data) {
    var v = function (key) { return (data[key] || '').trim() || '—'; };

    var clientDirName = (data.CLIENT_NAME || 'new-client')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    var clientDirPath = '/Users/missioncontrol/SeamlessMarketplace/EventBrella/' + clientDirName + '/';
    var clientSubdomain = clientDirName;

    var ticketingTiersJson = '';
    if (data.ticketingTiers && data.ticketingTiers.length > 0) {
      ticketingTiersJson = JSON.stringify(data.ticketingTiers, null, 2);
    } else {
      ticketingTiersJson = '[]';
    }

    var organizerImageInstructions = '';
    if (data.organizerImageFileName) {
      organizerImageInstructions = '### Organizer Image\n- File uploaded: **' + data.organizerImageFileName + '**\n- Place this file in: `' + clientDirPath + 'public/images/' + data.organizerImageFileName + '`\n- Update all references to organizer/owner photo to use `/images/' + data.organizerImageFileName + '`';
    } else {
      organizerImageInstructions = '### Organizer Image\n- No file was uploaded. If the client provides an organizer photo later, place it in `' + clientDirPath + 'public/images/` and update references.';
    }

    var lines = [];

    lines.push('# Cursor Instruction: Clone Template & Create Client Ticketing System');
    lines.push('');
    lines.push('## Overview');
    lines.push('This directory contains a complete, production-ready white-label digital ticketing system **template**. Your task is to:');
    lines.push('1. **Clone this template** into a new client-specific directory');
    lines.push('2. **Replace all placeholder values** with the client\'s actual information (in the **new** directory only)');
    lines.push('3. Verify the new system is ready for deployment');
    lines.push('');
    lines.push('**Important:** Do **NOT** modify the template directory. All work happens in the new client directory.');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## STEP 1: Create New Client Directory');
    lines.push('');
    lines.push('### Action Required');
    lines.push('1. **Identify the current template directory** (the directory containing this prompt and the white-label codebase with all `CLIENT_*` placeholders).');
    lines.push('2. **Create new client directory:** `' + clientDirPath + '`');
    lines.push('   - Client directory name: **' + clientDirName + '** (from client name: ' + v('CLIENT_NAME') + ')');
    lines.push('3. **Copy the entire template directory** into the new client directory:');
    lines.push('   - Include all files and subdirectories');
    lines.push('   - Preserve file structure exactly');
    lines.push('   - The template remains unchanged for future clients');
    lines.push('');
    lines.push('**Full path for new client:** `' + clientDirPath + '`');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## STEP 2: Find and Replace All Placeholders');
    lines.push('');
    lines.push('In the **newly created** client directory `' + clientDirPath + '`, perform these replacements across **ALL** files:');
    lines.push('');
    lines.push('### Identity & Branding');
    lines.push('- Replace `CLIENT_APP_NAME` with: "' + v('CLIENT_ORGANIZER_NAME') + '"');
    lines.push('- Replace `CLIENT_ORGANIZER_NAME` with: "' + v('CLIENT_ORGANIZER_NAME') + '"');
    lines.push('- Replace `CLIENT_NAME` with: "' + v('CLIENT_NAME') + '"');
    lines.push('- Replace `CLIENT_TAGLINE` with: "' + v('CLIENT_TAGLINE') + '"');
    lines.push('- Replace `CLIENT_EVENT_TYPE_LABEL` with: "' + v('CLIENT_EVENT_NAME') + '"');
    lines.push('- Replace `CLIENT_EVENT_TYPE_LABEL_2` with: "' + v('CLIENT_EVENT_TYPE_LABEL_2') + '"');
    lines.push('- Replace `CLIENT_EVENT_NAME` with: "' + v('CLIENT_EVENT_NAME') + '"');
    lines.push('- Replace `CLIENT_EVENT_TIME` with: "' + v('CLIENT_EVENT_TIME') + '"');
    lines.push('- Replace `CLIENT_EVENT_DESCRIPTION` with: "' + (v('CLIENT_EVENT_DESCRIPTION').replace(/"/g, '\\"')) + '"');
    lines.push('');
    lines.push('### Venue & Location');
    lines.push('- Replace `CLIENT_VENUE_NAME` with: "' + v('CLIENT_VENUE_NAME') + '"');
    lines.push('- Replace `CLIENT_ADDRESS_LINE1` with: "' + v('CLIENT_ADDRESS_LINE1') + '"');
    lines.push('- Replace `CLIENT_ADDRESS_LINE2` with: "' + v('CLIENT_ADDRESS_LINE2') + '"');
    lines.push('- Replace `CLIENT_PHONE` with: "' + v('CLIENT_PHONE') + '"');
    lines.push('- Replace `CLIENT_GOOGLE_MAPS_DESTINATION` with: "' + v('CLIENT_GOOGLE_MAPS_DESTINATION') + '"');
    lines.push('- Replace `CLIENT_GOOGLE_MAPS_EMBED_URL` with: "' + v('CLIENT_GOOGLE_MAPS_EMBED_URL') + '"');
    lines.push('');
    lines.push('### Contact & Web');
    lines.push('- Replace `CLIENT_WEBSITE_URL` with: "' + v('CLIENT_WEBSITE_URL') + '"');
    lines.push('- Replace `CLIENT_CONTACT_EMAIL` with: "' + v('CLIENT_CONTACT_EMAIL') + '"');
    lines.push('- Replace `CLIENT_ORGANIZER_IMAGE_URL` with: "' + (data.organizerImageFileName ? '/images/' + data.organizerImageFileName : v('CLIENT_ORGANIZER_IMAGE_URL')) + '"');
    lines.push('');
    lines.push('### Images (Paths/URLs)');
    lines.push('- Replace `/images/CLIENT_HERO_IMAGE_LEFT.png` (and similar refs) with: "' + v('CLIENT_HERO_IMAGE_LEFT') + '"');
    lines.push('- Replace `/images/CLIENT_HERO_IMAGE_RIGHT.png` (and similar refs) with: "' + v('CLIENT_HERO_IMAGE_RIGHT') + '"');
    lines.push('- Replace `CLIENT_EVENT_POSTER_IMAGE_URL` with: "' + v('CLIENT_EVENT_POSTER_IMAGE_URL') + '"');
    lines.push('');
    lines.push('### Copy & Descriptions (if present in template)');
    lines.push('- Replace `CLIENT_VENUE_DESCRIPTION` with: "' + v('CLIENT_VENUE_DESCRIPTION') + '"');
    lines.push('- Replace `CLIENT_ABOUT_PARAGRAPH_1` with: "' + v('CLIENT_ABOUT_PARAGRAPH_1') + '"');
    lines.push('- Replace `CLIENT_ABOUT_PARAGRAPH_2` with: "' + v('CLIENT_ABOUT_PARAGRAPH_2') + '"');
    lines.push('- Replace `CLIENT_EVENTS_INTRO_LINE_1` with: "' + v('CLIENT_EVENTS_INTRO_LINE_1') + '"');
    lines.push('- Replace `CLIENT_EVENTS_INTRO_LINE_2` with: "' + v('CLIENT_EVENTS_INTRO_LINE_2') + '"');
    lines.push('- Replace `CLIENT_WHAT_TO_EXPECT_2` with: "' + v('CLIENT_WHAT_TO_EXPECT_2') + '"');
    lines.push('- Replace `CLIENT_WHAT_TO_EXPECT_3` with: "' + v('CLIENT_WHAT_TO_EXPECT_3') + '"');
    lines.push('- Replace `CLIENT_WHAT_TO_EXPECT_4` with: "' + v('CLIENT_WHAT_TO_EXPECT_4') + '"');
    lines.push('- Replace `CLIENT_FARM_TOURS_DESCRIPTION` with: "' + v('CLIENT_FARM_TOURS_DESCRIPTION') + '"');
    lines.push('- Replace `CLIENT_HARVEST_DESCRIPTION` with: "' + v('CLIENT_HARVEST_DESCRIPTION') + '"');
    lines.push('- Replace `CLIENT_MONTHLY_EVENT_DESCRIPTION` with: "' + v('CLIENT_MONTHLY_EVENT_DESCRIPTION') + '"');
    lines.push('- Replace `CLIENT_MONTHLY_EVENT_NAME` with: "' + v('CLIENT_MONTHLY_EVENT_NAME') + '"');
    lines.push('- Replace `CLIENT_SPECIAL_EVENT_DESCRIPTION` with: "' + v('CLIENT_SPECIAL_EVENT_DESCRIPTION') + '"');
    lines.push('- Replace `CLIENT_SPECIAL_EVENT_DESCRIPTION_2` with: "' + v('CLIENT_SPECIAL_EVENT_DESCRIPTION_2') + '"');
    lines.push('- Replace `CLIENT_SPECIAL_EVENT_NAME_1` with: "' + v('CLIENT_SPECIAL_EVENT_NAME_1') + '"');
    lines.push('- Replace `CLIENT_SPECIAL_EVENT_NAME_2` with: "' + v('CLIENT_SPECIAL_EVENT_NAME_2') + '"');
    lines.push('- Replace `CLIENT_EVENT_DATE_TIME` with: "' + v('CLIENT_EVENT_DATE_TIME') + '"');
    lines.push('- Replace `CLIENT_EVENT_DESCRIPTION_1` with: "' + v('CLIENT_EVENT_DESCRIPTION_1') + '"');
    lines.push('- Replace `CLIENT_EVENT_DESCRIPTION_2` with: "' + v('CLIENT_EVENT_DESCRIPTION_2') + '"');
    lines.push('- Replace `CLIENT_EVENT_DESCRIPTION_3` with: "' + v('CLIENT_EVENT_DESCRIPTION_3') + '"');
    lines.push('');
    lines.push('### Event Slugs & IDs');
    lines.push('**Generate** event slugs/IDs in the codebase (e.g. from client name + event name + date). Then replace if present:');
    lines.push('- Replace `CLIENT_EVENT_SLUG_FIRST` with a generated slug (e.g. `' + clientDirName + '-event-YYYY-MM-DD`)');
    lines.push('- Replace `CLIENT_EVENT_SLUG_SECOND` with a generated slug');
    lines.push('- Replace `CLIENT_EVENT_SLUG` with default event slug for API');
    lines.push('- Replace `CLIENT_DEFAULT_EVENT_NAME` with: "' + v('CLIENT_EVENT_NAME') + '"');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## STEP 3: Update Ticketing Tiers Configuration');
    lines.push('');
    lines.push('In `' + clientDirPath + 'config/ticketing-tiers.json` (or equivalent config file), set the ticketing structure:');
    lines.push('');
    lines.push('```json');
    lines.push(ticketingTiersJson);
    lines.push('```');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## STEP 4: Handle Client Images');
    lines.push('');
    lines.push(organizerImageInstructions);
    lines.push('');
    lines.push('### Hero & Event Images');
    lines.push('Add or reference these in `' + clientDirPath + 'public/images/`:');
    lines.push('- Left hero image: **' + v('CLIENT_HERO_IMAGE_LEFT') + '**');
    lines.push('- Right hero image: **' + v('CLIENT_HERO_IMAGE_RIGHT') + '**');
    lines.push('- Event poster: **' + v('CLIENT_EVENT_POSTER_IMAGE_URL') + '**');
    lines.push('');
    lines.push('If values are URLs, references are already set. If they are local paths, ensure the image files are placed in the client\'s `public/images/` folder.');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## STEP 5: Configure Environment Variables');
    lines.push('');
    lines.push('Create/update `' + clientDirPath + 'config/config.env` with:');
    lines.push('');
    lines.push('```env');
    lines.push('# Client Identity');
    lines.push('ORGANIZER_NAME=' + v('CLIENT_ORGANIZER_NAME'));
    lines.push('CLIENT_NAME=' + v('CLIENT_NAME'));
    lines.push('');
    lines.push('# Deployment');
    lines.push('BASE_URL=https://' + clientSubdomain + '.eventbrella.us');
    lines.push('');
    lines.push('# Venue');
    lines.push('CLIENT_VENUE_NAME=' + v('CLIENT_VENUE_NAME'));
    lines.push('CLIENT_ADDRESS_LINE1=' + v('CLIENT_ADDRESS_LINE1'));
    lines.push('CLIENT_ADDRESS_LINE2=' + v('CLIENT_ADDRESS_LINE2'));
    lines.push('');
    lines.push('# Events');
    lines.push('CLIENT_EVENT_SLUG=<generated-or-default>');
    lines.push('CLIENT_DEFAULT_EVENT_NAME=' + v('CLIENT_EVENT_NAME'));
    lines.push('');
    lines.push('# Payment (configure with client keys)');
    lines.push('STRIPE_SECRET_KEY=');
    lines.push('STRIPE_PUBLISHABLE_KEY=');
    lines.push('STRIPE_WEBHOOK_SECRET=');
    lines.push('');
    lines.push('# Email (configure with client)');
    lines.push('KLAVIYO_API_KEY=');
    lines.push('SENDGRID_API_KEY=');
    lines.push('```');
    lines.push('');
    lines.push('### Vercel Environment Variables');
    lines.push('Set these in the Vercel project for this client:');
    lines.push('- `ORGANIZER_NAME` → ' + v('CLIENT_ORGANIZER_NAME'));
    lines.push('- `BASE_URL` → https://' + clientSubdomain + '.eventbrella.us');
    lines.push('- `CLIENT_VENUE_NAME` → ' + v('CLIENT_VENUE_NAME'));
    lines.push('- `CLIENT_ADDRESS_LINE1` → ' + v('CLIENT_ADDRESS_LINE1'));
    lines.push('- `CLIENT_ADDRESS_LINE2` → ' + v('CLIENT_ADDRESS_LINE2'));
    lines.push('- `CLIENT_EVENT_SLUG` → (generated default)');
    lines.push('- `CLIENT_DEFAULT_EVENT_NAME` → ' + v('CLIENT_EVENT_NAME'));
    lines.push('- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (client provides)');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## STEP 6: Update Email Templates');
    lines.push('');
    lines.push('In `' + clientDirPath + '` (in `emails/`, `public/`, or wherever email templates live), replace any `CLIENT_*` placeholders in:');
    lines.push('- ticket-confirmation.html');
    lines.push('- order-receipt.html');
    lines.push('- farm-tour-newsletter-december-14.html (if applicable)');
    lines.push('- monthly-farm-tour-email.html (if applicable)');
    lines.push('- farm-tour-newsletter-email.html (if applicable)');
    lines.push('- klaviyo-ticket-email-template.html (if applicable)');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## STEP 7: Verify All Replacements');
    lines.push('');
    lines.push('1. **Search** the new client directory for `CLIENT_` and fix any remaining placeholders.');
    lines.push('2. **Count** total files modified and total replacements.');
    lines.push('3. **Verify structure:**');
    lines.push('   - /public (HTML, JS, images)');
    lines.push('   - /api (endpoints)');
    lines.push('   - /config (config.env, ticketing-tiers)');
    lines.push('   - Email templates updated');
    lines.push('4. **Critical files:** index.html, allevents.html, config.json, vercel.json, API endpoints.');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## STEP 8: Deployment Summary');
    lines.push('');
    lines.push('**Client system ready:** ' + v('CLIENT_NAME'));
    lines.push('');
    lines.push('**Directory:** `' + clientDirPath + '`');
    lines.push('');
    lines.push('**Next steps:**');
    lines.push('1. Add client images to `public/images/` (organizer photo: ' + (data.organizerImageFileName || 'as provided') + '; hero and poster as above).');
    lines.push('2. Configure Stripe (keys in Vercel); webhook: `https://' + clientSubdomain + '.eventbrella.us/api/stripe-webhook`.');
    lines.push('3. Configure email (Klaviyo/SendGrid keys in Vercel).');
    lines.push('4. Deploy: `cd ' + clientDirPath + ' && vercel --prod`');
    lines.push('5. Set all Vercel environment variables (see STEP 5).');
    lines.push('6. Test: event pages → checkout → payment → confirmation email → ticket with QR → scanner validation.');
    lines.push('');
    lines.push('**Production URL:** https://' + clientSubdomain + '.eventbrella.us');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Execution Checklist');
    lines.push('');
    lines.push('- [ ] Step 1: New client directory created (template copied to ' + clientDirName + ')');
    lines.push('- [ ] Step 2: All placeholders replaced in **new** directory only');
    lines.push('- [ ] Step 3: Ticketing tiers configured');
    lines.push('- [ ] Step 4: Image instructions applied');
    lines.push('- [ ] Step 5: Environment variables documented');
    lines.push('- [ ] Step 6: Email templates updated');
    lines.push('- [ ] Step 7: Verification complete');
    lines.push('- [ ] Step 8: Deployment summary generated');
    lines.push('- [ ] **Template directory unchanged**');
    lines.push('- [ ] No remaining CLIENT_* placeholders in new directory (except in docs/comments if intentional)');
    lines.push('');
    lines.push('**Begin execution. Report progress and any issues.**');

    return lines.join('\n');
  }

  global.buildCursorPrompt = buildCursorPrompt;

  global.exampleClientData = {
    CLIENT_NAME: 'Here On The Farm',
    CLIENT_ORGANIZER_NAME: 'Here On The Farm',
    CLIENT_EVENT_NAME: 'Farm Tours',
    CLIENT_EVENT_TIME: '9:00 AM - 11:00 AM EST',
    CLIENT_EVENT_DESCRIPTION: 'Join us for a guided farm tour. Learn about sustainable practices, meet the animals, and taste fresh produce.',
    CLIENT_VENUE_NAME: 'Here On The Farm',
    CLIENT_ADDRESS_LINE1: '123 Farm Road',
    CLIENT_ADDRESS_LINE2: 'Savannah, GA 31401',
    CLIENT_PHONE: '(912) 555-0123',
    CLIENT_WEBSITE_URL: 'https://hereonthefarm.com',
    CLIENT_CONTACT_EMAIL: 'hello@hereonthefarm.com',
    CLIENT_HERO_IMAGE_LEFT: '/images/farmer-banks-field.png',
    CLIENT_HERO_IMAGE_RIGHT: '/images/farmer-banks-greenhouse.png',
    CLIENT_EVENT_POSTER_IMAGE_URL: 'https://hereonthefarm.com/images/cassava-harvest-poster.jpg',
  };
})(typeof window !== 'undefined' ? window : this);
