// api/events.js - Events API endpoint (client-agnostic template)
const fs = require('fs');
const path = require('path');

const DEFAULT_ORGANIZER = process.env.ORGANIZER_NAME || "It'll Happen Boyz Summer Showcase";
const DEFAULT_VENUE = process.env.CLIENT_VENUE_NAME || 'TBA';
const DEFAULT_LOCATION = process.env.CLIENT_ADDRESS_LINE1 && process.env.CLIENT_ADDRESS_LINE2
  ? `${process.env.CLIENT_ADDRESS_LINE1}, ${process.env.CLIENT_ADDRESS_LINE2}`
  : 'Location To Be Announced, Central Florida, FL TBD';

/**
 * Load events from config/ticketing-tiers.json (single main event with tiers)
 */
function loadEventsFromTiers() {
  try {
    const tiersPath = path.join(__dirname, '../config/ticketing-tiers.json');
    if (!fs.existsSync(tiersPath)) return [];
    const tiers = JSON.parse(fs.readFileSync(tiersPath, 'utf8'));
    const defaultEventName = process.env.CLIENT_DEFAULT_EVENT_NAME || 'Summer Showcase 2026';
    const eventDate = '2026-01-26';
    const displayDate = 'Sunday, January 26 – Tuesday, January 28, 2026';
    const time = '8:00 AM - 6:00 PM';
    return tiers.map(t => ({
      event_id: t.id,
      id: `${t.id}-${eventDate}`,
      name: defaultEventName,
      title: `${defaultEventName} - ${t.name}`,
      event_type: 'showcase',
      event_date: eventDate,
      date: eventDate,
      displayDate,
      event_time: '08:00:00',
      time,
      venue: DEFAULT_VENUE,
      venue_name: DEFAULT_VENUE,
      location: DEFAULT_LOCATION,
      organizer: DEFAULT_ORGANIZER,
      organizer_name: DEFAULT_ORGANIZER,
      price: Math.round(parseFloat(t.price || 0) * 100),
      price_display: `$${parseFloat(t.price || 0).toFixed(0)}`,
      tier: t.id,
      status: 'active',
      description: t.description || '',
      category: 'sports',
      duration_minutes: 600,
      available_slots: parseInt(t.capacity || '0', 10) || 999,
      booked_slots: 0
    }));
  } catch (err) {
    console.error('Error loading events from ticketing-tiers:', err);
    return [];
  }
}

/**
 * Load and parse events from summer-showcase.js file (legacy) or ticketing-tiers
 */
