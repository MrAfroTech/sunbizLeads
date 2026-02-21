import { parseArgs } from 'node:util';
import { scrapeEstablished } from './sunbizScraper.js';
import { scoreEntity } from './qualify.js';
import { dedup } from './dedup.js';
import { appendToSheet, getExistingNames } from './sheets.js';

const { values } = parseArgs({ options: { state: { type: 'string' } } });
const STATE = values?.state || 'FL';

const sourceLabel = STATE === 'FL' ? 'FL-Sunbiz' : STATE === 'GA' ? 'GA-SoS' : 'AL-SoS';

console.log(`[Layer1] Established scrape — ${STATE}`);
const existingNames = await getExistingNames('Est-Live');
const raw = await scrapeEstablished(STATE);
const deduped = dedup(raw, existingNames);
const scored = deduped.map((e) => ({
  ...e,
  name: e.entityName || e.name,
  source: sourceLabel,
  layer: 'est',
  filingDate: e.filingDate,
  county: e.county || '',
  type: e.type || '',
  locations: e.locations ?? 1,
  score: scoreEntity(e, 'est'),
  techFit: e.techFit || '',
  status: e.status || '',
  contact: e.contact || '',
}));
const qualified = scored.filter((e) => e.score >= 60);

console.log(`[Layer1] ${qualified.length} qualified → Est-Live`);
await appendToSheet('Est-Live', qualified);
console.log(`[Layer1] ✓ Done`);
