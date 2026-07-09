/**
 * @param {{ first_name?: string | null; last_name?: string | null }} lead
 * @returns {string}
 */
export function formatLeadName(lead) {
  const a = (lead?.first_name ?? '').trim();
  const b = (lead?.last_name ?? '').trim();
  const joined = [a, b].filter(Boolean).join(' ').trim();
  return joined || '';
}
