/**
 * POS System Detector (Bonus):
 * - Scrape job postings for Toast, Square, Clover, Aloha, Micros
 * - Check LinkedIn employee skills (when API available)
 * - Search company website
 */
import type { POSDetectorResult } from '../../types';

const POS_KEYWORDS: Record<string, string[]> = {
  toast: ['toast pos', 'toast tab', 'toast restaurant'],
  square: ['square pos', 'square restaurant', 'square for restaurants'],
  clover: ['clover pos', 'clover station', 'clover flex'],
  aloha: ['aloha pos', 'ncr aloha', 'aloha edc'],
  micros: ['micros', 'oracle micros', 'simphony'],
};

export async function detectPOS(
  companyName: string,
  websiteHtml?: string,
  jobPostingText?: string
): Promise<POSDetectorResult> {
  const combined = [
    websiteHtml || '',
    jobPostingText || '',
  ].join(' ').toLowerCase();

  let bestMatch: { system: string; confidence: 'high' | 'medium' | 'low' } | null = null;

  for (const [system, keywords] of Object.entries(POS_KEYWORDS)) {
    const matches = keywords.filter(kw => combined.includes(kw.toLowerCase()));
    if (matches.length > 0) {
      const confidence = matches.length >= 2 ? 'high' : 'medium';
      if (!bestMatch || (confidence === 'high' && bestMatch.confidence !== 'high')) {
        bestMatch = { system, confidence };
      }
    }
  }

  if (bestMatch) {
    return { pos_system: bestMatch.system, confidence: bestMatch.confidence };
  }
  return { pos_system: null, confidence: 'low' };
}
