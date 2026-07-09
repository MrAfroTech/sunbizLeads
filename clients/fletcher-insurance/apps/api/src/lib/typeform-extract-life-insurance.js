/**
 * Map Typeform multiple-choice / short text answers to life-insurance scoring slugs.
 * Matches question title keywords (timeline, trigger, coverage, dependent, readiness)
 * and normalizes choice labels to internal keys used by calculateLeadScore.
 */

function asText(v) {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  return String(v);
}

function answerToText(answer) {
  if (!answer || typeof answer !== 'object') return '';
  if (typeof answer.text === 'string') return answer.text;
  if (answer.choice) {
    if (typeof answer.choice.other === 'string' && answer.choice.other.trim()) return answer.choice.other;
    if (typeof answer.choice.label === 'string') return answer.choice.label;
  }
  if (Array.isArray(answer.choices?.labels)) return answer.choices.labels.join(', ');
  if (typeof answer.number === 'number' && Number.isFinite(answer.number)) return String(answer.number);
  if (typeof answer.boolean === 'boolean') return answer.boolean ? 'yes' : 'no';
  return '';
}

function norm(s) {
  return asText(s).trim().toLowerCase();
}

/** @param {string} label */
function slugTimeline(label) {
  const s = norm(label);
  if (!s) return undefined;
  if (s.includes('immediate') || s === 'now' || s.includes('right away') || s.includes('asap')) return 'immediate';
  if (s.includes('2 week') || s.includes('two week')) return '2_weeks';
  if (s.includes('30') || s.includes('thirty day') || s.includes('within a month') || s.includes('this month'))
    return '30_days';
  if (s.includes('this week') || s.includes('next week')) return '2_weeks';
  if (s.includes('research') || s.includes('just looking') || s.includes('exploring')) return 'research';
  return undefined;
}

function slugTrigger(label) {
  const s = norm(label);
  if (!s) return undefined;
  if (s.includes('life event') || s.includes('marriage') || s.includes('baby') || s.includes('birth')) return 'life_event';
  if (s.includes('policy') && (s.includes('issue') || s.includes('problem') || s.includes('lapse'))) return 'policy_issue';
  if (s.includes('finally') || s.includes('putting off')) return 'finally_doing';
  if (s.includes('explor') || s.includes('curious')) return 'exploring';
  return undefined;
}

function slugCoverage(label) {
  const s = norm(label);
  if (!s) return undefined;
  if ((s.includes('none') || s.includes('no coverage')) && (s.includes('urgent') || s.includes('asap'))) return 'none_urgent';
  if (s.includes('none') || s.includes('no coverage')) return 'none_not_urgent';
  if (s.includes('replace') || s.includes('switch')) return 'have_replace';
  if (s.includes('compare') || s.includes('shopping')) return 'have_compare';
  return undefined;
}

function slugDependents(label) {
  const s = norm(label);
  if (!s) return undefined;
  if (s.includes('family') || s.includes('kids') || s.includes('children') || s.includes('depend')) return 'family_depends';
  if (s.includes('partial') || s.includes('some')) return 'partial_depends';
  if (s.includes('no dependent') || s.includes('none') || s.includes('single')) return 'no_dependents';
  return undefined;
}

function slugReadiness(label) {
  const s = norm(label);
  if (!s) return undefined;
  if (s.includes('today') || s.includes('now') || s.includes('asap')) return 'today';
  if (s.includes('few day') || s.includes('this week')) return 'few_days';
  if (s.includes('later') || s.includes('month')) return 'later';
  if (s.includes('not ready') || s.includes('unsure')) return 'not_ready';
  return undefined;
}

/**
 * Assign field to dimension from question title.
 * @param {string} titleLower
 * @returns {'timeline'|'trigger'|'coverage'|'dependents'|'readiness'|null}
 */
function dimensionFromTitle(titleLower) {
  if (titleLower.includes('readiness') || titleLower.includes('ready to') || titleLower.includes('ready to purchase'))
    return 'readiness';
  if (titleLower.includes('dependent') || titleLower.includes('who rely') || titleLower.includes('depend on you'))
    return 'dependents';
  // Timeline before coverage — titles often say "life insurance" + "when" (must not classify as coverage only).
  if (
    titleLower.includes('timeline') ||
    titleLower.includes('when ') ||
    titleLower.includes('how soon') ||
    titleLower.includes('timeframe') ||
    titleLower.includes('urgency') ||
    titleLower.includes('how quickly')
  )
    return 'timeline';
  if (
    titleLower.includes('coverage') ||
    titleLower.includes('insured') ||
    titleLower.includes('current policy') ||
    titleLower.includes('do you have')
  )
    return 'coverage';
  if (
    titleLower.includes('trigger') ||
    titleLower.includes('what brought') ||
    titleLower.includes('why now') ||
    titleLower.includes('reason') ||
    titleLower.includes('motivation')
  )
    return 'trigger';
  return null;
}

/**
 * @param {string} dim
 * @param {string} label
 */
function labelToSlug(dim, label) {
  switch (dim) {
    case 'timeline':
      return slugTimeline(label);
    case 'trigger':
      return slugTrigger(label);
    case 'coverage':
      return slugCoverage(label);
    case 'dependents':
      return slugDependents(label);
    case 'readiness':
      return slugReadiness(label);
    default:
      return undefined;
  }
}

/**
 * @param {object} typeformPayload full webhook JSON
 * @returns {{ timeline?: string; trigger?: string; coverage?: string; dependents?: string; readiness?: string }}
 */
export function extractLifeInsuranceAnswers(typeformPayload) {
  const fields = typeformPayload?.form_response?.definition?.fields ?? [];
  const answers = typeformPayload?.form_response?.answers ?? [];
  const fieldById = new Map(fields.map((f) => [f.id, f]));

  /** @type {Record<string, string|undefined>} */
  const out = {
    timeline: undefined,
    trigger: undefined,
    coverage: undefined,
    dependents: undefined,
    readiness: undefined
  };

  for (const ans of answers) {
    const field = fieldById.get(ans.field?.id);
    const title = asText(field?.title).toLowerCase();
    const dim = dimensionFromTitle(title);
    if (!dim) continue;
    const text = answerToText(ans);
    const slug = labelToSlug(dim, text);
    if (slug) out[dim] = slug;
  }

  /**
   * Fallback: webhooks sometimes omit `definition.fields` or titles don't match our keywords.
   * Infer dimensions from answer text alone (first slug win per dimension).
   */
  const dims = ['timeline', 'trigger', 'coverage', 'dependents', 'readiness'];
  for (const ans of answers) {
    const text = answerToText(ans);
    if (!text.trim()) continue;
    for (const dim of dims) {
      if (out[dim]) continue;
      const slug = labelToSlug(dim, text);
      if (slug) out[dim] = slug;
    }
  }

  return out;
}

/**
 * @param {Record<string, string|undefined>} answers
 */
export function countLifeInsuranceFields(answers) {
  return Object.values(answers).filter((v) => v != null && v !== '').length;
}
