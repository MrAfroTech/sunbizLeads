# Email Copy Versions for Farmer Banks Events

## Event IDs Reference

### Monthly Harvest Experience Events
- `harvest-2025-12-14` - December 14, 2025 (Sunday - Second Sunday)
- `harvest-2026-01-11` - January 11, 2026 (Sunday - Second Sunday)
- `harvest-2026-02-08` - February 8, 2026
- `harvest-2026-03-08` - March 8, 2026
- `harvest-2026-04-12` - April 12, 2026
- `harvest-2026-05-10` - May 10, 2026
- `harvest-2026-06-14` - June 14, 2026
- `harvest-2026-07-12` - July 12, 2026
- `harvest-2026-08-09` - August 9, 2026
- `harvest-2026-09-13` - September 13, 2026
- `harvest-2026-10-11` - October 11, 2026
- `harvest-2026-11-08` - November 8, 2026

### Special Events
- `cassava-harvest-2026-01-03` - Cassava Harvest, January 3, 2026
- `yuca-harvest-2026-03-03` - Yuca Harvest, March 3, 2026
- `mulberry-harvest-2026-04-03` - Mulberry Harvest, April 3, 2026

---

## Monthly Farm Tour - Reusable Email Template

### Template Structure (Update These Fields Each Month):

**DYNAMIC FIELDS TO UPDATE:**
1. `[DAY_OF_WEEK]` - e.g., "Saturday" or "Sunday"
2. `[FULL_DATE]` - e.g., "December 14th" or "January 12th"
3. `[EVENT_ID]` - Event ID from allevents.js (e.g., "harvest-2025-12-14")
4. `[MONTH_YEAR]` - Campaign tracking (e.g., "dec14" or "jan12")

### Subject Line:
```
This [DAY_OF_WEEK] at the farm...
```

### Email Body:
```
Hey {{ contact.FIRSTNAME }},

Quick one...

[DAY_OF_WEEK], [FULL_DATE] at 8 AM, we're doing a farm tour.

Come walk the farm with Farmer Banks, see what's growing, learn about sustainable farming, and get your hands dirty if you want.

Bring your shovel if you want to dig. Take home whatever's ready.

2 hours. $10. Real experience.

[CTA BUTTON: "Get My Ticket"]

See you [DAY_OF_WEEK],

Farmer Banks

P.S. - Event starts at 8 AM sharp.
```

### CTA Link Format:
```
https://eventbrella.us/event/[EVENT_ID]?email={{ contact.EMAIL }}&name={{ contact.FIRSTNAME }} {{ contact.LASTNAME }}&source=brevo&campaign=tour_[MONTH_YEAR]
```

**Note:** The form will automatically pre-populate with email and name from the URL parameters.

---

## VERSION 1: December 14, 2025 - Monthly Farm Tour

### Subject Line:
```
This Sunday at the farm...
```

### Email Body:
```
Hey {{ contact.FIRSTNAME }},

Quick one...

Sunday, December 14th at 8 AM, we're doing a farm tour.

Come walk the farm with Farmer Banks, see what's growing, learn about sustainable farming, and get your hands dirty if you want.

Bring your shovel if you want to dig. Take home whatever's ready.

2 hours. $10. Real experience.

[CTA BUTTON: "Get My Ticket"]

See you Sunday,

Farmer Banks

P.S. - Event starts at 8 AM sharp.
```

### CTA Link:
```
https://eventbrella.us/event/harvest-2025-12-14?email={{ contact.EMAIL }}&name={{ contact.FIRSTNAME }} {{ contact.LASTNAME }}&source=brevo&campaign=tour_dec14
```

---

## VERSION 2: January 11, 2026 - Monthly Farm Tour (Second Sunday)

### Subject Line:
```
This Sunday at the farm...
```

