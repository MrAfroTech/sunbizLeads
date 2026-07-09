/**
 * Human-readable labels for life-insurance scoring slugs (for agent emails).
 */

const timeline = {
  immediate: 'Immediate',
  '2_weeks': 'Within 2 weeks',
  '30_days': 'Within 30 days',
  research: 'Research / exploring'
};

const trigger = {
  life_event: 'Life event (marriage, birth, etc.)',
  policy_issue: 'Policy issue / lapse',
  finally_doing: 'Finally taking action',
  exploring: 'Just exploring'
};

const coverage = {
  none_urgent: 'No coverage — urgent',
  none_not_urgent: 'No coverage — not urgent',
  have_replace: 'Has coverage — looking to replace',
  have_compare: 'Has coverage — comparing options'
};

const dependents = {
  family_depends: 'Family depends on income',
  partial_depends: 'Partial dependents',
  no_dependents: 'No dependents'
};

const readiness = {
  today: 'Ready today',
  few_days: 'Within a few days',
  later: 'Later',
  not_ready: 'Not ready yet'
};

const KEYS = { timeline, trigger, coverage, dependents, readiness };

/**
 * @param {Record<string, string|undefined>} answers
 */
export function formatAnswersForEmail(answers) {
  const a = answers || {};
  return {
    timeline: labelFor('timeline', a.timeline),
    trigger: labelFor('trigger', a.trigger),
    coverage: labelFor('coverage', a.coverage),
    dependents: labelFor('dependents', a.dependents),
    readiness: labelFor('readiness', a.readiness)
  };
}

function labelFor(dim, slug) {
  if (slug == null || slug === '') return '—';
  const map = KEYS[dim];
  return (map && map[slug]) || String(slug).replace(/_/g, ' ');
}
