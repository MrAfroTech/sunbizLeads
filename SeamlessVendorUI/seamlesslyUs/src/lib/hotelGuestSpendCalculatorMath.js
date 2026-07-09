/** Share of hotel guests who use on-site dining. */
export const DINING_CAPTURE_RATE = 0.28;

/** Average on-site dining spend per guest who dines. */
export const AVG_DINING_SPEND = 42;

/** Share of hotel guests who order room service. */
export const ROOM_SERVICE_CAPTURE_RATE = 0.11;

/** Average room service order value. */
export const AVG_ROOM_SERVICE_ORDER = 38;

/** Share of hotel guests who engage with paid amenities. */
export const AMENITY_CAPTURE_RATE = 0.19;

/** Average paid amenity spend per engaging guest. */
export const AVG_AMENITY_SPEND = 24;

/** Days modeled for monthly projection. */
export const NIGHTS_PER_MONTH = 30;

/** Recoverable share of missed ancillary revenue with HeyYou. */
export const HEYYOU_RECOVERY_RATE = 0.45;

export const HOTEL_ROLE_OPTIONS = [
  'Boutique Hotel Owner',
  'Hotel General Manager',
  'Food & Beverage Director',
  'Resort / Guest Experience Manager',
];

const FULL_ANCILLARY_PER_GUEST = AVG_DINING_SPEND + AVG_ROOM_SERVICE_ORDER + AVG_AMENITY_SPEND;

/**
 * Hotel on-property guest spend model for /calculator/hotels.
 * @returns {{
 *   nightlyRate: number,
 *   guestsPerNight: number,
 *   role: string,
 *   baseRoomRevenue: number,
 *   diningCapture: number,
 *   roomServiceCapture: number,
 *   amenityCapture: number,
 *   totalCapturedAncillary: number,
 *   missedAncillaryRevenue: number,
 *   monthlyMissedRevenue: number,
 *   heyyouRecovery: number,
 * }}
 */
export function computeHotelGuestSpendMetrics({ role, nightlyRate, guestsPerNight }) {
  const rate = parseFloat(nightlyRate) || 0;
  const guests = parseFloat(guestsPerNight) || 0;

  const baseRoomRevenue = rate * guests;
  const diningCapture = guests * DINING_CAPTURE_RATE * AVG_DINING_SPEND;
  const roomServiceCapture = guests * ROOM_SERVICE_CAPTURE_RATE * AVG_ROOM_SERVICE_ORDER;
  const amenityCapture = guests * AMENITY_CAPTURE_RATE * AVG_AMENITY_SPEND;
  const totalCapturedAncillary = diningCapture + roomServiceCapture + amenityCapture;

  const fullAncillaryPotential = guests * FULL_ANCILLARY_PER_GUEST;
  const missedAncillaryRevenue = fullAncillaryPotential - totalCapturedAncillary;
  const monthlyMissedRevenue = missedAncillaryRevenue * NIGHTS_PER_MONTH;
  const heyyouRecovery = monthlyMissedRevenue * HEYYOU_RECOVERY_RATE;

  return {
    nightlyRate: rate,
    guestsPerNight: guests,
    role,
    baseRoomRevenue,
    diningCapture,
    roomServiceCapture,
    amenityCapture,
    totalCapturedAncillary,
    missedAncillaryRevenue,
    monthlyMissedRevenue,
    heyyouRecovery,
    totalRevenueImpact:
      baseRoomRevenue +
      totalCapturedAncillary +
      missedAncillaryRevenue +
      monthlyMissedRevenue +
      heyyouRecovery,
  };
}

export const HOTEL_VISIBLE_CARD_ID = 'base-room';

/** Result cards for CalculatorLeakResults (wait-calculator reveal flow). */
export function computeHotelResultCards(metrics) {
  if (!metrics) return [];

  return [
    {
      id: HOTEL_VISIBLE_CARD_ID,
      indexLabel: 'Room revenue',
      title: 'Base room revenue',
      descriptor: 'Average nightly rate × guests on property',
      amount: metrics.baseRoomRevenue,
      initiallyRevealed: true,
      spanFull: true,
    },
    {
      id: 'dining',
      indexLabel: 'On-site dining',
      title: 'Dining capture',
      descriptor: '28% of guests × $42 average spend',
      amount: metrics.diningCapture,
    },
    {
      id: 'room-service',
      indexLabel: 'In-room orders',
      title: 'Room service capture',
      descriptor: '11% of guests × $38 average order',
      amount: metrics.roomServiceCapture,
    },
    {
      id: 'amenity',
      indexLabel: 'Paid amenities',
      title: 'Pool / amenity upsell',
      descriptor: '19% of guests × $24 average spend',
      amount: metrics.amenityCapture,
    },
    {
      id: 'captured',
      indexLabel: 'Current capture',
      title: 'Total captured ancillary revenue',
      descriptor: 'Dining, room service, and amenity combined',
      amount: metrics.totalCapturedAncillary,
    },
    {
      id: 'missed',
      indexLabel: 'Ancillary gap',
      title: 'Missed ancillary revenue',
      descriptor: 'Full on-property spend potential minus current capture',
      amount: metrics.missedAncillaryRevenue,
    },
    {
      id: 'monthly',
      indexLabel: 'Monthly impact',
      title: 'Monthly missed revenue',
      descriptor: 'Missed ancillary revenue × 30 nights',
      amount: metrics.monthlyMissedRevenue,
    },
    {
      id: 'recovery',
      indexLabel: 'HeyYou upside',
      title: 'Recoverable with targeted offers',
      descriptor: 'Up to 45% of monthly missed ancillary revenue',
      amount: metrics.heyyouRecovery,
      spanFull: true,
    },
  ];
}
