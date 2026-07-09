import { formatAnswersForEmail } from './life-insurance-labels.js';
import { formatLeadName } from './format-lead-name.js';

/**
 * Life Insurance Lead Notification (Hot / Warm) — HTML for Brevo.
 * @param {{ first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null }} lead
 * @param {number} leadScore
 * @param {string} leadCategory
 * @param {Record<string, string|undefined>} answersRaw — slugs from extractLifeInsuranceAnswers
 */
export function buildHotWarmAgentEmailHtml(lead, leadScore, leadCategory, answersRaw) {
  const a = formatAnswersForEmail(answersRaw);
  const name = formatLeadName(lead) || '—';

  return `
<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.55;color:#0b1220;max-width:560px">
  <p>Hi Team,</p>
  <p>A new life insurance lead has submitted a request. Here are the details:</p>
  <ul style="padding-left:1.2rem;margin:12px 0">
    <li><strong>Score:</strong> ${escapeHtml(String(leadScore))}</li>
    <li><strong>Category:</strong> ${escapeHtml(leadCategory)}</li>
    <li><strong>Name:</strong> ${escapeHtml(name)}</li>
    <li><strong>Email:</strong> ${escapeHtml(lead.email || '—')}</li>
    <li><strong>Phone:</strong> ${escapeHtml(lead.phone || '—')}</li>
    <li><strong>Timeline:</strong> ${escapeHtml(a.timeline)}</li>
    <li><strong>Reason for interest:</strong> ${escapeHtml(a.trigger)}</li>
    <li><strong>Current coverage:</strong> ${escapeHtml(a.coverage)}</li>
    <li><strong>Dependents:</strong> ${escapeHtml(a.dependents)}</li>
    <li><strong>Ready to talk:</strong> ${escapeHtml(a.readiness)}</li>
  </ul>
  <p>Please reach out as soon as possible — leads respond fastest when contacted immediately.</p>
  <p>Thanks,<br/>Your Life Insurance Team</p>
</div>`.trim();
}

export function buildHotWarmAgentSubject(leadCategory, leadScore) {
  const cat = leadCategory || '';
  const score = leadScore != null ? String(leadScore) : '—';
  return `🔥 New Life Insurance Lead: ${cat} - Score ${score}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
