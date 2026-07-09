/** Display name from first + last (matches public.leads columns). */
export function formatLeadName(lead) {
  const a = (lead?.first_name ?? '').trim();
  const b = (lead?.last_name ?? '').trim();
  const s = [a, b].filter(Boolean).join(' ').trim();
  return s || '—';
}
