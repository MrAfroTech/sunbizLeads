/**
 * Multi-Location Detector:
 * - Search Sunbiz for "Group", "Concepts", "Holdings", "Partners" or same registered agent / 5+ DBAs
 * - Count locations via Google Places API
 * - Verify on LinkedIn (employee count check when API available)
 * - Flag only if 10+ locations confirmed by 2+ sources
 */
import type { OperatorCategory } from '../../types';
import { classifyByKeywords } from './category-classifier';

const MULTI_INDICATOR_KEYWORDS = ['group', 'concepts', 'holdings', 'partners', 'ventures', 'enterprises'];
const MIN_LOCATIONS = 10;
const MIN_CONFIRMATION_SOURCES = 2;

export interface MultiLocationCandidate {
  company_name: string;
  document_number?: string;
  registered_agent?: string;
  dba_count?: number;
  entity_keywords: string[];
}

export interface MultiLocationDetectorOutput {
  company_name: string;
  location_count: number;
  category: OperatorCategory;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
}

/**
 * Check if entity name suggests multi-location (Sunbiz indicator).
 */
export function hasSunbizMultiIndicators(candidate: MultiLocationCandidate): boolean {
  const name = candidate.company_name.toLowerCase();
  const hasKeyword = MULTI_INDICATOR_KEYWORDS.some(k => name.includes(k));
  const hasManyDbas = (candidate.dba_count ?? 0) >= 5;
  return hasKeyword || hasManyDbas;
}

/**
 * Combine location counts from multiple sources and require 2+ confirmations.
 */
export function resolveLocationCount(
  googleCount: number,
  linkedinEstimate?: number,
  manualOverride?: number
): { count: number; sources: string[]; confidence: 'high' | 'medium' | 'low' } {
  const sources: string[] = [];
  if (googleCount > 0) sources.push('google_places');
  if (linkedinEstimate != null && linkedinEstimate > 0) sources.push('linkedin');
  if (manualOverride != null && manualOverride > 0) sources.push('manual');

  if (sources.length < MIN_CONFIRMATION_SOURCES && !manualOverride) {
    return { count: 0, sources, confidence: 'low' };
  }

  const counts = [googleCount, linkedinEstimate, manualOverride].filter((n): n is number => n != null && n > 0);
  const avg = counts.length > 0 ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 0;
  const max = Math.max(googleCount, linkedinEstimate ?? 0, manualOverride ?? 0);
  const count = manualOverride ?? (sources.length >= 2 ? Math.round((avg + max) / 2) : max);

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (sources.length >= 2 && count >= MIN_LOCATIONS) confidence = 'high';
  else if (sources.length >= 1 && count >= MIN_LOCATIONS) confidence = 'medium';

  return { count, sources, confidence };
}

/**
 * Full detection: candidate + Google count (+ optional LinkedIn) → output.
 */
export function detectMultiLocation(
  candidate: MultiLocationCandidate,
  googleLocationCount: number,
  linkedinEmployeeEstimate?: number
): MultiLocationDetectorOutput | null {
  const { count, sources, confidence } = resolveLocationCount(
    googleLocationCount,
    linkedinEmployeeEstimate ? Math.max(1, Math.floor(linkedinEmployeeEstimate / 15)) : undefined
  );

  if (count < MIN_LOCATIONS) return null;
  const hasDbaOverride = (candidate.dba_count ?? 0) >= 5;
  if (sources.length < MIN_CONFIRMATION_SOURCES && !hasDbaOverride) return null;

  const { category } = classifyByKeywords(candidate.company_name);
  return {
    company_name: candidate.company_name,
    location_count: count,
    category,
    confidence,
    sources,
  };
}
