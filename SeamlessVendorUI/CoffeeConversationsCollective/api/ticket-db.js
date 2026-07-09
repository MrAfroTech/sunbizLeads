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
      
      // Handle duplicate key error (ON CONFLICT)
      if (error.code === '23505') {
        console.log('⚠️ Ticket already exists, updating instead...');
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
    return data;
  } catch (error) {
    console.error('❌ ===== FATAL ERROR CREATING TICKET =====');
    console.error('❌ Ticket ID:', ticketId);
    console.error('❌ Error message:', error.message);
    throw error;
  }
}

/**
 * Get ticket by ticket ID
 */
async function getTicketByTicketId(ticketId) {
  const supabase = getSupabase();
  
  try {
    await initializeDatabase();
    
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error getting ticket:', error);
    throw error;
  }
}

/**
 * Get tickets by transaction ID
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
 * Get transaction redemption status
 */
async function getTransactionStatus(transactionId) {
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

    if (!data || data.length === 0) {
      return {
        exists: false,
        redeemed: false,
        tickets: [],
        redeemedAt: null,
        redeemedBy: null
      };
    }

    const anyRedeemed = data.some(ticket => ticket.redeemed === true);
    const firstRedeemedTicket = data.find(ticket => ticket.redeemed === true);

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
 * Mark ALL tickets in a transaction as redeemed
 */
async function markTransactionRedeemed(transactionId, redeemedBy = 'Staff') {
  const supabase = getSupabase();
  
  try {
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

module.exports = {
  createTicket,
  getTicketByTicketId,
  getTicketsByTransactionId,
  getTransactionStatus,
  markTransactionRedeemed
};
