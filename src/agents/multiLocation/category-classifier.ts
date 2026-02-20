/**
 * Category Classifier: keyword match on business name → assign category.
 * Validates via Google Places business types when available.
 */
import type { OperatorCategory } from '../../types';
import { config } from '../../config';

const categories = config.multiLocation.categories;

export function classifyByKeywords(companyName: string): { category: OperatorCategory; confidence: 'high' | 'medium' | 'low' } {
  const name = companyName.toLowerCase();
  const matches: { category: OperatorCategory; score: number }[] = [];

  for (const c of categories) {
    if (!c.enabled) continue;
    let score = 0;
    for (const kw of c.sunbiz_keywords) {
      if (name.includes(kw.toLowerCase())) {
        score += kw.length;
      }
    }
    if (score > 0) {
      matches.push({ category: c.name as OperatorCategory, score });
    }
  }

  if (matches.length === 0) {
    return { category: 'restaurant_chain', confidence: 'low' };
  }

  matches.sort((a, b) => b.score - a.score);
  const best = matches[0];
  const confidence = best.score >= 15 ? 'high' : best.score >= 8 ? 'medium' : 'low';
  return { category: best.category, confidence };
}

export function validateCategoryWithPlaces(
  category: OperatorCategory,
  placesTypes: string[]
): 'high' | 'medium' | 'low' {
  const typeStr = placesTypes.join(' ').toLowerCase();
  const categoryKeywords: Record<OperatorCategory, string[]> = {
    stadium_arena: ['stadium', 'arena', 'sports', 'venue'],
    casino: ['casino', 'gambling', 'resort'],
    theme_park: ['amusement', 'theme', 'attraction', 'park'],
    university_dining: ['university', 'college', 'campus', 'school'],
    airport_concessions: ['airport', 'terminal', 'aviation'],
    restaurant_chain: ['restaurant', 'food', 'dining', 'cafe', 'bar'],
    golf_management: ['golf', 'country club', 'club'],
    marina_group: ['marina', 'yacht', 'boating'],
    hotel_fb: ['hotel', 'resort', 'lodging', 'inn'],
    entertainment_venue: ['theater', 'theatre', 'entertainment', 'venue'],
  };
  const kws = categoryKeywords[category] || [];
  const found = kws.some(k => typeStr.includes(k));
  return found ? 'high' : 'medium';
}
