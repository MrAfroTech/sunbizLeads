/**
 * Headless scrape for FL Sunbiz / GA SoS / AL SoS.
 * Used by GitHub Actions and npm run scrape:*.
 * Returns raw entities (entityName, filingDate, status, physicalAddress, etc.).
 */
import * as cheerio from 'cheerio';

const FL_SUNBIZ_BASE = 'https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults';
const GA_SEARCH_BASE = 'https://ecorp.sos.ga.gov/BusinessSearch';
const AL_SEARCH_BASE = 'https://arc-sos.state.al.us/cgi/corpname.mbr/output';

const FETCH_TIMEOUT_MS = 25000;
const FETCH_RETRIES = 3;
const FETCH_RETRY_DELAY_MS = 2000;

/** Fetch with longer timeout and retries for state SoS (AL/GA often slow or flaky from CI). */
async function fetchWithRetry(url, options = {}, stateLabel = '') {
  let lastErr;
  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt++) {
    try {
      const resp = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      return resp;
    } catch (err) {
      lastErr = err;
      if (attempt === FETCH_RETRIES) break;
      console.warn(
        `[${stateLabel}] fetch attempt ${attempt} failed (${err.cause?.code || err.message}), retrying in ${FETCH_RETRY_DELAY_MS}ms...`
      );
      await new Promise((r) => setTimeout(r, FETCH_RETRY_DELAY_MS));
    }
  }
  throw lastErr;
}

function parseSunbizHTML(html) {
  const $ = cheerio.load(html);
  const results = [];
  $('table.search-results tr').each((i, row) => {
    if (i === 0) return;
    const cols = $(row).find('td');
    if (cols.length < 5) return;
    results.push({
      entityName: $(cols[0]).text().trim(),
      entityId: $(cols[1]).text().trim(),
      status: $(cols[2]).text().trim(),
      filingDate: $(cols[3]).text().trim(),
      physicalAddress: $(cols[4]).text().trim(),
    });
  });
  if (results.length === 0) {
    $('table tr').each((i, row) => {
      if (i === 0) return;
      const cols = $(row).find('td');
      if (cols.length < 5) return;
      results.push({
        entityName: $(cols[0]).text().trim(),
        entityId: $(cols[1]).text().trim(),
        status: $(cols[2]).text().trim(),
        filingDate: $(cols[3]).text().trim(),
        physicalAddress: $(cols[4]).text().trim(),
      });
    });
  }
  return results;
}

/**
 * Parse Georgia eCorp Business Search results. Adapt selectors if real HTML differs.
 */
function parseGAHTML(html) {
  const $ = cheerio.load(html);
  const results = [];
  $('table tr').each((i, row) => {
    if (i === 0) return;
    const cols = $(row).find('td');
    if (cols.length < 2) return;
    const entityName = $(cols[0]).text().trim();
    if (!entityName) return;
    results.push({
      entityName,
      entityId: cols.length > 1 ? $(cols[1]).text().trim() : '',
      status: cols.length > 2 ? $(cols[2]).text().trim() : 'Active',
      filingDate: cols.length > 3 ? $(cols[3]).text().trim() : '',
      physicalAddress: cols.length > 4 ? $(cols[4]).text().trim() : '',
    });
  });
  return results;
}

/**
 * Parse Alabama SoS corpname output. Adapt selectors if real HTML differs.
 */
function parseALHTML(html) {
  const $ = cheerio.load(html);
  const results = [];
  $('table tr').each((i, row) => {
    if (i === 0) return;
    const cols = $(row).find('td');
    if (cols.length < 2) return;
    const entityName = $(cols[0]).text().trim();
    if (!entityName) return;
    results.push({
      entityName,
      entityId: cols.length > 1 ? $(cols[1]).text().trim() : '',
      status: cols.length > 2 ? $(cols[2]).text().trim() : 'Active',
      filingDate: cols.length > 3 ? $(cols[3]).text().trim() : '',
      physicalAddress: cols.length > 4 ? $(cols[4]).text().trim() : '',
    });
  });
  return results;
}

