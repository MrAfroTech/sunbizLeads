/**
 * Multi-Location Pipeline (5 stages):
 * 1. Multi-Location Discovery: Sunbiz → Google Places count → LinkedIn verify → DB
 * 2. Qualification: min locations, enabled categories, dedupe
 * 3. Decision Maker Enrichment: LinkedIn → Hunter.io → ZoomInfo (optional) → DB
 * 4. Bonus Enrichments: POS detection, Expansion signals, priority scoring
 * 5. Brevo Sync: unsynced → dedupe → create contacts → mark synced
 */
import { getSupabase } from './db/supabase';
import { searchSunbizMulti } from './scraper/sunbiz-multi';
import {
  hasSunbizMultiIndicators,
  detectMultiLocation,
  classifyByKeywords,
  findDecisionMakers,
  extractDomainFromUrl,
  detectPOS,
  detectExpansion,
} from './agents/multiLocation';
import { countLocationsForBrand } from './integrations/google-places';
import { createContact } from './brevo';
import { config } from './config';
import type { MultiLocationOperator, DecisionMaker } from './types';
import pLimit from 'p-limit';

const limit = pLimit(3);
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function runPipeline(): Promise<void> {
  const start = Date.now();
  const errors: string[] = [];
  const supabase = getSupabase();
  const runDate = new Date().toISOString().slice(0, 10);
  let operatorsFound = 0;
  let decisionMakersFound = 0;
  const categoriesBreakdown: Record<string, number> = {};
  let avgLocations = 0;
  let expansionSignalsDetected = 0;
  let costEstimate = 0;

  // Stage 1: Multi-Location Discovery
  const candidates = await searchSunbizMulti({ maxResults: 50 }).catch(e => {
    errors.push(`Sunbiz search failed: ${e}`);
    return [];
  });

  const qualifiedOperators: MultiLocationOperator[] = [];
  for (const c of candidates) {
    if (!hasSunbizMultiIndicators(c)) continue;

    const googleCount = await limit(async () => {
      await delay(config.run.delayBetweenRequestsMs);
      return countLocationsForBrand(c.company_name);
    });

    const result = detectMultiLocation(c, googleCount);
    if (!result || result.location_count < config.multiLocation.minLocations) continue;

    const catConfig = config.multiLocation.categories.find(x => x.name === result.category);
    if (!catConfig?.enabled || result.location_count < catConfig.min_locations) continue;

    const op: MultiLocationOperator = {
      company_name: result.company_name,
      document_number: c.document_number,
      category: result.category,
      estimated_location_count: result.location_count,
      location_count_source: result.sources.join(','),
      sunbiz_indicators: {
        entity_keywords: c.entity_keywords,
        dba_count: c.dba_count,
      },
      website: undefined,
      hq_city: undefined,
      hq_state: 'FL',
      is_qualified: true,
    };
    qualifiedOperators.push(op);
  }

  operatorsFound = qualifiedOperators.length;
  for (const o of qualifiedOperators) {
    categoriesBreakdown[o.category] = (categoriesBreakdown[o.category] ?? 0) + 1;
  }
  avgLocations = qualifiedOperators.length > 0
    ? qualifiedOperators.reduce((s, o) => s + o.estimated_location_count, 0) / qualifiedOperators.length
    : 0;

  // Upsert operators (by document_number when available)
  for (const op of qualifiedOperators) {
    const row = {
      company_name: op.company_name,
      document_number: op.document_number || null,
      category: op.category,
      estimated_location_count: op.estimated_location_count,
      location_count_source: op.location_count_source || null,
      sunbiz_indicators: op.sunbiz_indicators || {},
      parent_company: op.parent_company || null,
      website: op.website || null,
      hq_city: op.hq_city || null,
      hq_state: op.hq_state || null,
      is_qualified: true,
      updated_at: new Date().toISOString(),
    };
    const { error } = op.document_number
      ? await supabase.from('multi_location_operators').upsert(row, { onConflict: 'document_number' })
      : await supabase.from('multi_location_operators').insert(row);
    if (error) errors.push(`Upsert operator ${op.company_name}: ${error.message}`);
  }

  // Stage 2 is implicit in Stage 1 (we only save qualified)

  // Stage 3: Decision Maker Enrichment
  const { data: operators } = await supabase
    .from('multi_location_operators')
    .select('id, company_name, website, category')
    .eq('is_qualified', true);

  const opList = (operators || []) as Array<{ id: string; company_name: string; website: string | null; category: string }>;
  for (const op of opList) {
    const domain = op.website ? extractDomainFromUrl(op.website) : null;
    if (!domain) continue;

    const dms = await limit(async () => {
      await delay(config.run.delayBetweenRequestsMs);
      return findDecisionMakers(op.company_name, domain);
    });

    for (const dm of dms) {
      if (!dm.email) continue;
      const { error } = await supabase.from('decision_makers').upsert(
        {
          company_id: op.id,
          full_name: dm.name,
          title: dm.title || null,
          email: dm.email,
          phone: dm.phone || null,
          linkedin_url: dm.linkedin_url || null,
          data_sources: ['hunter'],
          email_confidence: dm.confidence,
          is_verified: false,
          synced_to_brevo: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id,email' }
      );
      if (!error) decisionMakersFound++;
      if (error) errors.push(`Upsert DM ${dm.name}: ${error.message}`);
    }
  }

  // Stage 4: Bonus Enrichments (POS, Expansion) - high priority categories only
  const highPriority = config.multiLocation.categories.filter(c => c.enabled && c.priority <= 5);
  for (const op of opList) {
    const catConfig = config.multiLocation.categories.find(c => c.name === op.category);
    if (!catConfig || !highPriority.some(h => h.name === catConfig.name)) continue;

    const posResult = await detectPOS(op.company_name);
    const expansionResult = detectExpansion({ newDbasLast90Days: 0 });
    if (expansionResult.expansion_signals.length > 0) expansionSignalsDetected++;

    await supabase
      .from('multi_location_operators')
      .update({
        pos_system: posResult.pos_system || null,
        pos_confidence: posResult.confidence,
        expansion_signals: expansionResult.expansion_signals,
        expansion_score: expansionResult.expansion_score,
        updated_at: new Date().toISOString(),
      })
      .eq('id', op.id);
  }

  // Stage 5: Brevo Sync
  const { data: toSync } = await supabase
    .from('ready_for_outreach')
    .select('*')
    .limit(100);

  let synced = 0;
  let duplicates = 0;
  for (const row of toSync || []) {
    const result = await createContact({
      email: row.email,
      phone: row.phone || undefined,
      company: row.company_name,
      firstName: row.full_name?.split(' ')[0],
      lastName: row.full_name?.split(' ').slice(1).join(' '),
      attributes: {
        COMPANY_NAME: row.company_name,
        CATEGORY: row.category,
        ESTIMATED_LOCATIONS: String(row.estimated_location_count ?? ''),
        POS_SYSTEM: row.pos_system || '',
        EXPANSION_SCORE: String(row.expansion_score ?? ''),
        LINKEDIN_URL: row.linkedin_url || '',
        HQ_CITY: row.hq_city || '',
        HQ_STATE: row.hq_state || '',
      },
    });
    if (result.duplicate) duplicates++;
    else if (result.success) {
      synced++;
      await supabase
        .from('decision_makers')
        .update({
          synced_to_brevo: true,
          brevo_contact_id: result.brevoContactId ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
    } else {
      errors.push(`Brevo ${row.email}: ${result.error}`);
    }
  }

  const durationSeconds = Math.round((Date.now() - start) / 1000);
  costEstimate = 5; // placeholder - track API costs

  await supabase.from('run_history').insert({
    run_date: runDate,
    multi_location_operators_found: operatorsFound,
    decision_makers_found: decisionMakersFound,
    categories_breakdown: categoriesBreakdown,
    avg_locations_per_operator: avgLocations,
    expansion_signals_detected: expansionSignalsDetected,
    errors,
    cost_estimate_usd: costEstimate,
    duration_seconds: durationSeconds,
  });

  const report = {
    operatorsFound,
    decisionMakersFound,
    categoriesBreakdown,
    avgLocations,
    expansionSignalsDetected,
    synced,
    duplicates,
    errors,
    costEstimate,
    durationSeconds,
  };
  console.log(JSON.stringify(report, null, 2));
  await sendReport(report).catch(e => console.warn('Report send failed:', e));
}

async function sendReport(report: {
  operatorsFound: number;
  decisionMakersFound: number;
  categoriesBreakdown: Record<string, number>;
  avgLocations: number;
  expansionSignalsDetected: number;
  synced: number;
  duplicates: number;
  errors: string[];
  costEstimate: number;
  durationSeconds: number;
}): Promise<void> {
  const to = config.notification.email;
  if (!to || !config.notification.smtp?.host) return;
  const nodemailer = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host: config.notification.smtp.host,
    port: config.notification.smtp.port,
    secure: false,
    auth: config.notification.smtp.user ? { user: config.notification.smtp.user, pass: config.notification.smtp.pass } : undefined,
  });
  await transport.sendMail({
    from: config.notification.smtp.user || to,
    to,
    subject: `FL Multi-Location Scraper - ${new Date().toISOString().slice(0, 10)} Summary`,
    text: [
      `Multi-location operators found: ${report.operatorsFound}`,
      `Decision makers found: ${report.decisionMakersFound}`,
      `Category breakdown: ${JSON.stringify(report.categoriesBreakdown)}`,
      `Avg locations/operator: ${report.avgLocations.toFixed(1)}`,
      `Expansion signals: ${report.expansionSignalsDetected}`,
      `Synced to Brevo: ${report.synced}`,
      `Duplicates skipped: ${report.duplicates}`,
      `Errors: ${report.errors.length}`,
      report.errors.slice(0, 5).join('\n'),
      `Cost: $${report.costEstimate.toFixed(2)}`,
      `Duration: ${report.durationSeconds}s`,
    ].join('\n'),
  });
}
