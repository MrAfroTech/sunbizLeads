/**
 * Extract contact fields from a Typeform form_response payload for upserting into public.leads.
 */

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
  return '';
}

/**
 * @param {object} typeformPayload full webhook JSON
 * @returns {{
 *   first_name: string;
 *   last_name: string;
 *   email: string | null;
 *   phone: string | null;
 *   region: string | null;
 *   product_interest: string | null;
 *   source: string | null;
 * }}
 */
const EMAIL_LIKE = /\S+@\S+\.\S+/;

export function extractContactFromTypeform(typeformPayload) {
  const hidden = typeformPayload?.form_response?.hidden ?? {};
  const fields = typeformPayload?.form_response?.definition?.fields ?? [];
  const answers = typeformPayload?.form_response?.answers ?? [];
  const fieldById = new Map(fields.map((f) => [f.id, f]));

  let email =
    asText(hidden.email || hidden.Email || hidden.EMAIL) || '';
  let phone = asText(hidden.phone || hidden.sms || hidden.SMS || hidden.phone_number) || '';
  let firstName = asText(hidden.first_name || hidden.firstName || hidden.first) || '';
  let lastName = asText(hidden.last_name || hidden.lastName || hidden.last) || '';
  let region = asText(hidden.region || hidden.Region) || '';
  let productInterest = asText(hidden.product_interest || hidden.product || hidden.productInterest) || '';
  let source = asText(hidden.source || hidden.Source) || '';

  // Typed answers + heuristics work even when definition.fields is missing (empty titles).
  for (const ans of answers) {
    if (ans?.type === 'email' && typeof ans.email === 'string' && ans.email.trim()) {
      email = ans.email.trim();
    }
    if (ans?.type === 'phone_number' && typeof ans.phone_number === 'string' && ans.phone_number.trim()) {
      phone = ans.phone_number.trim();
    }
    if (ans?.type === 'short_text' || ans?.type === 'long_text') {
      const t = answerToText(ans).trim();
      if (t && EMAIL_LIKE.test(t) && !email) email = t;
    }
  }

  for (const ans of answers) {
    const field = fieldById.get(ans.field?.id);
    const title = asText(field?.title).toLowerCase();

    if (ans.type === 'email' && ans.email) {
      email = ans.email;
    }
    if (ans.type === 'phone_number' && ans.phone_number) {
      phone = ans.phone_number;
    }

    if (ans.type === 'short_text' || ans.type === 'long_text') {
      const text = answerToText(ans).trim();
      if (!text) continue;
      if (title.includes('first') && title.includes('name')) {
        firstName = text;
      } else if (title.includes('last') && title.includes('name')) {
        lastName = text;
      } else if (title.includes('email') && !email) {
        email = text;
      } else if ((title.includes('phone') || title.includes('mobile') || title.includes('sms')) && !phone) {
        phone = text;
      } else if (title.includes('region') && !region) {
        region = text;
      } else if (
        (title.includes('product') || title.includes('interest')) &&
        !productInterest
      ) {
        productInterest = text;
      } else if (title.includes('source') && !source) {
        source = text;
      } else if (
        (title === 'name' || (title.includes('name') && !title.includes('first') && !title.includes('last'))) &&
        !firstName &&
        !lastName
      ) {
        const parts = text.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        } else {
          firstName = text;
        }
      }
    }
  }

  const fn = firstName.trim();
  const ln = lastName.trim();
  const first_name = fn || 'Unknown';
  const last_name = ln || 'Lead';

  return {
    first_name,
    last_name,
    email: email.trim() ? email.trim() : null,
    phone: phone.trim() ? phone.trim() : null,
    region: region.trim() ? region.trim() : null,
    product_interest: productInterest.trim() ? productInterest.trim() : null,
    source: source.trim() ? source.trim() : null
  };
}

/**
 * Non-destructive merge: prefer non-empty extracted values for existing leads.
 * @param {object} existing
 * @param {ReturnType<typeof extractContactFromTypeform>} extracted
 */
export function mergeContactIntoLead(existing, extracted) {
  const next = { ...existing };
  if (extracted.first_name && extracted.first_name !== 'Unknown') next.first_name = extracted.first_name;
  if (extracted.last_name && extracted.last_name !== 'Lead') next.last_name = extracted.last_name;
  if (extracted.email) next.email = extracted.email;
  if (extracted.phone) next.phone = extracted.phone;
  if (extracted.region) next.region = extracted.region;
  if (extracted.product_interest) next.product_interest = extracted.product_interest;
  if (extracted.source) next.source = extracted.source;
  return next;
}
