// api/ticket-db.js - Database operations for tickets using Supabase
const { getSupabase, initializeDatabase } = require('./db');

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
      .from('tickets')
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
          .from('tickets')
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
      .from('tickets')
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
      .from('tickets')
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
      .from('tickets')
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
      .from('tickets')
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
      .from('tickets')
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
      .from('tickets')
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
      .from('tickets')
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

module.exports = {
  createTicket,
  getTicketByTicketId,
  getTicketsByTransactionId,
  getTransactionStatus,
  markTransactionRedeemed,
  markTicketRedeemed, // Deprecated but kept for backwards compatibility
  getCheckInReport,
  getTicketsByEvent
};
