/**
 * FL Sunbiz scraper: Layer 1 (established) and Layer 2 (new biz).
 * All requests go through /proxy/sunbiz (see server/proxy.js).
 */
import { scoreEntity } from '../lib/qualify.js';
import { enrichWithPlaces } from './enricher.js';

const PROXY_BASE = ''; // same origin when React dev server proxies to proxy server

/**
 * Map raw/enriched entity to UI lead shape.
 * @param {object} e - Entity with entityName, filingDate, status, locations, score, etc.
 * @param {'est'|'new'} layer
 * @param {string} state
 */
function toLead(e, layer, state) {
  return {
    name: e.entityName || e.name || '',
    source: state || 'FL',
    layer,
    filed: e.filingDate || '',
    county: e.county || '',
    type: e.entityType || e.type || '',
    locations: e.locations ?? 1,
    score: e.score ?? 0,
    techFit: e.techFit || '',
    status: e.status || 'ACTIVE',
    contact: e.contact || '',
  };
}

/**
 * Layer 1 — Established: multi-DBA + 3+ location signal + active 2020+.
 */
export async function runEstablishedScrape({
  state,
  volume,
  types,
  minScore,
  onLog,
}) {
  const noop = () => {};
  const log = onLog || noop;

  log('info', 'est', 'Building query: multi-DBA + 3+ location signal + active 2020+');

  const searchTerm = (types && types.length) ? types.join(' OR ') : 'restaurant OR group OR holdings';
  const params = new URLSearchParams({
    SearchTerm: searchTerm,
    SearchType: 'EntityName',
    SearchStatus: 'A',
  });

  const resp = await fetch(`${PROXY_BASE}/proxy/sunbiz?${params}`);
  if (!resp.ok) throw new Error(`Sunbiz proxy error: ${resp.status}`);
  const raw = await resp.json();

  log('info', 'est', `Received ${Array.isArray(raw) ? raw.length : 0} raw entities`);

  const list = Array.isArray(raw) ? raw : [];
  const qualified = list
    .filter((e) => (e.status || '').toUpperCase() === 'ACTIVE')
    .filter((e) => {
      const d = e.filingDate ? new Date(e.filingDate) : null;
      return d && d >= new Date('2020-01-01');
    })
    .filter((e) => e.physicalAddress && !String(e.physicalAddress).includes('PO BOX'))
    .slice(0, volume);

  log('success', 'est', `Qualified ${qualified.length} of ${list.length} (stale/dissolved discarded)`);

  const enriched = await enrichWithPlaces(qualified, log);
  const scored = enriched.map((e) => ({
    ...e,
    layer: 'est',
    score: scoreEntity(e, 'est'),
  }));
  const aboveMin = scored.filter((e) => e.score >= (minScore ?? 0));

  return aboveMin.map((e) => toLead(e, 'est', state));
}

/**
 * Layer 2 — New businesses (filed within recency window).
 */
export async function runNewBizScrape({
  state,
  volume,
  keywords,
  recency,
  minScore,
  onLog,
}) {
  const noop = () => {};
  const log = onLog || noop;

  const cutoff =
    recency === '≤ 6 months'
      ? new Date(Date.now() - 180 * 86400000)
      : recency === '≤ 12 months'
      ? new Date(Date.now() - 365 * 86400000)
      : new Date(Date.now() - 548 * 86400000); // 18 months

  log('info', 'new', `Query: date_filed > ${cutoff.toISOString().slice(0, 10)} AND (${(keywords || []).join(' | ')})`);

  const searchTerm = (keywords && keywords.length) ? keywords.join(' ') : 'restaurant';
  const params = new URLSearchParams({
    SearchTerm: searchTerm,
    SearchType: 'EntityName',
    SearchStatus: 'A',
    DateFrom: cutoff.toISOString().slice(0, 10),
  });

  const resp = await fetch(`${PROXY_BASE}/proxy/sunbiz?${params}`);
  if (!resp.ok) throw new Error(`Sunbiz proxy error: ${resp.status}`);
  const raw = await resp.json();

  const list = Array.isArray(raw) ? raw : [];
  const kw = (keywords || []).map((k) => k.toLowerCase());
  const qualified = list
    .filter((e) => {
      const d = e.filingDate ? new Date(e.filingDate) : null;
      return d && d >= cutoff;
    })
    .filter((e) => (e.status || '').toUpperCase() === 'ACTIVE')
    .filter((e) => e.physicalAddress && !String(e.physicalAddress).includes('PO BOX'))
    .filter((e) => {
      const name = (e.entityName || e.name || '').toLowerCase();
      return !kw.length || kw.some((k) => name.includes(k));
    })
    .slice(0, volume);

  log('success', 'new', `Qualified ${qualified.length} new biz · scoring for POS/PMS stack fit`);

  const scored = qualified.map((e) => ({
    ...e,
    layer: 'new',
    score: scoreEntity({ ...e, layer: 'new' }, 'new'),
  }));
  const aboveMin = scored.filter((e) => e.score >= (minScore ?? 0));

  return aboveMin.map((e) => toLead(e, 'new', state));
}
