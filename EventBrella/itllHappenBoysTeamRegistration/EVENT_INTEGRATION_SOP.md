# Event Integration SOP: Farmer Banks → EventBrella UI
## Standard Operating Procedure for Integrating Events with EventBrella Platform

---

## 📋 Executive Summary

This document outlines the current event structure in the Farmer Banks codebase and provides a roadmap for integrating these events with the EventBrella UI platform. **No code changes have been made** - this is an analysis and integration guide.

---

## 🔍 Current Event Structure Analysis

### 1. Event Types Identified

The Farmer Banks codebase currently defines **3 distinct event types**:

#### A. Monthly Farm Tour Events (Recurring)
- **Frequency:** 12 events per year (second Sunday of each month)
- **Time:** 9:00 AM - 11:00 AM EST
- **Price:** $10.00 per ticket
- **Location:** Here On The Farm, 9100 Sams Lake Road, Clermont, FL 34715
- **Current Dates (2025-2026):**
  - December 14, 2025
  - January 11, 2026
  - February 8, 2026
  - March 8, 2026
  - April 12, 2026
  - May 10, 2026
  - June 14, 2026
  - July 12, 2026
  - August 9, 2026
  - September 13, 2026
  - October 11, 2026
  - November 8, 2026

#### B. Special Harvest Events (One-Time)
- **Cassava/Yuca Harvest**
  - Date: January 3, 2026
  - Time: 8:00 AM - 10:00 AM EST
  - Price: $10.00
  
- **Sugar Cane Harvest**
  - Date: March 14, 2026
  - Time: 8:00 AM - 10:00 AM EST
  - Price: $10.00

#### C. Additional Events (Documented but not in code)
- **Yuca Harvest:** March 3, 2026 (mentioned in EVENT_DESCRIPTIONS_FOR_COPY.md)
- **Mulberry Harvest:** April 3, 2026 (mentioned in EVENT_DESCRIPTIONS_FOR_COPY.md)

---

## 📁 File Structure & Event Data Locations

### Frontend Event Definitions (Hardcoded in JavaScript)

#### 1. `public/js/allevents.js`
- **Purpose:** Main events page showing all event types
- **Contains:**
  - `MONTHLY_HARVEST_EVENTS` array (12 dates)
  - `SPECIAL_EVENTS` array (Cassava, Sugar Cane)
  - Event rendering logic
  - Redirects to `/payment.html` with event parameters

#### 2. `public/js/farm-tours.js`
- **Purpose:** Farm Tours page (shows only Monthly Farm Tour)
- **Contains:**
  - `MONTHLY_HARVEST_EVENTS` array (same 12 dates)
  - Redirects to `/payment.html`

#### 3. `public/js/harvest-experiences.js`
- **Purpose:** Harvest Experiences page (shows only special harvest events)
- **Contains:**
  - `SPECIAL_EVENTS` array (Cassava, Sugar Cane)
  - Redirects to `/payment.html`

#### 4. `platformDrivenPages/tours/farm-tours.js`
- **Purpose:** Platform-driven version of farm tours
- **Contains:**
  - Same `MONTHLY_HARVEST_EVENTS` array
  - Redirects to `/platformDrivenPages/tours/payment.html`

#### 5. `platformDrivenPages/tours/harvest-experiences.js`
- **Purpose:** Platform-driven version of harvest experiences
- **Contains:**
  - Same `SPECIAL_EVENTS` array
  - Redirects to `/platformDrivenPages/tours/payment.html`

### Event Data Structure (Current Format)

```javascript
// Monthly Event Format
{
  id: 'harvest-2025-12-14',
  date: '2025-12-14',
  displayDate: 'Sunday, December 14, 2025'
}

// Special Event Format
{
  id: 'cassava-harvest-2026-01-03',
  name: 'Cassava/Yuca Harvest',
  date: '2026-01-03',
  displayDate: 'Saturday, January 3, 2026',
  time: '8:00 AM - 10:00 AM EST',
  venue: 'Here On The Farm',
  organizer: 'Farmer Banks Helfrich',
  price: 10.00,
  tier: 'basic',
  description: 'Join us for a special cassava and yuca harvest!...'
}
```

---

## 🗄️ Database Schema (Current vs. Intended)

