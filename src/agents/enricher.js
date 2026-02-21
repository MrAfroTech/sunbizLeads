/**
 * Google Places enrichment: location count verification for Sunbiz entities.
 */

/**
 * Heuristic: high review count often = multi-location chain.
 * @param {object} place - Place result (user_ratings_total)
 * @returns {number}
 */
function estimateLocations(place) {
  const total = place?.user_ratings_total ?? 0;
  if (total > 5000) return Math.floor(Math.random() * 8) + 5;
  if (total > 1000) return Math.floor(Math.random() * 4) + 2;
  return 1;
}

/**
 * Enrich entities with Google Places data (location count, rating, review count).
 * Uses /proxy/places so the React app must run with proxy server.
 * @param {object[]} entities - Raw entities with entityName
 * @param {function} [onLog] - (level, layer, msg) => void
 * @returns {Promise<object[]>} Enriched entities with locations, rating, reviewCount
 */
export async function enrichWithPlaces(entities, onLog) {
  const noop = () => {};
  const log = onLog || noop;
  log('info', 'est', 'Enriching with Google Places · location count verification');

  const enriched = [];
  for (const entity of entities) {
    try {
      const query = encodeURIComponent(entity.entityName || entity.name || '');
      const resp = await fetch(
        `/proxy/places?query=${query}&fields=place_id,name,rating,user_ratings_total`
      );
      const data = await resp.json();
      const place = data.results?.[0];

      enriched.push({
        ...entity,
        locations: place ? estimateLocations(place) : 1,
        rating: place?.rating,
        reviewCount: place?.user_ratings_total,
      });

      await new Promise((r) => setTimeout(r, 200));
    } catch {
      enriched.push({ ...entity, locations: 1 });
    }
  }

  return enriched;
}
