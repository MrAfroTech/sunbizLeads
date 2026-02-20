/**
 * Decision Maker Finder:
 * - Search LinkedIn for VP Operations, Director F&B, COO, Regional Manager, GM
 * - Get email via Hunter.io
 * - Get phone via ZoomInfo (optional)
 * - Email required, phone optional
 */
import type { DecisionMakerFinderResult } from '../../types';
import { config } from '../../config';

const DECISION_MAKER_TITLES = [
  'VP Operations', 'VP of Operations', 'Vice President Operations',
  'Director F&B', 'Director of F&B', 'Director of Food',
  'COO', 'Chief Operating Officer',
  'Regional Manager', 'Regional Director',
  'GM', 'General Manager',
];

export async function findDecisionMakers(
  companyName: string,
  domain?: string,
  titles: string[] = DECISION_MAKER_TITLES
): Promise<DecisionMakerFinderResult[]> {
  const results: DecisionMakerFinderResult[] = [];

  // Hunter.io domain search (if we have domain)
  if (domain && config.hunter?.apiKey) {
    const emails = await hunterDomainSearch(domain, companyName);
    for (const e of emails) {
      results.push({
        name: e.full_name,
        title: e.position || 'Executive',
        email: e.email,
        phone: e.phone || null,
        linkedin_url: e.linkedin || null,
        confidence: e.confidence >= 90 ? 'high' : e.confidence >= 70 ? 'medium' : 'low',
      });
    }
  }

  // LinkedIn search would go here (API or scraping - rate limited)
  // For now we rely on Hunter.io domain search

  return results.filter(r => r.email);
}

interface HunterEmail {
  value: string;
  type: string;
  confidence: number;
  first_name: string;
  last_name: string;
  position: string;
  linkedin: string;
  phone?: string;
}

async function hunterDomainSearch(domain: string, companyName: string): Promise<Array<{ email: string; full_name: string; position: string; linkedin: string; phone?: string; confidence: number }>> {
  const key = config.hunter?.apiKey;
  if (!key) return [];

  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${key}&limit=10`;
    const res = await fetch(url);
    const data = await res.json() as { data?: { emails?: HunterEmail[] } };
    const emails = data.data?.emails ?? [];

    return emails
      .filter((e: HunterEmail) => DECISION_MAKER_TITLES.some(t => (e.position || '').toLowerCase().includes(t.toLowerCase())))
      .map((e: HunterEmail) => ({
        email: e.value,
        full_name: `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Unknown',
        position: e.position || '',
        linkedin: e.linkedin || '',
        phone: e.phone,
        confidence: e.confidence ?? 0,
      }));
  } catch (err) {
    console.warn('Hunter.io domain search failed:', err);
    return [];
  }
}

export function extractDomainFromUrl(url: string): string | null {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
