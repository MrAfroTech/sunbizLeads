/** @type {Record<string, string[]>} */
export const CALCULATOR_QUESTION_STATS = {
  sports: [
    'Repeat guests matter because the same attendee often becomes the buyer for multiple visits, pre-event drinks, concessions, and post-event spending.',
    'Familiar guests come back with lower acquisition cost and higher comfort with ordering and spending.',
    'Friction reduction — faster ordering, shorter lines, and smoother checkout — helps convert one visit into the next one.',
    'Loyalty mechanics are most powerful when tied to experience quality rather than discounts alone.',
  ],
  hotels: [
    'Existing hotel customers are far more likely to complete a booking than new prospects — 60% to 70% booking completion versus 5% to 20% for new acquisition.',
    'Repeat hotel guests tend to spend more, trust the brand more, and book with less friction than first-time guests.',
    'Returning hotel guests respond to personalized service, room preferences, and smoother repeat-stay experiences.',
    'Repeat hotel guests reduce demand volatility, creating a more predictable base of bookings and ancillary spend.',
  ],
  restaurants: [
    'Guests who visited a restaurant multiple times accounted for just 7% of the guest base but drove up to 50% of total order volume.',
    'About one-third of surveyed diners said they spend more simply because they feel more comfortable ordering as regulars.',
    'Restaurant loyalty members visit 20% more often and spend 20% more per visit than non-members.',
    'Roughly 70% of first-time restaurant diners never come back, showing how fragile first visits are.',
  ],
  events: [
    'Repeat customers are not just cheaper to serve; they are often the main profit pool.',
    'Regulars were 80% more likely to try a new menu item because they trusted the kitchen.',
    'Diners said human recognition was the No. 1 factor that made them feel valued, chosen by about half of respondents.',
    'Less than one-third of diners always feel recognized at the places they visit most, leaving a major loyalty gap.',
  ],
  districts: [
    'Regular guests are easier to serve, easier to predict, and more likely to respond to known-preference service patterns than first-timers.',
    'Recognition and comfort are major repeat drivers in hospitality generally.',
    'Convenience tools like digital ordering, faster checkout, and loyalty-linked offers reduce friction and make it easier for guests to return.',
    'A small lift in repeat frequency can matter more than broad top-of-funnel acquisition when a venue depends on limited seat capacity and high-margin beverage sales.',
  ],
  'magic-bands': [
    '61% of small business owners said more than half of annual revenue came from repeat customers.',
    '65% to 80% of restaurant revenue can come from regulars.',
    'Quick-service restaurants generate roughly 71% of sales from repeat customers.',
    '95% of consumers say speed is critical and 90% say it is a priority.',
  ],
  staffburnout: [
    'Returning customers spend 67% more than new customers.',
    'Acquiring a new customer costs 5x to 25x more than retaining an existing one.',
    'Increasing customer retention by 5% can boost profits by 25% to 95%.',
    'Restaurants that got guests onto loyalty programs saw return rate rise from a baseline 7% to nearly 30%.',
  ],
};

/** @type {Record<string, keyof typeof CALCULATOR_QUESTION_STATS>} */
export const FORK_CONFIG_NICHE = {
  'restaurants-2': 'restaurants',
  'restaurants-3': 'restaurants',
  'hotels-2': 'hotels',
  'hotels-3': 'hotels',
  'districts-2': 'districts',
  'districts-3': 'districts',
  'events-2': 'events',
  'events-3': 'events',
  'festivals-2': 'events',
  'festivals-3': 'events',
};

const STAFF_STEP_STAT_INDEX = {
  turnover: 0,
  tenure: 1,
  fullName: 2,
  email: 3,
  phone: 3,
};

const RESTAURANT_FIELD_STAT_INDEX = {
  persona: 0,
  ordering: 1,
  peak: 2,
  spend: 3,
};

/**
 * @param {string} niche
 * @param {number} stepIndex
 * @returns {string | null}
 */
export function getCalculatorQuestionStat(niche, stepIndex) {
  const stats = CALCULATOR_QUESTION_STATS[niche];
  if (!stats || stepIndex < 0 || stepIndex >= stats.length) return null;
  return stats[stepIndex];
}

/**
 * @param {string} stepField
 * @returns {string | null}
 */
export function getStaffTurnoverQuestionStat(stepField) {
  const index = STAFF_STEP_STAT_INDEX[stepField];
  if (index === undefined) return null;
  return getCalculatorQuestionStat('staffburnout', index);
}

/**
 * @param {string} stepField
 * @param {boolean} [presentationMode]
 * @returns {string | null}
 */
export function getRestaurantQuestionStat(stepField, presentationMode = false) {
  const index = RESTAURANT_FIELD_STAT_INDEX[stepField];
  if (index === undefined) return null;
  return getCalculatorQuestionStat('restaurants', index);
}

/**
 * @param {string} configId
 * @param {number} stepIndex
 * @returns {string | null}
 */
export function getForkCalculatorQuestionStat(configId, stepIndex) {
  const niche = FORK_CONFIG_NICHE[configId];
  if (!niche) return null;
  return getCalculatorQuestionStat(niche, stepIndex);
}
