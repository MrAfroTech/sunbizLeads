// api/ticket-db.js - Database operations for tickets using Supabase
const { getSupabase, initializeDatabase } = require('./db');
const { dbTable, isStagingRuntime } = require('./runtime-env');

/**
 * Create a new ticket record in the database
 */
async function createTicket(ticketData) {
  const supabase = getSupabase();
  
  try {
    // Ensure database is initialized
    await initializeDatabase();
    
    const {
      ticketId,
      transactionId,
      eventName,
      eventDate,
      eventTime,
      eventVenue,
      vendorName,
      customerName,
      customerEmail,
      customerPhone,
      ticketCount,
      ticketNumber,
      tier,
      purchaseDate,
      qrCodeUrl,
      checksum
    } = ticketData;

    console.log('💾 ===== CREATING TICKET IN DATABASE =====');
    console.log('💾 Ticket ID:', ticketId);
    console.log('💾 Transaction ID:', transactionId);
    console.log('💾 Customer:', customerName);
    console.log('💾 Email:', customerEmail);
    console.log('💾 Event:', eventName);
    console.log('💾 Full ticket data:', JSON.stringify({
      ticketId,
      transactionId,
      eventName,
      eventDate,
      customerName,
      customerEmail,
      ticketNumber,
      ticketCount
    }, null, 2));

    const insertData = {
      ticket_id: ticketId,
      transaction_id: transactionId,
      event_name: eventName || null,
      event_date: eventDate || null,
      event_time: eventTime || null,
      event_venue: eventVenue || null,
      vendor_name: vendorName || null,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
      ticket_count: ticketCount || 1,
      ticket_number: ticketNumber || 1,
      tier: tier || 'basic',
      purchase_date: purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString(),
      qr_code_url: qrCodeUrl || null,
      checksum: checksum || null
    };

    console.log('💾 Insert data:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from(dbTable('tickets'))
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ ===== ERROR CREATING TICKET =====');
      console.error('❌ Ticket ID:', ticketId);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error hint:', error.hint);
      console.error('❌ Full error:', JSON.stringify(error, null, 2));
      
      // Handle duplicate key error (ON CONFLICT)
      if (error.code === '23505') {
        console.log('⚠️ Ticket already exists, updating instead...');
        // Ticket already exists, update it
        const { data: updatedData, error: updateError } = await supabase
          .from(dbTable('tickets'))
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('ticket_id', ticketId)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating existing ticket:', updateError);
          throw updateError;
        }

        console.log('✅ Ticket updated in database:', ticketId);
        return updatedData;
      }
      throw error;
    }

    console.log('✅ ===== TICKET CREATED SUCCESSFULLY =====');
    console.log('✅ Ticket ID:', ticketId);
    console.log('✅ Created data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ ===== FATAL ERROR CREATING TICKET =====');
    console.error('❌ Ticket ID:', ticketId);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    throw error;
  }
}

/**
 * Get ticket by ticket ID
 */
async function getTicketByTicketId(ticketId) {
  const supabase = getSupabase();
  
  try {
    // Ensure database is initialized
    console.log('🔧 Initializing database connection...');
    await initializeDatabase();
    
    console.log('🔍 ===== SUPABASE QUERY START =====');
    console.log('🔍 Table: tickets');
    console.log('🔍 Query: SELECT * FROM tickets WHERE ticket_id = $1');
    console.log('🔍 Parameter:', ticketId);
    console.log('🔍 Ticket ID type:', typeof ticketId);
    console.log('🔍 Ticket ID length:', ticketId?.length);
    
    const { data, error } = await supabase
      .from(dbTable('tickets'))
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    console.log('📊 ===== SUPABASE QUERY RESULT =====');
    console.log('📊 Ticket ID searched:', ticketId);
    console.log('📊 Data found:', !!data);
    console.log('📊 Error occurred:', !!error);
    
    if (data) {
      console.log('📊 Ticket data:', JSON.stringify(data, null, 2));
      console.log('📊 Ticket ID in database:', data.ticket_id);
      console.log('📊 Transaction ID in database:', data.transaction_id);
      console.log('📊 Customer name:', data.customer_name);
      console.log('📊 Redeemed status:', data.redeemed);
    }
    
    if (error) {
      console.error('❌ Supabase Error Details:');
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error hint:', error.hint);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log('⚠️ No ticket found with that ID (PGRST116)');
        return null;
      }
      throw error;
    }

    console.log('✅ Ticket found successfully');
    return data;
  } catch (error) {
    console.error('❌ ===== ERROR GETTING TICKET =====');
    console.error('❌ Ticket ID:', ticketId);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    throw error;
  }
}

/**
 * Get ticket by transaction ID
 */
