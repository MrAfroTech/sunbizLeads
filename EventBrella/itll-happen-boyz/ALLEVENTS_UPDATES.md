# All Events Page Updates - Summary for Claude

## Overview

Updated `/allevents.html` and `/js/allevents.js` to consolidate 12 monthly harvest events into one card with a dropdown, and reformatted the three special event boxes (Cassava, Yuca, Mulberry) to match the styling.

## Files Modified

1. `/public/allevents.html` - Main page structure and styling
2. `/public/js/allevents.js` - Event rendering logic

## Changes Made

### 1. Banner Section Updates

**File:** `allevents.html`

- **Removed hero image** from the top banner (was showing event poster)
- **Added two side images:**
  - Left: `/images/farmer-banks-field.png`
  - Right: `/images/Banks-with-a-shovel.png`
- **Condensed banner height:**
  - Reduced padding: 60px → 30px (center), 40px → 20px (sides)
  - Reduced title font size: 48px → 2.5rem (~40px)
  - Reduced spacing between elements (margins: 30px → 15px, 40px → 25px)
  - Set min-height: 420px → 320px
  - Made side images smaller: 100% → 85% width
- **Added event detail badges** (4 badges in banner):
  - 🔨 Bring Your Own Shovel
  - 🌾 Harvesting
  - 🚜 Farmer Tours
  - 👨‍🍳 Cooking Tips
  - Badges styled with semi-transparent background, icons, white text

### 2. Event Cards Consolidation

**File:** `allevents.js`

**Before:** 15 individual event cards (12 monthly + 3 special)

**After:** 4 event cards total

#### Box 1: Monthly Harvest Experience
- Single card for all 12 monthly events
- Contains a dropdown with all 12 dates
- Structure:
  ```
  - Title: "Monthly Harvest Experience"
  - Time: "8:00 AM - 10:00 AM EST"
  - Venue: "Here On The Farm"
  - "Select Date:" label with dropdown (12 date options)
  - Price: $10.00
  - "Get Tickets" button (disabled until date selected)
  ```

#### Boxes 2-4: Special Events (Cassava, Yuca, Mulberry)
- Each has its own card
- Structure:
  ```
  - "Select Date:" label (left) + Date text (right, same line)
  - Title split into two lines:
    * Line 1: "Cassava" / "Yuca" / "Mulberry"
    * Line 2: "Harvest"
  - Time: "8:00 AM - 10:00 AM EST"
  - Venue: "Here On The Farm"
  - Price: $10.00
  - "Get Tickets" button
  ```

### 3. JavaScript Updates

**File:** `allevents.js`

**Separated events into two arrays:**
- `MONTHLY_HARVEST_EVENTS` - 12 monthly events (dates only)
- `SPECIAL_EVENTS` - 3 special events (full event objects)

**Rendering logic:**
1. Creates Monthly Harvest card with dropdown
2. Populates dropdown with all 12 monthly dates
3. Creates 3 special event cards with:
   - Name splitting logic (e.g., "Cassava Harvest" → "Cassava" + "Harvest")
   - "Select Date:" label with static date display
   - Consistent styling

**Event selection:**
- Monthly: User selects date from dropdown → button enables → redirects to payment
- Special events: Direct "Get Tickets" → redirects to payment

### 4. Grid Layout

**File:** `allevents.html`

- Changed grid from `repeat(auto-fill, minmax(300px, 1fr))` to `repeat(4, 1fr)`
- All 4 boxes fit on one line on desktop
- Container width: 1200px → 1400px
- Responsive breakpoints:
  - Desktop: 4 columns
  - Tablet (<1200px): 2 columns
  - Mobile (<768px): 1 column

### 5. Styling Consistency

**File:** `allevents.html` (CSS section)

- Reduced card padding: 25px → 20px
- Reduced gap between cards: 30px → 20px
- Adjusted font sizes for better fit
- Made event-date styling smaller (1.1rem → 0.95rem, bold → 600 weight)
- Made event-name larger (1.15rem → 1.3rem) for prominence

## Key Code Changes

### Event Name Splitting (allevents.js)
```javascript
const nameParts = event.name.split(' ');
const firstName = nameParts[0]; // "Cassava", "Yuca", or "Mulberry"
const lastName = nameParts.slice(1).join(' '); // "Harvest"
```

### Date Display (allevents.js)
```javascript
// For special events - "Select Date:" label with date on same line
<div style="display: flex; justify-content: space-between; align-items: baseline;">
    <span>Select Date:</span>
    <span>${event.displayDate}</span>
</div>
```

### Title Split Display (allevents.js)
```javascript
// Two-line title display
<div style="font-size: 1.3rem; font-weight: bold; color: #333;">
    <div>${firstName}</div>
    <div>${lastName}</div>
</div>
```

## Result

- **Before:** 15 separate event cards in a grid
- **After:** 4 unified event cards, all fitting on one line
  - Box 1: Monthly Harvest Experience (with dropdown for 12 dates)
  - Box 2: Cassava Harvest (fixed date)
  - Box 3: Yuca Harvest (fixed date)
  - Box 4: Mulberry Harvest (fixed date)

All boxes now have consistent styling and structure, with "Select Date:" labels at the top.