### Current Database: Supabase (PostgreSQL)
- **Table:** `tickets`
- **Purpose:** Stores ticket purchases and check-ins
- **Event Data:** Stored in ticket records as:
  - `event_name` (VARCHAR)
  - `event_date` (DATE)
  - `event_time` (VARCHAR)
  - `event_venue` (VARCHAR)

### Intended Database: DynamoDB (Not Yet Implemented)
- **Schema File:** `schemas/events-schema.js`
- **Table Name:** `FarmerBanks-Events-prod` (from env var `EVENTS_TABLE`)
- **Schema Fields:**
  - `event_id` (Primary Key)
  - `event_type` (bi-weekly, late-winter, early-spring)
  - `event_date` (ISO date string)
  - `event_time` (e.g., "14:00:00")
  - `available_slots` (Number)
  - `booked_slots` (Number)
  - `price` (Number, in cents)
  - `status` (active, full, cancelled, completed)
  - `title` (String)
  - `description` (String)
  - `activities` (Array)
  - `location` (String)
  - `duration_minutes` (Number)
  - `special_notes` (String)
  - `created_at`, `updated_at` (Timestamps)

**⚠️ Note:** The DynamoDB events table schema exists but is **NOT currently being used**. Events are hardcoded in JavaScript files.

---

## 🔄 Current Event Flow

### 1. Event Display Flow
```
User visits page
  ↓
JavaScript file loads (allevents.js, farm-tours.js, or harvest-experiences.js)
  ↓
Event arrays (MONTHLY_HARVEST_EVENTS, SPECIAL_EVENTS) are defined
  ↓
renderEvents() function creates HTML cards
  ↓
User selects event
  ↓
selectEvent() function redirects to payment page with URL params:
  - eventDate (required)
  - eventName (optional)
```

### 2. Payment Flow
```
User clicks "Get Tickets"
  ↓
Redirects to /payment.html?eventDate=2026-01-03&eventName=Cassava/Yuca Harvest
  ↓
payment.html reads URL parameters
  ↓
Calls /api/stripe-payment.js with event data
  ↓
Stripe Checkout Session created
  ↓
User completes payment
  ↓
Stripe webhook fires → /api/stripe-webhook.js
  ↓
Ticket created in Supabase tickets table
  ↓
QR code generated
  ↓
Email sent via Klaviyo
```

---

## 🎯 Integration Points with EventBrella UI

### Critical Integration Areas

#### 1. **Event Data Source Migration**
**Current State:**
- Events are hardcoded in 5 different JavaScript files
- No single source of truth
- Manual updates required in multiple files

**Integration Goal:**
- Move event data to EventBrella platform
- Create API endpoint to fetch events dynamically
- Eliminate hardcoded event arrays

**Recommended Approach:**
```
EventBrella Platform
  ↓
API Endpoint: GET /api/events
  ↓
Returns JSON array of events
  ↓
Frontend JavaScript fetches and renders
```

#### 2. **Event Schema Mapping**

**Farmer Banks Current Format → EventBrella Format**

| Farmer Banks Field | EventBrella Equivalent | Notes |
|-------------------|----------------------|-------|
| `id` | `event_id` | Unique identifier |
| `date` | `event_date` | ISO date format |
| `displayDate` | `formatted_date` | Human-readable |
| `name` | `title` | Event name |
| `time` | `event_time` | Time range string |
| `venue` | `location` or `venue_name` | Location string |
| `organizer` | `organizer_name` | Organizer name |
| `price` | `price` | Price in dollars (convert to cents) |
| `tier` | `tier_type` | Ticket tier |
| `description` | `description` | Event description |

#### 3. **Event Type Classification**

**Current Event Types:**
- `MONTHLY_HARVEST_EVENTS` → Map to `event_type: 'monthly-farm-tour'`
- `SPECIAL_EVENTS` → Map to `event_type: 'special-harvest'`

**EventBrella Schema Supports:**
- `bi-weekly`
- `late-winter`
- `early-spring`

**Action Required:** Define event type mapping or extend EventBrella schema.

#### 4. **Payment Integration**

**Current:** 
- Payment page reads URL parameters (`eventDate`, `eventName`)
- Calls `/api/stripe-payment.js` with hardcoded event data

