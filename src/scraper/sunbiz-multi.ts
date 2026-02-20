/**
 * Sunbiz Multi-Location Search:
 * Search for entities with "Group", "Concepts", "Holdings", "Partners" in name,
 * or same registered agent, or 5+ DBAs.
 * Florida only. Implementation uses Sunbiz search by entity name.
 */
import type { MultiLocationCandidate } from '../agents/multiLocation/multi-location-detector';
import { config } from '../config';

const SEARCH_KEYWORDS = ['group', 'concepts', 'holdings', 'partners', 'ventures', 'enterprises', 'restaurant', 'hospitality', 'concessions'];

export interface SunbizMultiSearchOptions {
  maxResults?: number;
  keywords?: string[];
}

/**
 * Search Sunbiz for multi-location operator candidates.
 * TODO: Implement actual Sunbiz search (Playwright/puppeteer or official API if available).
 * Sunbiz search URL: https://dos.myflorida.com/sunbiz/search/
 * For now returns placeholder structure - integrate with real search.
 */
export async function searchSunbizMulti(options: SunbizMultiSearchOptions = {}): Promise<MultiLocationCandidate[]> {
  const { maxResults = 100, keywords = SEARCH_KEYWORDS } = options;
  const categories = config.multiLocation.categories;
  const enabledKeywords = new Set<string>();
  for (const c of categories) {
    if (c.enabled && c.sunbiz_keywords) {
      c.sunbiz_keywords.forEach(k => enabledKeywords.add(k.toLowerCase()));
    }
  }
  keywords.forEach(k => enabledKeywords.add(k.toLowerCase()));

  // Placeholder: In production, scrape Sunbiz search results for each keyword.
  // Example: fetch('https://dos.myflorida.com/sunbiz/search/', { ... })
  // Parse HTML for entity name, document number, registered agent, DBA count.
  const candidates: MultiLocationCandidate[] = [];

  // Stub for development - replace with real Sunbiz search
  // const html = await fetchSunbizSearchPage(Array.from(enabledKeywords));
  // candidates.push(...parseSunbizResults(html, maxResults));

  return candidates.slice(0, maxResults);
}
