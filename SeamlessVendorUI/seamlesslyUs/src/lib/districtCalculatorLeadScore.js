import { ENGAGEMENT_SCORES } from './calculatorLeadScore';
import {
  DISTRICT_TYPE_OPTIONS,
  EVENT_FREQUENCY_OPTIONS,
  HERO_DISTRICT_TYPE_OPTIONS,
} from './districtCalculatorMath';

export { DISTRICT_TYPE_OPTIONS, EVENT_FREQUENCY_OPTIONS, HERO_DISTRICT_TYPE_OPTIONS };

const DISTRICT_TYPE_SCORES = {
  'Sports & Event District': 25,
  'Entertainment District': 22,
  'Market District': 20,
  'Historic Downtown': 18,
  'Arts & Culture District': 15,
  'Mixed-use urban district': 17,
};

const EVENT_FREQUENCY_SCORES = {
  '2–3x per week': 25,
  'Weekly programming': 20,
  '1–2 events per month': 15,
  'Daily foot traffic corridor (no anchor events)': 12,
};

export function scoreDistrictType(districtType) {
  return DISTRICT_TYPE_SCORES[districtType] ?? 0;
}

export function scoreEventFrequency(eventFrequency) {
  return EVENT_FREQUENCY_SCORES[eventFrequency] ?? 0;
}

export function computeDistrictLeadScore({ districtType, eventFrequency, milestones = [] }) {
  const milestoneSet = milestones instanceof Set ? milestones : new Set(milestones);
  let total = 0;

  if (districtType) total += scoreDistrictType(districtType);
  if (eventFrequency) total += scoreEventFrequency(eventFrequency);

  milestoneSet.forEach((eventType) => {
    total += ENGAGEMENT_SCORES[eventType] ?? 0;
  });

  return total;
}