/**
 * Layer 1 — Established: active, filed 2020+, physical address, multi-location signals.
 * @param {string} state - 'FL' | 'GA' | 'AL'
 * @returns {Promise<object[]>} Raw entities with entityName, filingDate, status, physicalAddress
 */
export async function scrapeEstablished(state) {
  const cutoff = new Date('2020-01-01');
  const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; SunbizAgent/1.0)' };

  if (state === 'GA') {
    try {
      const searchTerm = 'restaurant';
      const url = `${GA_SEARCH_BASE}?name=${encodeURIComponent(searchTerm)}`;
      const resp = await fetchWithRetry(url, { headers }, 'GA Est');
      const html = await resp.text();
      console.log(`[GA Est] raw HTML length=${html.length}`);
      const raw = parseGAHTML(html);
      console.log(`[GA Est] table rows found=${raw.length}`);
      const afterActive = raw.filter((e) => (e.status || '').toUpperCase().includes('ACTIVE'));
      console.log(`[GA Est] after ACTIVE filter=${afterActive.length}`);
      const afterDate = afterActive.filter((e) => e.filingDate && new Date(e.filingDate) >= cutoff);
      console.log(`[GA Est] after date filter=${afterDate.length}`);
      const afterAddr = afterDate.filter((e) => e.physicalAddress && !String(e.physicalAddress).includes('PO BOX'));
      console.log(`[GA Est] after address filter=${afterAddr.length}`);
      return afterAddr.map((e) => ({ ...e, name: e.entityName }));
    } catch (err) {
      console.warn(`[GA Est] SoS unreachable (${err.cause?.code || err.message}), skipping:`, err.message);
      return [];
    }
  }

  if (state === 'AL') {
    try {
      const searchTerm = 'restaurant';
      const url = `${AL_SEARCH_BASE}?corpname=${encodeURIComponent(searchTerm)}`;
      const resp = await fetchWithRetry(url, { headers }, 'AL Est');
      const html = await resp.text();
      console.log(`[AL Est] raw HTML length=${html.length}`);
      const raw = parseALHTML(html);
      console.log(`[AL Est] table rows found=${raw.length}`);
      const afterActive = raw.filter((e) => (e.status || '').toUpperCase().includes('ACTIVE'));
      console.log(`[AL Est] after ACTIVE filter=${afterActive.length}`);
      const afterDate = afterActive.filter((e) => e.filingDate && new Date(e.filingDate) >= cutoff);
      console.log(`[AL Est] after date filter=${afterDate.length}`);
      const afterAddr = afterDate.filter((e) => e.physicalAddress && !String(e.physicalAddress).includes('PO BOX'));
      console.log(`[AL Est] after address filter=${afterAddr.length}`);
      return afterAddr.map((e) => ({ ...e, name: e.entityName }));
    } catch (err) {
      console.warn(`[AL Est] SoS unreachable (${err.cause?.code || err.message}), skipping:`, err.message);
      return [];
    }
  }

  // FL
  const params = new URLSearchParams({
    SearchTerm: 'restaurant OR group OR holdings OR concepts',
    SearchType: 'EntityName',
    SearchStatus: 'A',
  });
  const url = `${FL_SUNBIZ_BASE}?${params}`;
  const resp = await fetch(url, { headers });
  const html = await resp.text();
  const raw = parseSunbizHTML(html);
  return raw
    .filter((e) => (e.status || '').toUpperCase() === 'ACTIVE')
    .filter((e) => e.filingDate && new Date(e.filingDate) >= cutoff)
    .filter((e) => e.physicalAddress && !String(e.physicalAddress).includes('PO BOX'))
    .map((e) => ({ ...e, name: e.entityName }));
}

/**
 * Layer 2 — New biz: filed within cutoff, keyword match.
 * @param {string} state - 'FL' | 'GA' | 'AL'
 * @param {string[]} keywords
 * @param {Date} cutoff - Only entities filed on or after this date
 * @returns {Promise<object[]>} Raw entities with name, entityName, filingDate, status, physicalAddress
 */
