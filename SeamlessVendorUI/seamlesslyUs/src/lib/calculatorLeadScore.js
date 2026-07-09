export const PERSONA_OPTIONS = [
  'Owner',
  'General Manager',
  'Operations Director',
  'Event Organizer',
  'Other',
];

export const ORDERING_OPTIONS = [
  'Server only',
  'QR ordering',
  'Mobile ordering',
  'Counter service',
  'Mixed',
];

/** Six options each — used by /calculator/wait hero layout (even grid symmetry). */
export const WAIT_HERO_PERSONA_OPTIONS = [
  'Owner',
  'General Manager',
  'Operations Director',
  'Event Organizer',
  'Regional Manager',
  'Other',
];

export const WAIT_HERO_ORDERING_OPTIONS = [
  'Server only',
  'QR ordering',
  'Mobile ordering',
  'Counter service',
  'Mixed',
  'Kiosk / self-order',
];

export const HERO_VENUE_TYPE_OPTIONS = [
  'Restaurant',
  'Bar',
  'Hotel',
  'Golf Club',
  'Event Venue',
  'Other',
];

export const HERO_PERSONA_OPTIONS = WAIT_HERO_PERSONA_OPTIONS;
export const HERO_ORDERING_OPTIONS = WAIT_HERO_ORDERING_OPTIONS;

export const SPORTS_VENUE_OPTIONS = [
  'Professional stadium or arena',
  'College or university venue',
  'Minor league stadium',
  'Multi-purpose arena',
  'Other',
];

export const HERO_SPORTS_VENUE_OPTIONS = [
  'Professional stadium or arena',
  'College or university venue',
  'Minor league stadium',
  'Multi-purpose arena',
  'Festival / outdoor venue',
  'Other',
];

const PERSONA_SCORES = {
  Owner: 25,
  'General Manager': 20,
  'Operations Director': 20,
  'Event Organizer': 15,
  'Regional Manager': 18,
  Other: 5,
};

const VENUE_TYPE_SCORES = {
  Restaurant: 22,
  Bar: 20,
  Hotel: 24,
  'Golf Club': 16,
  'Event Venue': 18,
};

const ORDERING_SCORES = {
  'Server only': 25,
  'Counter service': 20,
  Mixed: 15,
  'QR ordering': 5,
  'Mobile ordering': 5,
  'Kiosk / self-order': 12,
};

const SPORTS_VENUE_SCORES = {
  'Professional stadium or arena': 25,
  'College or university venue': 20,
  'Minor league stadium': 15,
  'Multi-purpose arena': 20,
  'Festival / outdoor venue': 12,
  Other: 5,
};

export const ENGAGEMENT_SCORES = {
  calculator_started: 5,
  calculator_completed: 10,
  lead_submitted: 20,
  consultation_cta_clicked: 20,
  consultation_booked: 50,
};

export function scorePersona(persona) {
  return PERSONA_SCORES[persona] ?? VENUE_TYPE_SCORES[persona] ?? 0;
}

export function scoreOrderingMethod(orderingMethod) {
  return ORDERING_SCORES[orderingMethod] ?? 0;
}

export function scoreSportsVenue(venueType) {
  return SPORTS_VENUE_SCORES[venueType] ?? 0;
}

/**
 * Lead score for /calculator/sports qualification fields plus engagement milestones.
 */
export function computeSportsLeadScore({ venueType, orderingMethod, milestones = [] }) {
  const milestoneSet = milestones instanceof Set ? milestones : new Set(milestones);
  let total = 0;

  if (venueType) total += scoreSportsVenue(venueType);
  if (orderingMethod) total += scoreOrderingMethod(orderingMethod);

  milestoneSet.forEach((eventType) => {
    total += ENGAGEMENT_SCORES[eventType] ?? 0;
  });

  return total;
}

/**
 * Cumulative lead score from qualification fields plus engagement milestones reached.
 * @param {{ persona?: string, orderingMethod?: string, milestones?: Set<string>|string[] }} params
 */
export function computeLeadScore({ persona, orderingMethod, milestones = [] }) {
  const milestoneSet = milestones instanceof Set ? milestones : new Set(milestones);
  let total = 0;

  if (persona) total += scorePersona(persona);
  if (orderingMethod) total += scoreOrderingMethod(orderingMethod);

  milestoneSet.forEach((eventType) => {
    total += ENGAGEMENT_SCORES[eventType] ?? 0;
  });

  return total;
}