### Email Body:
```
Hey {{ contact.FIRSTNAME }},

Quick one...

Sunday, January 11th at 8 AM, we're doing a farm tour.

Come walk the farm with Farmer Banks, see what's growing, learn about sustainable farming, and get your hands dirty if you want.

Bring your shovel if you want to dig. Take home whatever's ready.

2 hours. $10. Real experience.

[CTA BUTTON: "Get My Ticket"]

See you Sunday,

Farmer Banks

P.S. - Event starts at 8 AM sharp.
```

### CTA Link:
```
https://eventbrella.us/event/harvest-2026-01-11?email={{ contact.EMAIL }}&name={{ contact.FIRSTNAME }} {{ contact.LASTNAME }}&source=brevo&campaign=tour_jan11
```

---

## Instructions for Cursor: Build Monthly Farm Tour HTML Email Template

### Template Requirements:

```
Update the HTML email template to be a REUSABLE template for the Monthly Farm Tour (recurring second Sunday event).

MAKE THESE FIELDS DYNAMIC/EASY TO UPDATE:

1. Event date (e.g., "December 14th" or "January 12th")
2. Day of week (e.g., "Saturday" or "Sunday")
3. Event ID in CTA link
4. Campaign tracking parameter in CTA link

THE COPY STAYS THE SAME - ONLY DATES CHANGE:

Subject: This [DAY_OF_WEEK] at the farm...

Body:
Hey {{ contact.FIRSTNAME }},

Quick one...

[DAY_OF_WEEK], [FULL_DATE] at 8 AM, we're doing a farm tour.

Come walk the farm with Farmer Banks, see what's growing, learn about sustainable farming, and get your hands dirty if you want.

Bring your shovel if you want to dig. Take home whatever's ready.

2 hours. $10. Real experience.

[CTA BUTTON: "Get My Ticket"]

See you [DAY_OF_WEEK],

Farmer Banks

P.S. - Event starts at 8 AM sharp.

CTA LINK FORMAT:
https://eventbrella.us/event/[EVENT_ID]?email={{ contact.EMAIL }}&name={{ contact.FIRSTNAME }} {{ contact.LASTNAME }}&source=brevo&campaign=tour_[MONTH_YEAR]

CREATE TWO VERSIONS:

VERSION 1 - December 14, 2025:
- DAY_OF_WEEK: Saturday
- FULL_DATE: December 14th
- EVENT_ID: harvest-2025-12-14
- CAMPAIGN: tour_dec14

VERSION 2 - January 11, 2026:
- DAY_OF_WEEK: Sunday
- FULL_DATE: January 11th
- EVENT_ID: harvest-2026-01-11
- CAMPAIGN: tour_jan11

LAYOUT REQUIREMENTS:
- Use table-based layout (not divs/flexbox)
- Maximum width: 600px
- All CSS must be inline
- Mobile-responsive design
- Web-safe fonts only (Arial, Helvetica, Georgia)

STRUCTURE:
1. Header section with logo (centered)
2. Body content area with copy
3. CTA button (centered, prominent)
4. Footer with unsubscribe link and address

CTA BUTTON:
- Text: "Get My Ticket"
- Style: Green/earth tone background (#4A7C59), white text, 15px padding, rounded corners (5px), bold font, 18px font size
- Make it a table-based button for email compatibility

FOOTER:
Include:
- Business name: Here On The Farm
- Address: 9100 Sams Lake Road, Clermont, FL 34715
- Phone: +1 (407) 616-9720
- Unsubscribe link placeholder: {{ unsubscribe }}
- Small gray text, 12px font

BRAND COLORS:
- Primary: Earth tones (greens, browns)
- Background: Light cream/off-white (#F9F7F4)
- Text: Dark gray (#333333)
- Accent: Farm green (#4A7C59)

TECHNICAL REQUIREMENTS:
- Inline all CSS styles
- Use cellpadding="0" cellspacing="0" border="0" on all tables
- Include alt text for images
- Test in major email clients (Gmail, Outlook, Apple Mail)
- Ensure CTA button works without images enabled
- Keep total file size under 100KB
- Add clear HTML comments showing which lines to update each month

OUTPUT:
Provide complete, ready-to-paste HTML code for BOTH versions (December 14 and January 12) that can be imported directly into Brevo.
Add HTML comments like <!-- UPDATE: Change "Saturday" to "Sunday" --> to mark dynamic fields.
```

