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
console.log(`[Layer1] getExistingNames(Est-Live) → ${existingNames.size} names`);
const raw = await scrapeEstablished(STATE);
console.log(`[Layer1] scrapeEstablished(${STATE}) → raw=${raw.length}`);
const deduped = dedup(raw, existingNames);
console.log(`[Layer1] after dedup → ${deduped.length}`);
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
const qualified = scored.filter((e) => e.score >= 55);

console.log(`[Layer1] existingNames=${existingNames.size} raw=${raw.length} deduped=${deduped.length} scored=${scored.length} qualified=${qualified.length} (threshold 55)`);
await appendToSheet('Est-Live', qualified);
console.log(`[Layer1] ✓ Done`);
