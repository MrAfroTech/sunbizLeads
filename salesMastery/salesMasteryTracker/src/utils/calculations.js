/**
 * @param {number} salesClosed
 * @param {number} requestsSent
 * @returns {number} percentage or 0 if denominator is 0
 */
export function linkedInConversionRate(salesClosed, requestsSent) {
  if (!requestsSent || Number.isNaN(Number(requestsSent))) return 0;
  const s = Number(salesClosed) || 0;
  const r = Number(requestsSent);
  return r === 0 ? 0 : (100 * s) / r;
}

/**
 * @param {number} salesClosed
 * @param {number} callsMade
 * @returns {number} percentage or 0 if denominator is 0
 */
export function coldCallConversionRate(salesClosed, callsMade) {
  if (!callsMade || Number.isNaN(Number(callsMade))) return 0;
  const s = Number(salesClosed) || 0;
  const c = Number(callsMade);
  return c === 0 ? 0 : (100 * s) / c;
}

/**
 * @param {number} salesClosed
 * @param {number} walkInsAttempted
 * @returns {number} percentage or 0 if denominator is 0
 */
export function walkInConversionRate(salesClosed, walkInsAttempted) {
  if (!walkInsAttempted || Number.isNaN(Number(walkInsAttempted))) return 0;
  const s = Number(salesClosed) || 0;
  const w = Number(walkInsAttempted);
  return w === 0 ? 0 : (100 * s) / w;
}

/**
 * @param {number} salesClosed
 * @param {number} contactsMade
 * @returns {number} percentage or 0 if denominator is 0
 */
export function networkingConversionRate(salesClosed, contactsMade) {
  if (!contactsMade || Number.isNaN(Number(contactsMade))) return 0;
  const s = Number(salesClosed) || 0;
  const c = Number(contactsMade);
  return c === 0 ? 0 : (100 * s) / c;
}

/**
 * @param {number} salesClosed
 * @param {number} emailsSent
 * @returns {number} percentage or 0 if denominator is 0
 */
export function emailProspectingConversionRate(salesClosed, emailsSent) {
  if (!emailsSent || Number.isNaN(Number(emailsSent))) return 0;
  const s = Number(salesClosed) || 0;
  const e = Number(emailsSent);
  return e === 0 ? 0 : (100 * s) / e;
}