---

## Email Version A: Russell Brunson Style (Simple & Direct) - Cassava Harvest

### Subject Line:
```
Quick question about Saturday...
```

### Email Body:
```
Hey {{ contact.FIRSTNAME }},

Quick one...

Ever dug fresh cassava straight from the earth with your own hands?

We're hosting a Cassava Harvest this Saturday, January 3rd at 8 AM here on the farm.

Bring your shovel, get your hands dirty, and take home the cassava you harvest yourself.

Farmer Banks will show you the proper technique, share cooking tips, and give you a tour of the farm.

It's 2 hours, $10, and one of those experiences you'll actually remember.

Spots are limited.

[CTA BUTTON: "Get My Ticket"]

See you on the farm,

Farmer Banks

P.S. - Don't forget your shovel. Seriously.
```

### CTA Link:
```
https://eventbrella.us/event/cassava-harvest-2026-01-03?email={{ contact.EMAIL }}&name={{ contact.FIRSTNAME }} {{ contact.LASTNAME }}&source=brevo&campaign=cassava_jan2026
```

**Note:** The form will automatically pre-populate with email and name from the URL parameters.

---

## Email Version B: More Direct

### Subject Line:
```
Cassava Harvest - Saturday 8 AM
```

### Email Body:
```
Hey {{ contact.FIRSTNAME }},

Cassava Harvest this Saturday, January 3rd.

8 AM at the farm. Bring your shovel.

$10. 2 hours. Hands-on harvesting with Farmer Banks.

[CTA BUTTON: "Count Me In"]

- Farmer Banks
```

### CTA Link:
```
https://eventbrella.us/event/cassava-harvest-2026-01-03?email={{ contact.EMAIL }}&name={{ contact.FIRSTNAME }} {{ contact.LASTNAME }}&source=brevo&campaign=cassava_jan2026
```

**Note:** The form will automatically pre-populate with email and name from the URL parameters.

---

## Email Version C: Story Hook

### Subject Line:
```
My shovel broke last harvest...
```

### Email Body:
```
Hey {{ contact.FIRSTNAME }},

Last cassava harvest, someone showed up with a plastic beach shovel.

It didn't end well.

This Saturday (January 3rd, 8 AM), we're doing it again.

Bring a REAL shovel. Learn to harvest cassava the right way. Take home what you dig.

$10. Farm tour included.

[CTA BUTTON: "I'm In"]

See you there,

Farmer Banks

P.S. - Seriously, bring a sturdy shovel.
```

### CTA Link:
```
https://eventbrella.us/event/cassava-harvest-2026-01-03?email={{ contact.EMAIL }}&name={{ contact.FIRSTNAME }} {{ contact.LASTNAME }}&source=brevo&campaign=cassava_jan2026
```

**Note:** The form will automatically pre-populate with email and name from the URL parameters.

---

## Instructions for Cursor: Build HTML Email Templates

### For Version A (Russell Brunson Style):

