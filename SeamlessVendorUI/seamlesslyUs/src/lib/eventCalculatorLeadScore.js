import { ENGAGEMENT_SCORES } from './calculatorLeadScore';
import {
  HANDOFF_QUALITY_OPTIONS,
  PLANNER_TYPE_OPTIONS,
} from './eventCalculatorMath';

export { PLANNER_TYPE_OPTIONS, HANDOFF_QUALITY_OPTIONS };
export { PLANNER_TYPE_OPTIONS as EVENT_ROLE_OPTIONS };

const PLANNER_TYPE_SCORES = {
  'Corporate Event Manager': 25,
  'Event Planning Company (2–10 staff)': 22,
  'Wedding Planner': 20,
  'Independent Event Planner': 18,
};

const HANDOFF_QUALITY_SCORES = {
  'No formal system': 25,
  'Verbal brief to venue staff day-of': 22,
  'Spreadsheet or notes shared with venue': 15,
  'We use a guest management platform': 8,
};

export function scorePlannerType(plannerType) {
  return PLANNER_TYPE_SCORES[plannerType] ?? 0;
}

export function scoreHandoffQuality(handoffQuality) {
  return HANDOFF_QUALITY_SCORES[handoffQuality] ?? 0;
}

/** @deprecated */
export function scoreEventRole(role) {
  return scorePlannerType(role);
}

export function computeEventLeadScore({
  plannerType,
  handoffQuality,
  role,
  milestones = [],
}) {
  const milestoneSet = milestones instanceof Set ? milestones : new Set(milestones);
  let total = 0;

  const resolvedPlanner = plannerType || role;
  if (resolvedPlanner) total += scorePlannerType(resolvedPlanner);
  if (handoffQuality) total += scoreHandoffQuality(handoffQuality);

  milestoneSet.forEach((eventType) => {
    total += ENGAGEMENT_SCORES[eventType] ?? 0;
  });

  return total;
}
