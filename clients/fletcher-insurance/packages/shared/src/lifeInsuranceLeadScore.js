/**
 * Life Insurance Lead Scoring Calculator
 * Input: answers object from form (string keys)
 * Output: score (1–100) + lead category (Hot / Warm / Lukewarm / Cold)
 */

/** @typedef {{ timeline?: string; trigger?: string; coverage?: string; dependents?: string; readiness?: string }} LifeInsuranceAnswers */

export const LifeInsuranceLeadCategory = Object.freeze({
  HOT: 'Hot',
  WARM: 'Warm',
  LUKWARM: 'Lukewarm',
  COLD: 'Cold'
});

/**
 * @param {LifeInsuranceAnswers} answers
 * @returns {{ score: number; category: string }}
 */
export function calculateLeadScore(answers) {
  const a = answers || {};
  let score = 0;

  const timelinePoints = {
    immediate: 25,
    '2_weeks': 20,
    '30_days': 15,
    research: 5
  };
  score += timelinePoints[a.timeline] ?? 0;

  const triggerPoints = {
    life_event: 25,
    policy_issue: 20,
    finally_doing: 15,
    exploring: 5
  };
  score += triggerPoints[a.trigger] ?? 0;

  const coveragePoints = {
    none_urgent: 20,
    none_not_urgent: 10,
    have_replace: 15,
    have_compare: 5
  };
  score += coveragePoints[a.coverage] ?? 0;

  const dependentsPoints = {
    family_depends: 15,
    partial_depends: 10,
    no_dependents: 5
  };
  score += dependentsPoints[a.dependents] ?? 0;

  const readinessPoints = {
    today: 15,
    few_days: 10,
    later: 5,
    not_ready: 1
  };
  score += readinessPoints[a.readiness] ?? 0;

  let category = LifeInsuranceLeadCategory.COLD;
  if (score >= 80) category = LifeInsuranceLeadCategory.HOT;
  else if (score >= 60) category = LifeInsuranceLeadCategory.WARM;
  else if (score >= 40) category = LifeInsuranceLeadCategory.LUKWARM;

  return { score, category };
}
