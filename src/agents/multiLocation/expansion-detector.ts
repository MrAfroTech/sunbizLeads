/**
 * Expansion Signal Detector (Bonus):
 * - Crunchbase: recent funding
 * - Sunbiz: new DBAs in last 90 days
 * - Job postings: surge in openings
 * - Google News: expansion mentions
 */
import type { ExpansionSignal, ExpansionDetectorResult } from '../../types';

export interface ExpansionInputs {
  crunchbaseFunding?: { date: string; amount?: string }[];
  newDbasLast90Days?: number;
  jobOpeningsCount?: number;
  jobOpeningsBaseline?: number;
  newsMentions?: string[];
}

export function detectExpansion(inputs: ExpansionInputs): ExpansionDetectorResult {
  const signals: ExpansionSignal[] = [];
  let score = 0;

  if (inputs.crunchbaseFunding && inputs.crunchbaseFunding.length > 0) {
    const recent = inputs.crunchbaseFunding.filter(f => {
      const d = new Date(f.date);
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 12);
      return d >= cutoff;
    });
    if (recent.length > 0) {
      signals.push({
        source: 'crunchbase',
        description: `Recent funding: ${recent.length} round(s)`,
        date: recent[0].date,
      });
      score += 3;
    }
  }

  if ((inputs.newDbasLast90Days ?? 0) >= 2) {
    signals.push({
      source: 'sunbiz',
      description: `${inputs.newDbasLast90Days} new DBAs in last 90 days`,
    });
    score += 2;
  }

  const baseline = inputs.jobOpeningsBaseline ?? 0;
  const openings = inputs.jobOpeningsCount ?? 0;
  if (openings >= baseline * 1.5 && openings >= 5) {
    signals.push({
      source: 'job_postings',
      description: `Job openings surge: ${openings} (baseline ~${baseline})`,
    });
    score += 2;
  }

  if (inputs.newsMentions && inputs.newsMentions.length > 0) {
    const expansionKeywords = ['expansion', 'opening', 'growth', 'new location', 'acquired'];
    const matches = inputs.newsMentions.filter(m =>
      expansionKeywords.some(k => m.toLowerCase().includes(k))
    );
    if (matches.length > 0) {
      signals.push({
        source: 'google_news',
        description: `Expansion mentioned in ${matches.length} article(s)`,
      });
      score += 2;
    }
  }

  const expansionScore = Math.min(10, Math.max(0, score));
  return { expansion_signals: signals, expansion_score: expansionScore };
}
