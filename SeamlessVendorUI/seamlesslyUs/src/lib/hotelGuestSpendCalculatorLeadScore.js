import { ENGAGEMENT_SCORES } from './calculatorLeadScore';
import { HOTEL_ROLE_OPTIONS } from './hotelGuestSpendCalculatorMath';

export { HOTEL_ROLE_OPTIONS };

const HOTEL_ROLE_SCORES = {
  'Resort / Guest Experience Manager': 25,
  'Hotel General Manager': 22,
  'Food & Beverage Director': 20,
  'Boutique Hotel Owner': 18,
};

export function scoreHotelRole(role) {
  return HOTEL_ROLE_SCORES[role] ?? 0;
}

export function computeHotelGuestSpendLeadScore({ role, milestones = [] }) {
  const milestoneSet = milestones instanceof Set ? milestones : new Set(milestones);
  let total = 0;

  if (role) total += scoreHotelRole(role);

  milestoneSet.forEach((eventType) => {
    total += ENGAGEMENT_SCORES[eventType] ?? 0;
  });

  return total;
}