```
Build an HTML email template for a farm harvest event with these specifications:

LAYOUT REQUIREMENTS:
- Use table-based layout (not divs/flexbox)
- Maximum width: 600px
- All CSS must be inline
- Mobile-responsive design
- Web-safe fonts only (Arial, Helvetica, Georgia)

STRUCTURE:
1. Header section with logo (centered)
2. Body content area with copy
3. CTA button (centered, prominent)
4. Footer with unsubscribe link and address

EMAIL COPY:
Subject: Quick question about Saturday...

Body:
Hey {{ contact.FIRSTNAME }},

Quick one...

Ever dug fresh cassava straight from the earth with your own hands?

We're hosting a Cassava Harvest this Saturday, January 3rd at 8 AM here on the farm.

Bring your shovel, get your hands dirty, and take home the cassava you harvest yourself.

Farmer Banks will show you the proper technique, share cooking tips, and give you a tour of the farm.

It's 2 hours, $10, and one of those experiences you'll actually remember.

Spots are limited.

[CTA BUTTON HERE]

See you on the farm,

Farmer Banks

P.S. - Don't forget your shovel. Seriously.

CTA BUTTON:
- Text: "Get My Ticket"
- Link: https://eventbrella.us/event/cassava-harvest-2026-01-03?email={{ contact.EMAIL }}&name={{ contact.FIRSTNAME }} {{ contact.LASTNAME }}&source=brevo&campaign=cassava_jan2026
- Style: Green/earth tone background (#4A7C59 or similar farm color), white text, 15px padding, rounded corners (5px), bold font, 18px font size
- Make it a table-based button for email compatibility

FOOTER:
Include:
- Business name: Here On The Farm
- Address: 9100 Sams Lake Road, Clermont, FL 34715
- Phone: +1 (407) 616-9720
- Unsubscribe link placeholder: {{ unsubscribe }}
- Small gray text, 12px font

BRAND COLORS:
- Primary: Earth tones (greens, browns)
- Background: Light cream/off-white (#F9F7F4)
- Text: Dark gray (#333333)
- Accent: Farm green (#4A7C59)

IMAGE PLACEHOLDER:
- Include space for logo at top (150px wide max)
- Use placeholder: https://eventbrella.us/images/logo.png

TECHNICAL REQUIREMENTS:
- Inline all CSS styles
- Use cellpadding="0" cellspacing="0" border="0" on all tables
- Include alt text for images
- Test in major email clients (Gmail, Outlook, Apple Mail)
- Ensure CTA button works without images enabled
- Keep total file size under 100KB

OUTPUT:
Provide complete, ready-to-paste HTML code that can be imported directly into Brevo.
```

### For Version B (More Direct):

```
Build an HTML email template for a farm harvest event with these specifications:

LAYOUT REQUIREMENTS:
- Use table-based layout (not divs/flexbox)
- Maximum width: 600px
- All CSS must be inline
- Mobile-responsive design
- Web-safe fonts only (Arial, Helvetica, Georgia)

STRUCTURE:
1. Header section with logo (centered)
2. Body content area with copy
3. CTA button (centered, prominent)
4. Footer with unsubscribe link and address

EMAIL COPY:
Subject: Cassava Harvest - Saturday 8 AM

Body:
Hey {{ contact.FIRSTNAME }},

Cassava Harvest this Saturday, January 3rd.

8 AM at the farm. Bring your shovel.

$10. 2 hours. Hands-on harvesting with Farmer Banks.

[CTA BUTTON HERE]

- Farmer Banks

CTA BUTTON:
- Text: "Count Me In"
- Link: https://eventbrella.us/event/cassava-harvest-2026-01-03?email={{ contact.EMAIL }}&name={{ contact.FIRSTNAME }} {{ contact.LASTNAME }}&source=brevo&campaign=cassava_jan2026
- Style: Green/earth tone background (#4A7C59), white text, 15px padding, rounded corners (5px), bold font, 18px font size
- Make it a table-based button for email compatibility

FOOTER:
Include:
- Business name: Here On The Farm
- Address: 9100 Sams Lake Road, Clermont, FL 34715
- Phone: +1 (407) 616-9720
- Unsubscribe link placeholder: {{ unsubscribe }}
- Small gray text, 12px font

BRAND COLORS:
- Primary: Earth tones (greens, browns)
- Background: Light cream/off-white (#F9F7F4)
- Text: Dark gray (#333333)
- Accent: Farm green (#4A7C59)

TECHNICAL REQUIREMENTS:
- Inline all CSS styles
- Use cellpadding="0" cellspacing="0" border="0" on all tables
- Include alt text for images
- Test in major email clients (Gmail, Outlook, Apple Mail)
- Ensure CTA button works without images enabled
- Keep total file size under 100KB

OUTPUT:
Provide complete, ready-to-paste HTML code that can be imported directly into Brevo.
```