async function getTicketsByTransactionId(transactionId) {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from(dbTable('tickets'))
      .select('*')
      .eq('transaction_id', transactionId)
      .order('ticket_number', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error getting tickets by transaction:', error);
    throw error;
  }
}

/**
 * Get transaction redemption status (check if ANY ticket in transaction is redeemed)
 */
async function getTransactionStatus(transactionId) {
  const supabase = getSupabase();
  
  try {
    console.log('🔍 ===== CHECKING TRANSACTION REDEMPTION STATUS =====');
    console.log('🔍 Transaction ID:', transactionId);
    
    const { data, error } = await supabase
      .from(dbTable('tickets'))
      .select('*')
      .eq('transaction_id', transactionId)
      .order('ticket_number', { ascending: true });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No tickets found for transaction:', transactionId);
      return {
        exists: false,
        redeemed: false,
        tickets: [],
        redeemedAt: null,
        redeemedBy: null
      };
    }

    // Check if ANY ticket in the transaction is redeemed
    const anyRedeemed = data.some(ticket => ticket.redeemed === true);
    const firstRedeemedTicket = data.find(ticket => ticket.redeemed === true);

    console.log('📊 Transaction status:', {
      transactionId,
      totalTickets: data.length,
      anyRedeemed,
      redeemedAt: firstRedeemedTicket?.redeemed_at || null,
      redeemedBy: firstRedeemedTicket?.redeemed_by || null
    });

    return {
      exists: true,
      redeemed: anyRedeemed,
      tickets: data,
      redeemedAt: firstRedeemedTicket?.redeemed_at || null,
      redeemedBy: firstRedeemedTicket?.redeemed_by || null,
      customerName: data[0]?.customer_name,
      customerEmail: data[0]?.customer_email,
      eventName: data[0]?.event_name,
      eventDate: data[0]?.event_date
    };
  } catch (error) {
    console.error('❌ Error getting transaction status:', error);
    throw error;
  }
}

/**
 * Mark ALL tickets in a transaction as redeemed (checked in)
 */
async function markTransactionRedeemed(transactionId, redeemedBy = 'Staff') {
  const supabase = getSupabase();
  
  try {
    console.log('💾 ===== MARKING TRANSACTION AS REDEEMED =====');
    console.log('💾 Transaction ID:', transactionId);
    console.log('💾 Redeemed By:', redeemedBy);
    
    const redeemedAt = new Date().toISOString();
    
    const { data, error } = await supabase
      .from(dbTable('tickets'))
      .update({
        redeemed: true,
        redeemed_at: redeemedAt,
        redeemed_by: redeemedBy,
        updated_at: redeemedAt
      })
      .eq('transaction_id', transactionId)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error(`No tickets found for transaction: ${transactionId}`);
    }

    console.log(`✅ Transaction marked as redeemed: ${data.length} ticket(s) updated`);
    console.log('✅ Updated tickets:', data.map(t => t.ticket_id).join(', '));
    
    return {
      transactionId,
      redeemedAt,
      redeemedBy,
      ticketCount: data.length,
      tickets: data
    };
  } catch (error) {
    console.error('❌ Error marking transaction as redeemed:', error);
    throw error;
  }
}

/**
 * Mark ticket as redeemed (checked in) - DEPRECATED, use markTransactionRedeemed instead
 */
async function markTicketRedeemed(ticketId, redeemedBy = 'Staff') {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from(dbTable('tickets'))
      .update({
        redeemed: true,
        redeemed_at: new Date().toISOString(),
        redeemed_by: redeemedBy,
        updated_at: new Date().toISOString()
      })
      .eq('ticket_id', ticketId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    console.log('✅ Ticket marked as redeemed:', ticketId);
    return data;
  } catch (error) {
    console.error('❌ Error marking ticket as redeemed:', error);
    throw error;
  }
}

/**
 * Get check-in report (all redeemed tickets)
 */
