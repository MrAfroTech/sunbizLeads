/**
 * @param {string} weekKey
 * @param {object} formState - full form state including computed conversion rates
 * @param {string} [formState.s1Conv]
 * @param {string} [formState.s2Conv]
 * @param {string} [formState.s3Conv]
 * @param {string} [formState.s4Conv]
 * @param {string} [formState.s5Conv]
 */
export function exportToCSV(weekKey, formState) {
  const headers = [
    'Week Key',
    'Date (LinkedIn)',
    'Connection requests sent',
    'Accepted',
    'Responses',
    'Contact info',
    'Demos booked',
    'Sales closed',
    'Conversion (LinkedIn)',
    'Rating (LinkedIn)',
    'Journal (LinkedIn)',
    'Calls made',
    'Positive responses',
    'Demos (calls)',
    'Sales (calls)',
    'Conversion (calls)',
    'Rating (calls)',
    'Journal (calls)',
    'Walk-ins attempted',
    'Meaningful conversations',
    'Contact info (walk)',
    'Demos (walk)',
    'Sales (walk)',
    'Conversion (walk)',
    'Rating (walk)',
    'Journal (walk)',
    'Week of',
    'Events attended',
    'Contacts made',
    'Follow-ups',
    'Demos (net)',
    'Sales (net)',
    'Conversion (net)',
    'Rating (net)',
    'Journal (net)',
    'Emails sent',
    'Positive replies',
    'Demos (email)',
    'Sales (email)',
    'Conversion (email)',
    'Rating (email)',
    'Journal (email)',
  ];

  const escape = (v) => (v != null ? String(v).replace(/"/g, '""') : '');
  const row = [
    weekKey,
    formState.s1Date ?? '',
    formState.s1Requests ?? '',
    formState.s1Accepted ?? '',
    formState.s1Responses ?? '',
    formState.s1Contact ?? '',
    formState.s1Demos ?? '',
    formState.s1Sales ?? '',
    formState.s1Conv ?? '0%',
    formState.s1Rating ?? '',
    escape(formState.s1Journal),
    formState.s2Calls ?? '',
    formState.s2Positive ?? '',
    formState.s2Demos ?? '',
    formState.s2Sales ?? '',
    formState.s2Conv ?? '0%',
    formState.s2Rating ?? '',
    escape(formState.s2Journal),
    formState.s3Walkins ?? '',
    formState.s3Convos ?? '',
    formState.s3Contact ?? '',
    formState.s3Demos ?? '',
    formState.s3Sales ?? '',
    formState.s3Conv ?? '0%',
    formState.s3Rating ?? '',
    escape(formState.s3Journal),
    formState.s4Weekof ?? '',
    formState.s4Events ?? '',
    formState.s4Contacts ?? '',
    formState.s4Followups ?? '',
    formState.s4Demos ?? '',
    formState.s4Sales ?? '',
    formState.s4Conv ?? '0%',
    formState.s4Rating ?? '',
    escape(formState.s4Journal),
    formState.s5Emails ?? '',
    formState.s5Replies ?? '',
    formState.s5Demos ?? '',
    formState.s5Sales ?? '',
    formState.s5Conv ?? '0%',
    formState.s5Rating ?? '',
    escape(formState.s5Journal),
  ];

  const csv =
    headers.map((h) => `"${(h ?? '').replace(/"/g, '""')}"`).join(',') +
    '\n' +
    row.map((c) => `"${escape(c)}"`).join(',');

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `salesMasteryTracker_${weekKey || 'unknown'}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
