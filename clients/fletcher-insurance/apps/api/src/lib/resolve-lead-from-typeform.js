import { extractContactFromTypeform, mergeContactIntoLead } from './typeform-extract-contact.js';

const nowIso = () => new Date().toISOString();

function leadUpdatePayload(merged) {
  return {
    first_name: merged.first_name,
    last_name: merged.last_name,
    email: merged.email,
    phone: merged.phone,
    region: merged.region,
    product_interest: merged.product_interest,
    source: merged.source,
    updated_at: nowIso()
  };
}

/**
 * Resolve an existing lead (hidden id → email match) or insert a new row.
 * Never blocks on missing association — always returns a lead row.
 *
 * @param {object} payload Typeform webhook JSON
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function resolveOrCreateLead(payload, supabase) {
  const hidden = payload?.form_response?.hidden ?? {};
  const leadIdFromHidden = hidden.lead_id || hidden.leadId || hidden.lead;
  const contact = extractContactFromTypeform(payload);

  if (leadIdFromHidden) {
    const { data: byId, error: idErr } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadIdFromHidden)
      .maybeSingle();
    if (!idErr && byId) {
      const merged = mergeContactIntoLead(byId, contact);
      const { data: updated, error: upErr } = await supabase
        .from('leads')
        .update(leadUpdatePayload(merged))
        .eq('id', byId.id)
        .select('*')
        .single();
      if (upErr) throw new Error(upErr.message);
      return updated;
    }
  }

  const emailForMatch = contact.email || hidden.email || hidden.Email || hidden.EMAIL;
  if (emailForMatch) {
    const { data: byEmail } = await supabase
      .from('leads')
      .select('*')
      .eq('email', String(emailForMatch).trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (byEmail) {
      const merged = mergeContactIntoLead(byEmail, contact);
      const { data: updated, error: upErr } = await supabase
        .from('leads')
        .update(leadUpdatePayload(merged))
        .eq('id', byEmail.id)
        .select('*')
        .single();
      if (upErr) throw new Error(upErr.message);
      return updated;
    }
  }

  const fullRow = {
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone,
    region: contact.region,
    product_interest: contact.product_interest,
    source: contact.source || 'typeform',
    updated_at: nowIso()
  };

  let { data: inserted, error: insErr } = await supabase.from('leads').insert(fullRow).select('*').single();

  if (insErr) {
    console.warn('[resolve-lead] full insert failed, retry minimal columns', insErr.message);
    const minimal = {
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      updated_at: nowIso()
    };
    ({ data: inserted, error: insErr } = await supabase.from('leads').insert(minimal).select('*').single());
  }

  if (insErr) throw new Error(insErr.message);
  return inserted;
}