async function getCheckInReport(eventDate = null) {
  const supabase = getSupabase();
  
  try {
    let query = supabase
      .from(dbTable('tickets'))
      .select('*')
      .eq('redeemed', true)
      .order('redeemed_at', { ascending: false });

    if (eventDate) {
      query = query.eq('event_date', eventDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error getting check-in report:', error);
    throw error;
  }
}

/**
 * Get all tickets for an event
 */
async function getTicketsByEvent(eventDate) {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from(dbTable('tickets'))
      .select('*')
      .eq('event_date', eventDate)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error getting tickets by event:', error);
    throw error;
  }
}

/** Tier weight for loyalty scoring (higher = more exclusive). */
const TIER_WEIGHTS = {
  ga: 1,
  basic: 1,
  lane: 2,
  vip: 3,
  vip_bottle: 4,
  all_access: 5
};

/**
 * Score contribution for a single checkout.
 * Frequent / higher-tier / multi-ticket buyers earn more.
 */
function computePurchasePoints({ tier, ticketCount, amountCents }) {
  const count = Math.max(1, parseInt(ticketCount, 10) || 1);
  const cents = Math.max(0, parseInt(amountCents, 10) || 0);
  const weight = TIER_WEIGHTS[String(tier || 'ga').toLowerCase()] || 1;
  const spendDollars = Math.floor(cents / 100);

  // Base checkout + per-ticket volume + tier premium + spend (capped)
  return (
    25 +
    count * 10 +
    count * weight * 5 +
    Math.min(spendDollars, 100)
  );
}

/**
 * Lifetime score from aggregate purchase history.
 * Rewards repeat buyers and people who come to more events.
 */
function computeLifetimeScore({
  totalPurchases,
  totalTickets,
  lifetimeSpendCents,
  uniqueEvents,
  purchasePointsSum
}) {
  const purchases = Math.max(0, totalPurchases || 0);
  const tickets = Math.max(0, totalTickets || 0);
  const events = Math.max(0, uniqueEvents || 0);
  const spendDollars = Math.floor((lifetimeSpendCents || 0) / 100);

  const frequencyBonus = purchases > 1 ? (purchases - 1) * 20 : 0;
  const multiEventBonus = Math.max(0, events - 1) * 15;
  const spendBonus = Math.min(spendDollars, 500);

  // purchasePointsSum already includes per-checkout quality; blend with lifetime bonuses
  return (
    (purchasePointsSum || 0) +
    frequencyBonus +
    multiEventBonus +
    Math.floor(spendBonus * 0.25) +
    tickets // tiny bump for total volume
  );
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * Store purchaser contact + ticket details, then update cross-event customer score.
 * Uses SECURITY DEFINER RPC so repeat buys with the same email always:
 *  - record a new purchase row (new transaction)
 *  - update strikeafterdark_customers.total_tickets / score
 * Tickets themselves are created separately in the tickets table per checkout.
 */
async function createPurchaserContact(contactData) {
  const supabase = getSupabase();

  try {
    await initializeDatabase();

    const {
      customerName,
      customerEmail,
      customerPhone,
      transactionId,
      eventName,
      eventDate,
      eventSlug,
      tier,
      ticketCount,
      amountCents,
      purchaseDate
    } = contactData;

    if (!customerName || !customerEmail) {
      throw new Error('customerName and customerEmail are required');
    }

    const email = normalizeEmail(customerEmail);
    const count = Math.max(1, parseInt(ticketCount, 10) || 1);
    const cents = Math.max(0, parseInt(amountCents, 10) || 0);
    const resolvedTier = String(tier || 'ga').toLowerCase();
    const purchasedAt = purchaseDate
      ? new Date(purchaseDate).toISOString()
      : new Date().toISOString();
    const purchasePoints = computePurchasePoints({
      tier: resolvedTier,
      ticketCount: count,
      amountCents: cents
    });

    console.log('💾 Recording purchase + updating contact totals:', {
      customerEmail: email,
      transactionId,
      tier: resolvedTier,
      ticketCount: count,
      amountCents: cents,
      purchasePoints
    });

    // Staging uses stage_* tables; production RPC hardcodes prod table names — skip it on staging.
    if (isStagingRuntime()) {
      return createPurchaserContactFallback({
        customerName,
        email,
        customerPhone,
        transactionId,
        eventName,
        eventDate,
        eventSlug,
        resolvedTier,
        count,
        cents,
        purchasePoints,
        purchasedAt
      });
    }

    const { data, error } = await supabase.rpc('record_strikeafterdark_purchase', {
      p_customer_name: customerName,
      p_customer_email: email,
      p_customer_phone: customerPhone || null,
      p_transaction_id: transactionId || null,
      p_event_name: eventName || 'Bosses & Bowling',
      p_event_date: eventDate || null,
      p_event_slug: eventSlug || null,
      p_tier: resolvedTier,
      p_ticket_count: count,
      p_amount_cents: cents,
      p_purchase_points: purchasePoints,
      p_purchase_date: purchasedAt
    });

    if (error) {
      console.error('❌ record_strikeafterdark_purchase RPC failed:', error);
      // Fallback path if RPC isn't deployed yet
      return createPurchaserContactFallback({
        customerName,
        email,
        customerPhone,
        transactionId,
        eventName,
        eventDate,
        eventSlug,
        resolvedTier,
        count,
        cents,
        purchasePoints,
        purchasedAt
      });
    }

    console.log('✅ Contact totals updated for repeat-safe purchase:', data);
    return data;
  } catch (error) {
    console.error('❌ Fatal error saving purchaser contact:', error.message);
    throw error;
  }
}

/**
 * Fallback when RPC is unavailable: insert purchase row + upsert contact totals.
 * Still supports same-email repeat purchases by accumulating totals.
 */
async function createPurchaserContactFallback({
  customerName,
  email,
  customerPhone,
  transactionId,
  eventName,
  eventDate,
  eventSlug,
  resolvedTier,
  count,
  cents,
  purchasePoints,
  purchasedAt
}) {
  const supabase = getSupabase();

  const { data: priorPurchases, error: historyError } = await supabase
    .from(dbTable('strikeafterdark'))
    .select('event_date, transaction_id, ticket_count, amount_cents, purchase_points, purchase_date')
    .eq('customer_email', email);

  if (historyError) {
    console.warn('⚠️ Purchase history lookup warning:', historyError.message);
  }

  const priorRows = Array.isArray(priorPurchases) ? priorPurchases : [];
  if (
    transactionId &&
    priorRows.some((row) => row.transaction_id && row.transaction_id === transactionId)
  ) {
    console.log('⚠️ Purchase already recorded for transaction:', transactionId);
    const { data: existingCustomer } = await supabase
      .from(dbTable('strikeafterdark_customers'))
      .select('*')
      .eq('customer_email', email)
      .maybeSingle();
    return existingCustomer || { customer_email: email, skipped: true };
  }

  const historyForScore = [
    ...priorRows,
    {
      event_date: eventDate || null,
      ticket_count: count,
      amount_cents: cents,
      purchase_points: purchasePoints,
      purchase_date: purchasedAt
    }
  ];

  const totalPurchases = historyForScore.length;
  const totalTickets = historyForScore.reduce(
    (sum, row) => sum + (parseInt(row.ticket_count, 10) || 0),
    0
  );
  const lifetimeSpendCents = historyForScore.reduce(
    (sum, row) => sum + (parseInt(row.amount_cents, 10) || 0),
    0
  );
  const uniqueEvents =
    new Set(historyForScore.map((row) => row.event_date).filter(Boolean).map(String)).size || 1;
  const purchasePointsSum = historyForScore.reduce(
    (sum, row) => sum + (parseInt(row.purchase_points, 10) || 0),
    0
  );
  const customerScore = computeLifetimeScore({
    totalPurchases,
    totalTickets,
    lifetimeSpendCents,
    uniqueEvents,
    purchasePointsSum
  });

  const { error: insertError } = await supabase.from(dbTable('strikeafterdark')).insert({
    customer_name: customerName,
    customer_email: email,
    customer_phone: customerPhone || null,
    transaction_id: transactionId || null,
    event_name: eventName || 'Bosses & Bowling',
    event_date: eventDate || null,
    event_slug: eventSlug || null,
    tier: resolvedTier,
    ticket_count: count,
    amount_cents: cents,
    purchase_points: purchasePoints,
    customer_score: customerScore,
    purchase_date: purchasedAt
  });

  if (insertError) {
    // If unique transaction constraint hits, still try to refresh contact totals
    if (insertError.code !== '23505') throw insertError;
    console.warn('⚠️ Purchase row already exists; refreshing contact totals');
  }

  const customerProfile = {
    customer_email: email,
    customer_name: customerName,
    customer_phone: customerPhone || null,
    total_purchases: totalPurchases,
    total_tickets: totalTickets,
    lifetime_spend_cents: lifetimeSpendCents,
    unique_events: uniqueEvents,
    customer_score: customerScore,
    last_tier: resolvedTier,
    first_purchase_at:
      [...historyForScore].map((r) => r.purchase_date).filter(Boolean).sort()[0] || purchasedAt,
    last_purchase_at: purchasedAt,
    updated_at: new Date().toISOString()
  };

  const { error: upsertError } = await supabase
    .from(dbTable('strikeafterdark_customers'))
    .upsert(customerProfile, { onConflict: 'customer_email' });

  if (upsertError) {
    console.error('❌ Fallback contact upsert failed:', upsertError);
    throw upsertError;
  }

  console.log('✅ Fallback contact totals updated:', {
    email,
    totalTickets,
    totalPurchases,
    customerScore
  });

  return {
    skipped: false,
    customer_email: email,
    ticket_count_this_purchase: count,
    total_purchases: totalPurchases,
    total_tickets: totalTickets,
    unique_events: uniqueEvents,
    customer_score: customerScore,
    lifetime_spend_cents: lifetimeSpendCents,
    tier: resolvedTier
  };
}

module.exports = {
  createTicket,
  createPurchaserContact,
  computePurchasePoints,
  computeLifetimeScore,
  TIER_WEIGHTS,
  getTicketByTicketId,
  getTicketsByTransactionId,
  getTransactionStatus,
  markTransactionRedeemed,
  markTicketRedeemed, // Deprecated but kept for backwards compatibility
  getCheckInReport,
  getTicketsByEvent
};
