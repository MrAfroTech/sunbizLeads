/**
 * Capital Dinner event configuration.
 * Edit these values or set env vars to update event details without code changes.
 *
 * Environment variables (optional override):
 *   REACT_APP_CAPITAL_DINNER_DATE
 *   REACT_APP_CAPITAL_DINNER_TIME
 *   REACT_APP_CAPITAL_DINNER_VENUE_NAME
 *   REACT_APP_CAPITAL_DINNER_VENUE_LOCATION  (e.g. "Orlando")
 *   REACT_APP_CAPITAL_DINNER_CONTACT_EMAIL
 *   REACT_APP_CAPITAL_DINNER_INVESTOR_SEATS
 *   REACT_APP_CAPITAL_DINNER_FOUNDER_SEATS
 */

const config = {
  // Event date - e.g. "March 20, 2025"
  date: process.env.REACT_APP_CAPITAL_DINNER_DATE || 'Thursday, March 20, 2025',

  // Event time - e.g. "7:00 PM - 10:00 PM"
  time: process.env.REACT_APP_CAPITAL_DINNER_TIME || '7:00 PM - 10:00 PM',

  // Venue display name
  venueName: process.env.REACT_APP_CAPITAL_DINNER_VENUE_NAME || 'Ferrari of Central Florida',

  // City/area (appended after venue name)
  venueLocation: process.env.REACT_APP_CAPITAL_DINNER_VENUE_LOCATION || 'Orlando',

  // Contact email for "Questions? Email ..."
  contactEmail: process.env.REACT_APP_CAPITAL_DINNER_CONTACT_EMAIL || 'events@seamlessly.us',

  // Display only - number of seats for each audience
  investorSeats: process.env.REACT_APP_CAPITAL_DINNER_INVESTOR_SEATS || '15',
  founderSeats: process.env.REACT_APP_CAPITAL_DINNER_FOUNDER_SEATS || '12',
};

export default config;