function loadEvents() {
  try {
    const alleventsPath = path.join(__dirname, '../public/js/summer-showcase.js');
    const alleventsContent = fs.existsSync(alleventsPath) ? fs.readFileSync(alleventsPath, 'utf8') : '';

    // Extract MONTHLY_HARVEST_EVENTS array
    const monthlyMatch = alleventsContent.match(/const MONTHLY_HARVEST_EVENTS = (\[[\s\S]*?\]);/);
    const monthlyEvents = monthlyMatch ? eval(monthlyMatch[1]) : [];

    // Extract SPECIAL_EVENTS array
    const specialMatch = alleventsContent.match(/const SPECIAL_EVENTS = (\[[\s\S]*?\]);/);
    const specialEvents = specialMatch ? eval(specialMatch[1]) : [];

    // If no legacy events, use ticketing-tiers (single main event with tiers)
    if (monthlyEvents.length === 0 && specialEvents.length === 0) {
      return loadEventsFromTiers();
    }

    // Transform monthly events to full format
    const formattedMonthlyEvents = monthlyEvents.map(event => ({
      event_id: event.id,
      id: event.id,
      name: 'Farm Tour',
      title: 'Monthly Farm Tour',
      event_type: 'monthly-farm-tour',
      event_date: event.date,
      date: event.date,
      displayDate: event.displayDate,
      event_time: '09:00:00',
      time: '9:00 AM - 11:00 AM EST',
      venue: DEFAULT_VENUE,
      venue_name: DEFAULT_VENUE,
      location: DEFAULT_LOCATION,
      organizer: DEFAULT_ORGANIZER,
      organizer_name: DEFAULT_ORGANIZER,
      price: 1000, // Price in cents
      price_display: '$10.00',
      tier: 'basic',
      status: 'active',
      description: `Event description (replace per client; organizer: ${DEFAULT_ORGANIZER}).`,
      category: 'family-friendly',
      duration_minutes: 120,
      available_slots: 30,
      booked_slots: 0
    }));

    // Add category and format special events
    const formattedSpecialEvents = specialEvents.map(event => ({
      event_id: event.id,
      id: event.id,
      name: event.name,
      title: event.name,
      event_type: 'special-harvest',
      event_date: event.date,
      date: event.date,
      displayDate: event.displayDate,
      event_time: '08:00:00',
      time: event.time || '8:00 AM - 10:00 AM EST',
      venue: event.venue || DEFAULT_VENUE,
      venue_name: event.venue || DEFAULT_VENUE,
      location: DEFAULT_LOCATION,
      organizer: event.organizer || DEFAULT_ORGANIZER,
      organizer_name: event.organizer || DEFAULT_ORGANIZER,
      price: Math.round((event.price || 10.00) * 100), // Convert to cents
      price_display: `$${(event.price || 10.00).toFixed(2)}`,
      tier: event.tier || 'basic',
      status: 'active',
      description: event.description || '',
      category: 'family-friendly',
      duration_minutes: 120,
      available_slots: 30,
      booked_slots: 0
    }));

    // Combine all events
    return [...formattedMonthlyEvents, ...formattedSpecialEvents];
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
}

/**
 * Filter events based on query parameters
 */
function filterEvents(events, query) {
  let filtered = [...events];

  // Filter by event type
  if (query.type) {
    const typeMap = {
      'monthly-farm-tour': 'monthly-farm-tour',
      'special-harvest': 'special-harvest',
      'monthly': 'monthly-farm-tour',
      'special': 'special-harvest'
    };
    const eventType = typeMap[query.type] || query.type;
    filtered = filtered.filter(e => e.event_type === eventType);
  }

  // Filter by status
  if (query.status) {
    filtered = filtered.filter(e => e.status === query.status);
  }

  // Filter by start_date (events on or after this date)
  if (query.start_date) {
    filtered = filtered.filter(e => e.event_date >= query.start_date);
  }

  // Filter by end_date (events on or before this date)
  if (query.end_date) {
    filtered = filtered.filter(e => e.event_date <= query.end_date);
  }

  return filtered;
}

/** Placeholder/invalid date strings that must not be sent to the frontend */
const INVALID_DATE_STRINGS = new Set([
  'TBD', 'tbd', 'Date TBD', 'DATE TBD', 'Coming Soon', 'COMING SOON',
  'N/A', 'n/a', 'None', 'none', 'TBA', 'tba', ''
]);

/**
 * Validate and normalize a date value for API response.
 * Returns ISO string or null; logs a warning for invalid values.
 */
function cleanDate(dateValue, eventTitle = '') {
  const title = eventTitle || 'Unknown event';
  if (dateValue == null) return null;
  const s = typeof dateValue === 'string' ? dateValue.trim() : String(dateValue).trim();
  if (!s || INVALID_DATE_STRINGS.has(s)) {
    if (s) console.warn(`Invalid date (placeholder): "${s}" for event: ${title}`);
    return null;
  }
  try {
    const date = new Date(s);
    if (Number.isNaN(date.getTime())) {
      console.warn(`Invalid date (unparseable): "${s}" for event: ${title}`);
      return null;
    }
    return date.toISOString();
  } catch (err) {
    console.warn(`Error parsing date: "${s}" for event: ${title}`, err.message);
    return null;
  }
}

/**
 * Validate date-only (YYYY-MM-DD) for event_date field. Returns string or null.
 */
function validDateOnly(dateValue, eventTitle = '') {
  if (dateValue == null) return null;
  const s = typeof dateValue === 'string' ? dateValue.trim() : String(dateValue).trim();
  if (!s || INVALID_DATE_STRINGS.has(s)) return null;
  try {
    const date = new Date(s);
    if (Number.isNaN(date.getTime())) return null;
    const y = date.getUTCFullYear(), m = date.getUTCMonth(), d = date.getUTCDate();
    if (date.getTime() !== Date.UTC(y, m, d)) return null; // reject invalid calendar date
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  } catch {
    return null;
  }
}

/**
 * CORS: allow EventBrella deployments, localhost, and no-origin (Postman, etc.)
 * Must run first (before any other logic).
 */
function setCorsHeaders(req, res) {
  const origin = req.headers.origin || req.headers.Origin;
  const isAllowedOrigin =
    !origin ||
    // Any domain containing eventbrella (*.eventbrella.us, etc.)
    /eventbrella/i.test(origin) ||
    // Localhost for development
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1');

  if (!origin) {
    // No origin (Postman, mobile apps): allow with *
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (isAllowedOrigin) {
    // Reflect allowed origin (required when using credentials)
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // Other origins: allow so EventBrella/customer deployments work
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

/**
 * Vercel serverless function handler
 */
module.exports = async (req, res) => {
  // CORS first (before any other logic)
  setCorsHeaders(req, res);

  // Handle preflight request before any other logic
  if (req.method === 'OPTIONS' || req.method?.toUpperCase() === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET' && req.method?.toUpperCase() !== 'GET') {
    res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
    return;
  }

  try {
    // Load events
    const allEvents = loadEvents();

    // Apply filters from query parameters
    const filteredEvents = filterEvents(allEvents, req.query);

    // Sort events by date (ascending); events with invalid dates go last
    filteredEvents.sort((a, b) => {
      const da = new Date(a.event_date);
      const db = new Date(b.event_date);
      if (Number.isNaN(da.getTime())) return 1;
      if (Number.isNaN(db.getTime())) return -1;
      return da - db;
    });

    // Validate and transform dates: only send ISO or null (never TBD, empty, or malformed)
    const eventsWithISODates = filteredEvents.map(event => {
      const title = event.title || event.name || event.id;
      const dateOnlyRaw = event.event_date || event.date;
      const dateOnly = validDateOnly(dateOnlyRaw, title);
      const timePart = event.event_time || '00:00:00';

      let isoDate = null;
      let endDate = null;
      if (dateOnly) {
        try {
          const start = new Date(dateOnly + 'T' + timePart + 'Z');
          if (!Number.isNaN(start.getTime())) {
            isoDate = start.toISOString();
            if (event.duration_minutes) {
              endDate = new Date(start.getTime() + event.duration_minutes * 60 * 1000).toISOString();
            }
          }
        } catch (err) {
          console.warn(`Invalid date construction for event: ${title}`, err.message);
        }
      } else if (dateOnlyRaw) {
        console.warn(`Invalid date found: "${dateOnlyRaw}" for event: ${title}`);
      }

      return {
        ...event,
        date: isoDate,
        event_date: dateOnly,
        startDate: isoDate,
        endDate: endDate,
        // Alias for consumers that expect eventDate
        eventDate: isoDate
      };
    });

    // Return response
    res.status(200).json({
      events: eventsWithISODates,
      total: eventsWithISODates.length,
      lastUpdated: new Date().toISOString(),
      filters: {
        type: req.query.type || null,
        status: req.query.status || null,
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null
      }
    });
  } catch (error) {
    console.error('Error in /api/events:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to load events'
    });
  }
};