**Integration:**
- Payment page should fetch event details from EventBrella API
- Use `event_id` instead of `eventDate` + `eventName`
- API should return full event object including pricing, availability, etc.

#### 5. **Database Integration**

**Current:**
- Tickets stored in Supabase `tickets` table
- Events NOT stored in database (hardcoded)

**Integration Options:**

**Option A: Use EventBrella Events Table**
- Store events in EventBrella platform database
- Query events via API
- Sync event availability in real-time

**Option B: Hybrid Approach**
- Keep Supabase for tickets
- Use EventBrella for events
- Link via `event_id` or `event_date` + `event_name`

---

## 📝 Integration Checklist

### Phase 1: Data Migration
- [ ] Create EventBrella API endpoint for events
- [ ] Map current event data to EventBrella schema
- [ ] Migrate all 12 monthly events to EventBrella
- [ ] Migrate all special events (Cassava, Sugar Cane, etc.)
- [ ] Add missing events (Yuca, Mulberry) if needed

### Phase 2: Frontend Updates
- [ ] Replace hardcoded `MONTHLY_HARVEST_EVENTS` array with API call
- [ ] Replace hardcoded `SPECIAL_EVENTS` array with API call
- [ ] Update `renderEvents()` to fetch from API
- [ ] Add loading states while fetching events
- [ ] Add error handling for API failures
- [ ] Update all 5 JavaScript files (allevents.js, farm-tours.js, harvest-experiences.js, platform versions)

### Phase 3: Payment Flow Updates
- [ ] Update payment.html to accept `event_id` parameter
- [ ] Fetch event details from EventBrella API using `event_id`
- [ ] Update `/api/stripe-payment.js` to use EventBrella event data
- [ ] Ensure event metadata passed to Stripe includes EventBrella event_id

### Phase 4: Database Sync
- [ ] Decide on database strategy (EventBrella-only or hybrid)
- [ ] If hybrid: Create mapping between EventBrella events and Supabase tickets
- [ ] Update ticket creation to reference EventBrella event_id
- [ ] Ensure event availability updates reflect in real-time

### Phase 5: Testing
- [ ] Test event display on all pages (allevents, farm-tours, harvest-experiences)
- [ ] Test event selection and payment flow
- [ ] Test ticket creation with EventBrella event_id
- [ ] Test QR code generation and validation
- [ ] Test email sending with correct event data

---

## 🔧 Technical Implementation Recommendations

### 1. Create Event API Endpoint

**Suggested Endpoint:** `GET /api/events`

**Query Parameters:**
- `type` (optional): Filter by event type (monthly-farm-tour, special-harvest)
- `status` (optional): Filter by status (active, full, cancelled)
- `start_date` (optional): Filter events after this date
- `end_date` (optional): Filter events before this date

**Response Format:**
```json
{
  "events": [
    {
      "event_id": "evt_monthly_20260111",
      "event_type": "monthly-farm-tour",
      "event_date": "2026-01-11",
      "event_time": "09:00:00",
      "display_time": "9:00 AM - 11:00 AM EST",
      "title": "Monthly Farm Tour",
      "description": "Get ready to experience the wonders of farm life...",
      "venue": "Here On The Farm",
      "venue_address": "9100 Sams Lake Road, Clermont, FL 34715",
      "organizer": "Farmer Banks Helfrich",
      "price": 1000,
      "price_display": "$10.00",
      "available_slots": 30,
      "booked_slots": 5,
      "status": "active",
      "activities": [
        "Learn To Grow Your Own Groceries",
        "Pick and Eat Right Off Our Trees",
        "Walk in a Food Forest"
      ],
      "duration_minutes": 120
    }
  ],
  "total": 14
}
```

### 2. Update Frontend JavaScript

**Before (Hardcoded):**
```javascript
const MONTHLY_HARVEST_EVENTS = [
  { id: 'harvest-2025-12-14', date: '2025-12-14', displayDate: 'Sunday, December 14, 2025' },
  // ... more events
];
```