### For Version C (Story Hook):

```
Build an HTML email template for a farm harvest event with these specifications:

LAYOUT REQUIREMENTS:
- Use table-based layout (not divs/flexbox)
- Maximum width: 600px
- All CSS must be inline
- Mobile-responsive design
- Web-safe fonts only (Arial, Helvetica, Georgia)

STRUCTURE:
1. Header section with logo (centered)
2. Body content area with copy
3. CTA button (centered, prominent)
4. Footer with unsubscribe link and address

EMAIL COPY:
Subject: My shovel broke last harvest...

Body:
Hey {{ contact.FIRSTNAME }},

Last cassava harvest, someone showed up with a plastic beach shovel.

It didn't end well.

This Saturday (January 3rd, 8 AM), we're doing it again.

Bring a REAL shovel. Learn to harvest cassava the right way. Take home what you dig.

$10. Farm tour included.

[CTA BUTTON HERE]

See you there,

Farmer Banks

P.S. - Seriously, bring a sturdy shovel.

CTA BUTTON:
- Text: "I'm In"
- Link: https://eventbrella.us/event/cassava-harvest-2026-01-03?email={{ contact.EMAIL }}&name={{ contact.FIRSTNAME }} {{ contact.LASTNAME }}&source=brevo&campaign=cassava_jan2026
- Style: Green/earth tone background (#4A7C59), white text, 15px padding, rounded corners (5px), bold font, 18px font size
- Make it a table-based button for email compatibility

FOOTER:
Include:
- Business name: Here On The Farm
- Address: 9100 Sams Lake Road, Clermont, FL 34715
- Phone: +1 (407) 616-9720
- Unsubscribe link placeholder: {{ unsubscribe }}
- Small gray text, 12px font

BRAND COLORS:
- Primary: Earth tones (greens, browns)
- Background: Light cream/off-white (#F9F7F4)
- Text: Dark gray (#333333)
- Accent: Farm green (#4A7C59)

TECHNICAL REQUIREMENTS:
- Inline all CSS styles
- Use cellpadding="0" cellspacing="0" border="0" on all tables
- Include alt text for images
- Test in major email clients (Gmail, Outlook, Apple Mail)
- Ensure CTA button works without images enabled
- Keep total file size under 100KB

OUTPUT:
Provide complete, ready-to-paste HTML code that can be imported directly into Brevo.
```

---

## Event ID Format for CTA Links

All CTA links should follow this format:
```
https://eventbrella.us/event/[EVENT_ID]?email={{ contact.EMAIL }}&name={{ contact.FIRSTNAME }} {{ contact.LASTNAME }}&source=brevo&campaign=[CAMPAIGN_NAME]
```

**Pre-population:** The payment form will automatically fill in the email and name fields when these URL parameters are present. Users can still edit the fields if needed.

### Event ID Examples:
- Monthly Harvest: `harvest-2026-01-11`
- Cassava Harvest: `cassava-harvest-2026-01-03`
- Yuca Harvest: `yuca-harvest-2026-03-03`
- Mulberry Harvest: `mulberry-harvest-2026-04-03`

### Campaign Name Examples:
- `cassava_jan2026`
- `monthly_harvest_dec2025`
- `yuca_mar2026`
- `mulberry_apr2026`

---

## Date Fix Applied

**Fixed:** January 2026 date changed from `2026-01-12` (Monday) to `2026-01-11` (Sunday - second Sunday of the month)

All other dates were verified as correct second Sundays of their respective months.

