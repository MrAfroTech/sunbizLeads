/**
 * Google Places API: count locations for a brand/company name in Florida.
 */
import { config } from '../config';

export async function countLocationsForBrand(brandName: string, state = 'FL'): Promise<number> {
  const key = config.google?.placesApiKey;
  if (!key) return 0;

  try {
    // Use Text Search: "brandName Florida" to find establishments
    const query = `${encodeURIComponent(brandName)} ${state}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json() as { results?: unknown[]; next_page_token?: string };

    let count = data.results?.length ?? 0;
    // Note: Text Search returns up to 20 per page. For accurate counts we'd paginate.
    // To avoid quota burn, we cap at first page for now.
    if (data.next_page_token && count >= 20) {
      // Could paginate here - for cost control we stop at 20+
      count = Math.min(count + 1, 200); // heuristic: assume more exist
    }
    return count;
  } catch (err) {
    console.warn('Google Places count failed:', err);
    return 0;
  }
}
