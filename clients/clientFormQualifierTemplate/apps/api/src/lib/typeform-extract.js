function asText(v) {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  return String(v);
}

function answerToText(answer) {
  if (!answer || typeof answer !== 'object') return '';
  if (typeof answer.text === 'string') return answer.text;
  if (typeof answer.email === 'string') return answer.email;
  if (typeof answer.phone_number === 'string') return answer.phone_number;
  if (typeof answer.number === 'number') return String(answer.number);
  if (typeof answer.boolean === 'boolean') return answer.boolean ? 'yes' : 'no';
  if (answer.choice && typeof answer.choice.label === 'string') return answer.choice.label;
  if (Array.isArray(answer.choices?.labels)) return answer.choices.labels.join(', ');
  return '';
}

/**
 * Extract answers by looking at:
 * - question title containing "budget"
 * - question title containing "timeline" or "purchase"
 *
 * This keeps the system resilient to changing Typeform field IDs.
 */
export function extractBudgetAndTimeline(typeformPayload) {
  const fields = typeformPayload?.form_response?.definition?.fields ?? [];
  const answers = typeformPayload?.form_response?.answers ?? [];

  const fieldById = new Map(fields.map((f) => [f.id, f]));

  let budgetRaw = '';
  let purchaseTimelineRaw = '';

  for (const ans of answers) {
    const field = fieldById.get(ans.field?.id);
    const title = asText(field?.title).toLowerCase();
    const text = answerToText(ans);

    if (!budgetRaw && title.includes('budget')) budgetRaw = text;
    if (
      !purchaseTimelineRaw &&
      (title.includes('timeline') || (title.includes('purchase') && title.includes('time')))
    ) {
      purchaseTimelineRaw = text;
    }
  }

  return { budgetRaw, purchaseTimelineRaw };
}