export async function scrapeNewBiz(state, keywords, cutoff) {
  const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; SunbizAgent/1.0)' };
  const kw = (keywords || []).map((k) => k.toLowerCase());
  const searchTerm = (keywords && keywords.length) ? keywords[0] : 'restaurant';

  if (state === 'GA') {
    try {
      const url = `${GA_SEARCH_BASE}?name=${encodeURIComponent(searchTerm)}`;
      const resp = await fetchWithRetry(url, { headers }, 'GA New');
      const html = await resp.text();
      console.log(`[GA New] raw HTML length=${html.length}`);
      const raw = parseGAHTML(html);
      console.log(`[GA New] table rows found=${raw.length}`);
      const afterDate = raw.filter((e) => e.filingDate && new Date(e.filingDate) >= cutoff);
      console.log(`[GA New] after date filter=${afterDate.length}`);
      const afterActive = afterDate.filter((e) => (e.status || '').toUpperCase().includes('ACTIVE'));
      console.log(`[GA New] after ACTIVE filter=${afterActive.length}`);
      const afterAddr = afterActive.filter((e) => e.physicalAddress && !String(e.physicalAddress).includes('PO BOX'));
      console.log(`[GA New] after address filter=${afterAddr.length}`);
      const afterKw = !kw.length ? afterAddr : afterAddr.filter((e) => kw.some((k) => (e.entityName || '').toLowerCase().includes(k)));
      console.log(`[GA New] after keyword filter=${afterKw.length}`);
      return afterKw.map((e) => ({ ...e, name: e.entityName }));
    } catch (err) {
      console.warn(`[GA New] SoS unreachable (${err.cause?.code || err.message}), skipping:`, err.message);
      return [];
    }
  }

  if (state === 'AL') {
    try {
      const url = `${AL_SEARCH_BASE}?corpname=${encodeURIComponent(searchTerm)}`;
      const resp = await fetchWithRetry(url, { headers }, 'AL New');
      const html = await resp.text();
      console.log(`[AL New] raw HTML length=${html.length}`);
      const raw = parseALHTML(html);
      console.log(`[AL New] table rows found=${raw.length}`);
      const afterDate = raw.filter((e) => e.filingDate && new Date(e.filingDate) >= cutoff);
      console.log(`[AL New] after date filter=${afterDate.length}`);
      const afterActive = afterDate.filter((e) => (e.status || '').toUpperCase().includes('ACTIVE'));
      console.log(`[AL New] after ACTIVE filter=${afterActive.length}`);
      const afterAddr = afterActive.filter((e) => e.physicalAddress && !String(e.physicalAddress).includes('PO BOX'));
      console.log(`[AL New] after address filter=${afterAddr.length}`);
      const afterKw = !kw.length ? afterAddr : afterAddr.filter((e) => kw.some((k) => (e.entityName || '').toLowerCase().includes(k)));
      console.log(`[AL New] after keyword filter=${afterKw.length}`);
      return afterKw.map((e) => ({ ...e, name: e.entityName }));
    } catch (err) {
      console.warn(`[AL New] SoS unreachable (${err.cause?.code || err.message}), skipping:`, err.message);
      return [];
    }
  }

  // FL
  const params = new URLSearchParams({
    SearchTerm: (keywords && keywords.length) ? keywords.join(' ') : 'restaurant',
    SearchType: 'EntityName',
    SearchStatus: 'A',
    DateFrom: cutoff.toISOString().slice(0, 10),
  });
  const url = `${FL_SUNBIZ_BASE}?${params}`;
  const resp = await fetch(url, { headers });
  const html = await resp.text();
  const raw = parseSunbizHTML(html);
  return raw
    .filter((e) => e.filingDate && new Date(e.filingDate) >= cutoff)
    .filter((e) => (e.status || '').toUpperCase() === 'ACTIVE')
    .filter((e) => e.physicalAddress && !String(e.physicalAddress).includes('PO BOX'))
    .filter((e) => {
      const name = (e.entityName || '').toLowerCase();
      return !kw.length || kw.some((k) => name.includes(k));
    })
    .map((e) => ({ ...e, name: e.entityName }));
}
