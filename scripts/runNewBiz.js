import { parseArgs } from 'node:util';
import { scrapeNewBiz } from './sunbizScraper.js';
import { scoreEntity } from './qualify.js';
import { dedup } from './dedup.js';
import { appendToSheet, getExistingNames } from './sheets.js';

const { values } = parseArgs({ options: { state: { type: 'string' } } });
const STATE = values?.state || 'FL';
const KEYWORDS = ['tavern', 'lodge', 'eatery', 'lounge', 'bistro', 'inn', 'bar', 'grill'];
const CUTOFF = new Date(Date.now() - 548 * 86400000);

const sourceLabel = STATE === 'FL' ? 'FL-Sunbiz' : STATE === 'GA' ? 'GA-SoS' : 'AL-SoS';

console.log(`[Layer2] New biz scrape — ${STATE}`);
const existingNames = await getExistingNames('New-Live');
const raw = await scrapeNewBiz(STATE, KEYWORDS, CUTOFF);
const deduped = dedup(raw, existingNames);
const scored = deduped.map((e) => ({
  ...e,
  name: e.entityName || e.name,
  source: sourceLabel,
  layer: 'new',
  filingDate: e.filingDate,
  county: e.county || '',
  type: e.type || '',
  locations: e.locations ?? 1,
  score: scoreEntity(e, 'new'),
  techFit: e.techFit || '',
  status: e.status || '',
  contact: e.contact || '',
}));
const qualified = scored.filter((e) => e.score >= 52);

console.log(`[Layer2] ${qualified.length} qualified → New-Live`);
await appendToSheet('New-Live', qualified);
console.log(`[Layer2] ✓ Done`);
