/**
 * Capital Connection event configuration. Edit here or set env vars (Create React App: REACT_APP_*).
 * Rebuild after changing env vars.
 */
const config = {
  date: process.env.REACT_APP_CAPITAL_DINNER_DATE || 'Thursday, March 20, 2025',
  time: process.env.REACT_APP_CAPITAL_DINNER_TIME || '7:00 PM - 10:00 PM',
  venueName: process.env.REACT_APP_CAPITAL_DINNER_VENUE_NAME || 'Ferrari of Central Florida',
  venueLocation: process.env.REACT_APP_CAPITAL_DINNER_VENUE_LOCATION || 'Orlando',
  contactEmail: process.env.REACT_APP_CAPITAL_DINNER_CONTACT_EMAIL || 'events@seamlessly.us',
  investorSeats: process.env.REACT_APP_CAPITAL_DINNER_INVESTOR_SEATS || '15',
  founderSeats: process.env.REACT_APP_CAPITAL_DINNER_FOUNDER_SEATS || '12',
};

export default config;
