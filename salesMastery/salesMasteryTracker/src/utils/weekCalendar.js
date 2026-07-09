const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const RANGE_START = new Date(2026, 1, 27);
const RANGE_END = new Date(2028, 1, 27);

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function getMonday(d) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day));
  return x;
}

/**
 * @param {number} year
 * @param {number} month 1-12
 * @returns {{ weekNum: number; mon: Date; sun: Date }[]}
 */
export function getWeeksInMonth(year, month) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const mondays = [];
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    const mon = getMonday(new Date(d));
    if (!mondays.some((m) => m.getTime() === mon.getTime())) mondays.push(mon);
  }
  mondays.sort((a, b) => a - b);
  return mondays.map((mon, i) => {
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { weekNum: i + 1, mon: new Date(mon), sun };
  });
}

/**
 * @param {number} year
 * @param {number} month 1-12
 * @returns {string[]} week keys YYYY-MM-W#
 */
export function getWeekKeysForMonth(year, month) {
  const weeks = getWeeksInMonth(year, month);
  return weeks.map((_, i) => buildWeekKey(year, month, i));
}

/**
 * @param {number} year
 * @returns {string[]} week keys for all weeks in the year
 */
export function getWeekKeysForYear(year) {
  return getMonthsForYear(year).flatMap((m) => getWeekKeysForMonth(year, m));
}

/**
 * @param {Date} d
 * @returns {string} MM/DD
 */
export function displayDate(d) {
  return pad(d.getMonth() + 1) + '/' + pad(d.getDate());
}

export function getDefaultYear() {
  return RANGE_START.getFullYear();
}

export function getDefaultMonth() {
  return RANGE_START.getMonth() + 1;
}

/**
 * @param {number} year
 * @returns {number[]} 1-12
 */
export function getMonthsForYear(year) {
  let mStart = 1;
  let mEnd = 12;
  if (year === RANGE_START.getFullYear()) mStart = RANGE_START.getMonth() + 1;
  if (year === RANGE_END.getFullYear()) mEnd = RANGE_END.getMonth() + 1;
  const out = [];
  for (let m = mStart; m <= mEnd; m++) out.push(m);
  return out;
}

export function getYears() {
  return [2026, 2027, 2028];
}

export function getMonthName(m) {
  return MONTHS[m - 1];
}

/**
 * Find week index (0-based) in given year/month that contains 2/27/2026.
 */
export function getDefaultWeekIndex(weeks) {
  const target = new Date(2026, 1, 27);
  const targetMon = getMonday(new Date(target));
  const idx = weeks.findIndex((w) => w.mon.getTime() === targetMon.getTime());
  return idx >= 0 ? idx : 0;
}

/**
 * @param {number} year
 * @param {number} month
 * @param {number} weekIndex 0-based
 * @returns {string} YYYY-MM-W#
 */
export function buildWeekKey(year, month, weekIndex) {
  return year + '-' + pad(month) + '-W' + (weekIndex + 1);
}
