import { getStoredLeadEmail } from './leadEngineStorage';
import { getStoredContactEmail } from './seamlesslyContactCapture';
import { contactForEngagementTracker } from './journeyContactHelpers';

/**
 * Standing rule: merge URL identity with any stored identity so attribution
 * updates (ab_variant, lead_score) land on the same row as email/name/phone.
 */
export function resolveKnownLeadIdentity(searchParams) {
  const fromUrl = contactForEngagementTracker(searchParams) || {};

  const email =
    (fromUrl.email && String(fromUrl.email).trim().toLowerCase()) ||
    getStoredLeadEmail() ||
    getStoredContactEmail() ||
    null;

  const name = (fromUrl.name && String(fromUrl.name).trim()) || null;
  const phone =
    (fromUrl.phone && String(fromUrl.phone).trim()) ||
    (fromUrl.phone_number && String(fromUrl.phone_number).trim()) ||
    null;

  return {
    ...fromUrl,
    ...(email ? { email } : {}),
    ...(name ? { name } : {}),
    ...(phone ? { phone, phone_number: phone } : {}),
  };
}

/** Fill missing identity from localStorage when syncing a visit row. */
export function mergeStoredIdentity(fields = {}) {
  const email =
    fields.email ||
    getStoredLeadEmail() ||
    getStoredContactEmail() ||
    undefined;
  return {
    name: fields.name || undefined,
    email,
    phone: fields.phone || fields.phone_number || undefined,
  };
}
