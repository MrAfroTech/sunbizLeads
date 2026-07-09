const STORAGE_KEY = 'calc_copy_ab_variant';
const VALID_VARIANTS = new Set(['a', 'b']);

export const VARIANT_PRE_HEADLINE =
  'Every venue has hidden revenue leaks.';

export const VARIANT_COPY = {
  a: {
    headline: 'Ready to find yours?',
    subhead: "You'll be shocked. ↓",
    cta: 'Reveal My Revenue Potential',
  },
  b: {
    headline: 'See how much revenue your guests left on the table last month.',
    subhead: null,
    cta: 'Calculate My Revenue Leak',
  },
};

export function normalizeVariant(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return VALID_VARIANTS.has(normalized) ? normalized : null;
}

export function getStoredAbVariant() {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeVariant(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function persistAbVariant(variant) {
  const normalized = normalizeVariant(variant);
  if (!normalized || typeof window === 'undefined') return null;
  try {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // ignore
  }
  return normalized;
}

export function assignRandomAbVariant() {
  return Math.random() < 0.5 ? 'a' : 'b';
}

/**
 * Resolves variant from URL, localStorage, or new 50/50 assignment.
 */
export function resolveAbVariant(searchParams) {
  const fromUrl = searchParams?.get ? normalizeVariant(searchParams.get('variant')) : null;
  if (fromUrl) {
    persistAbVariant(fromUrl);
    return fromUrl;
  }

  const stored = getStoredAbVariant();
  if (stored) return stored;

  const assigned = assignRandomAbVariant();
  persistAbVariant(assigned);
  return assigned;
}

/**
 * Ensures ?variant=a|b is present in the URL without dropping other params.
 */
export function syncAbVariantInSearchParams(searchParams, setSearchParams, variant) {
  const normalized = normalizeVariant(variant);
  if (!normalized || !setSearchParams) return;

  const current = normalizeVariant(searchParams?.get?.('variant'));
  if (current === normalized) return;

  const next = new URLSearchParams(searchParams?.toString?.() ?? '');
  next.set('variant', normalized);
  setSearchParams(next, { replace: true });
}