**After (API-Driven):**
```javascript
let MONTHLY_HARVEST_EVENTS = [];

async function loadEvents() {
  try {
    const response = await fetch('/api/events?type=monthly-farm-tour&status=active');
    const data = await response.json();
    MONTHLY_HARVEST_EVENTS = data.events.map(event => ({
      id: event.event_id,
      date: event.event_date,
      displayDate: formatDate(event.event_date),
      ...event
    }));
    renderEvents();
  } catch (error) {
    console.error('Failed to load events:', error);
    // Fallback to empty array or cached data
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
});
```

### 3. Update Payment Flow

**Before:**
```javascript
// payment.html reads URL params
const urlParams = new URLSearchParams(window.location.search);
const eventDate = urlParams.get('eventDate');
const eventName = urlParams.get('eventName');
```

**After:**
```javascript
// payment.html reads event_id and fetches full event data
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('event_id');

async function loadEventDetails() {
  const response = await fetch(`/api/events/${eventId}`);
  const event = await response.json();
  // Use event data for payment
}
```

---

## ⚠️ Critical Considerations

### 1. **Data Consistency**
- Currently, event data is duplicated across 5 files
- Any changes require manual updates in multiple places
- **Risk:** Events can become out of sync
- **Solution:** Single source of truth via EventBrella API

### 2. **Event Availability**
- Current system doesn't track available slots
- No real-time availability checking
- **Risk:** Overbooking possible
- **Solution:** EventBrella should track `available_slots` and `booked_slots`

### 3. **Event Updates**
- Adding new events requires code deployment
- Changing event details requires code changes
- **Risk:** Slow to respond to changes
- **Solution:** EventBrella admin panel for event management

### 4. **Date Generation**
- Monthly events are hardcoded for 12 months
- No automatic generation of future dates
- **Risk:** Manual work to extend event calendar
- **Solution:** EventBrella should support recurring event templates

### 5. **Event Descriptions**
- Rich descriptions exist in `EVENT_DESCRIPTIONS_FOR_COPY.md`
- Not all descriptions are in JavaScript files
- **Risk:** Inconsistent messaging
- **Solution:** Store full descriptions in EventBrella

---

## 📊 Event Data Inventory

### Events Currently in Code:
1. **Monthly Farm Tours:** 12 events (Dec 2025 - Nov 2026)
2. **Cassava/Yuca Harvest:** 1 event (Jan 3, 2026)
3. **Sugar Cane Harvest:** 1 event (Mar 14, 2026)

### Events Documented but Not in Code:
4. **Yuca Harvest:** 1 event (Mar 3, 2026) - *Needs to be added*
5. **Mulberry Harvest:** 1 event (Apr 3, 2026) - *Needs to be added*

### Total Events to Migrate: **15 events**

---

## 🚀 Next Steps

1. **Review this SOP** with EventBrella team
2. **Confirm EventBrella API structure** matches recommendations
3. **Create migration script** to move events from JavaScript to EventBrella
4. **Update frontend code** to use API instead of hardcoded arrays
5. **Test integration** thoroughly before deployment
6. **Monitor** for any issues post-deployment

---

## 📞 Questions to Resolve

1. Does EventBrella support recurring event templates (for monthly events)?
2. What is the EventBrella event schema structure?
3. How should event availability be tracked and updated?
4. Should events be managed through EventBrella admin panel or API?
5. How should event pricing be handled (currently $10.00 for all)?
6. What happens to existing tickets when events are migrated?

---

## 📄 Related Files Reference

### Event Definition Files:
- `public/js/allevents.js` - Main events page
- `public/js/farm-tours.js` - Farm tours page
- `public/js/harvest-experiences.js` - Harvest experiences page
- `platformDrivenPages/tours/farm-tours.js` - Platform version
- `platformDrivenPages/tours/harvest-experiences.js` - Platform version

### Schema Files:
- `schemas/events-schema.js` - DynamoDB schema (not yet used)
- `schemas/tickets-schema.js` - Ticket schema

### Documentation:
- `EVENT_DESCRIPTIONS_FOR_COPY.md` - Full event descriptions
- `TICKET_PURCHASING_FLOW_A_TO_Z.md` - Payment flow documentation

### API Files:
- `api/stripe-payment.js` - Payment processing
- `api/stripe-webhook.js` - Post-payment processing
- `api/ticket-db.js` - Ticket database operations

---

**Document Created:** 2025-02-05  
**Last Updated:** 2025-02-05  
**Status:** Analysis Complete - Ready for Integration Planning
