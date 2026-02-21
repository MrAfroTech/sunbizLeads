/**
 * Deduplicate leads against existing names already in the Sheet.
 */

export function dedup(leads, existingNames) {
  return leads.filter((l) => !existingNames.has(l.name));
}
