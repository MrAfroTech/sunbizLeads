// api/validate-ticket.js - Validate and display ticket information from QR code
const crypto = require('crypto');
const { getTicketByTicketId, getTransactionStatus, markTransactionRedeemed } = require('./tickets/ticket-db');

/**
 * Generate checksum for validation
 */
function generateChecksum(ticketId, transactionId, customerName) {
  const data = `${ticketId}-${transactionId}-${customerName || ''}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 20);
}

/**
 * Get ticket status from database
 */
async function getTicketStatus(ticketId) {
  try {
    console.log('🔍 getTicketStatus called for ticket:', ticketId);
    const ticket = await getTicketByTicketId(ticketId);
    
    if (!ticket) {
      console.log('⚠️ getTicketByTicketId returned null - ticket does not exist');
      return { 
        redeemed: false, 
        redeemedAt: null,
        redeemedBy: null,
        purchaserData: null,
        exists: false,
        reason: 'ticket_not_found'
      };
    }

    console.log('✅ Ticket found in getTicketStatus, ticket ID:', ticket.ticket_id);
    return {
      redeemed: ticket.redeemed || false,
      redeemedAt: ticket.redeemed_at || null,
      redeemedBy: ticket.redeemed_by || null,
      purchaserData: {
        customerName: ticket.customer_name,
        customerEmail: ticket.customer_email,
        customerPhone: ticket.customer_phone,
        eventName: ticket.event_name,
        eventDate: ticket.event_date,
        ticketNumber: ticket.ticket_number,
        ticketCount: ticket.ticket_count
      },
      exists: true,
      ticket: ticket,
      reason: 'ticket_found'
    };
  } catch (error) {
    console.error('❌ ===== EXCEPTION IN getTicketStatus =====');
    console.error('❌ Ticket ID:', ticketId);
    console.error('❌ Error type:', error.constructor.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // IMPORTANT: If there's a database error, we should NOT say ticket doesn't exist
    // We should distinguish between "ticket not found" vs "database error"
    // For now, return exists: false but include error so caller knows it's a DB issue
    return { 
      redeemed: false, 
      redeemedAt: null,
      redeemedBy: null,
      purchaserData: null,
      exists: false,
      error: error.message,
      errorCode: error.code,
      reason: 'database_error' // This distinguishes from 'ticket_not_found'
    };
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle POST for marking transaction as redeemed (check-in)
  if (req.method === 'POST') {
    try {
      const { ticketId, transactionId, action, redeemedBy, purchaserData, clearAll } = req.body;
      
      // Note: clearAll functionality removed - use database directly to manage tickets
      
      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message: 'Missing transactionId (required for redemption)'
        });
      }

      if (action === 'redeem' || action === 'checkin') {
        console.log('🔍 ===== CHECK-IN REQUEST (BY TRANSACTION) =====');
        console.log('🔍 Transaction ID:', transactionId);
        console.log('🔍 Ticket ID (for reference):', ticketId);
        console.log('🔍 Action:', action);
        console.log('🔍 Redeemed By:', redeemedBy);
        console.log('🔍 Has Purchaser Data:', !!purchaserData);
        console.log('🔍 Full Request Body:', JSON.stringify(req.body, null, 2));

        // Check transaction redemption status (not individual ticket)
        const transactionStatus = await getTransactionStatus(transactionId);
        console.log('📋 ===== CURRENT TRANSACTION STATUS =====');
        console.log('📋 Transaction ID:', transactionId);
        console.log('📋 Transaction Exists:', transactionStatus.exists);
        console.log('📋 Transaction Redeemed:', transactionStatus.redeemed);
        console.log('📋 Redeemed At:', transactionStatus.redeemedAt);
        console.log('📋 Redeemed By:', transactionStatus.redeemedBy);
        console.log('📋 Number of Tickets:', transactionStatus.tickets?.length || 0);
        console.log('📋 Full Transaction Status:', JSON.stringify(transactionStatus, null, 2));

        if (!transactionStatus.exists) {
          console.error('❌ ===== TRANSACTION NOT FOUND IN CHECK-IN POST REQUEST =====');
          console.error('❌ Transaction ID searched:', transactionId);
          console.error('❌ Transaction does not exist in database');
          
          const errorResponse = {
            success: false,
            message: 'Transaction not found in database',
            transactionId: transactionId,
            debug: {
              searchedTransactionId: transactionId,
              timestamp: new Date().toISOString()
            }
          };
          
          console.error('❌ Returning 404 JSON response');
          return res.status(404).json(errorResponse);
        }

        if (transactionStatus.redeemed) {
          console.log('⚠️ Transaction already redeemed:', {
            transactionId,
            redeemedAt: transactionStatus.redeemedAt,
            redeemedBy: transactionStatus.redeemedBy,
            ticketCount: transactionStatus.tickets?.length || 0
          });
          return res.status(200).json({
            success: true,
            alreadyRedeemed: true,
            message: 'This transaction has already been redeemed',
            transactionId: transactionId,
            redeemedAt: transactionStatus.redeemedAt,
            redeemedBy: transactionStatus.redeemedBy,
            ticketCount: transactionStatus.tickets?.length || 0,
            purchaserData: {
              customerName: transactionStatus.customerName,
              customerEmail: transactionStatus.customerEmail,
              eventName: transactionStatus.eventName,
              eventDate: transactionStatus.eventDate
            }
          });
        }

        // Mark ALL tickets in transaction as redeemed
        console.log('💾 Marking transaction as redeemed...');
        const redemptionResult = await markTransactionRedeemed(transactionId, redeemedBy || 'Staff');
        console.log('✅ Transaction marked as redeemed:', {
          transactionId,
          redeemedAt: redemptionResult.redeemedAt,
          redeemedBy: redemptionResult.redeemedBy,
          ticketCount: redemptionResult.ticketCount
        });
        
        const responseData = {
          success: true,
          redeemed: true,
          message: 'Transaction successfully checked in',
          transactionId: transactionId,
          redeemedAt: redemptionResult.redeemedAt,
          redeemedBy: redemptionResult.redeemedBy,
          ticketCount: redemptionResult.ticketCount,
          purchaserData: {
            customerName: transactionStatus.customerName,
            customerEmail: transactionStatus.customerEmail,
            eventName: transactionStatus.eventName,
            eventDate: transactionStatus.eventDate
          }
        };
        
        console.log('✅ ===== CHECK-IN SUCCESS RESPONSE =====');
        console.log('✅ Response data:', JSON.stringify(responseData, null, 2));
        
        return res.status(200).json(responseData);
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "redeem" or "checkin"'
      });

    } catch (error) {
      console.error('❌ Transaction redemption error:', error);
      console.error('❌ Error stack:', error.stack);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Handle GET for ticket validation/display
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed'
    });
  }

  try {
    const { ticketId, transactionId, checksum, eventName, eventDate, eventTime, customerName, customerEmail, customerPhone, ticketCount, ticketNumber, purchaseDate } = req.query;

    console.log('🎫 ===== TICKET VALIDATION REQUEST =====');
    console.log('📥 Request Method:', req.method);
    console.log('📥 Request URL:', req.url);
    console.log('📥 Query Parameters:', {
      ticketId,
      transactionId,
      checksum: checksum ? `${checksum.substring(0, 10)}...` : null,
      eventName,
      eventDate,
      eventTime,
      customerName,
      customerEmail,
      ticketCount,
      ticketNumber
    });
    console.log('📥 Full Query String:', JSON.stringify(req.query, null, 2));

    if (!ticketId || !transactionId) {
      console.error('❌ Missing required parameters:', {
        hasTicketId: !!ticketId,
        hasTransactionId: !!transactionId
      });
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Ticket</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto; }
            .error { color: #d32f2f; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">❌ Invalid Ticket</h1>
            <p>Missing required ticket information.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Validate checksum
    const expectedChecksum = generateChecksum(ticketId, transactionId, customerName || '');
    if (checksum && checksum !== expectedChecksum) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Ticket</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto; }
            .error { color: #d32f2f; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">❌ Invalid Ticket</h1>
            <p>Ticket verification failed. This ticket may be fraudulent.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Get transaction redemption status from database (not individual ticket)
    console.log('🔍 ===== LOOKING UP TRANSACTION IN DATABASE =====');
    console.log('🔍 Transaction ID:', transactionId);
    console.log('🔍 Ticket ID (for reference):', ticketId);
    console.log('🔍 Checksum provided:', !!checksum);

    const transactionStatus = await getTransactionStatus(transactionId);
    const isRedeemed = transactionStatus.redeemed || false;
    
    console.log('📋 ===== TRANSACTION STATUS RESULT =====');
    console.log('📋 Transaction ID:', transactionId);
    console.log('📋 Exists in database:', transactionStatus.exists);
    console.log('📋 Is Redeemed:', isRedeemed);
    console.log('📋 Redeemed At:', transactionStatus.redeemedAt);
    console.log('📋 Redeemed By:', transactionStatus.redeemedBy);
    console.log('📋 Number of Tickets:', transactionStatus.tickets?.length || 0);
    console.log('📋 Full Transaction Status:', JSON.stringify(transactionStatus, null, 2));

    // If transaction doesn't exist in database, show error
    if (!transactionStatus.exists) {
      console.error('❌ Transaction not found in database:', {
        transactionId,
        ticketId
      });
      
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Transaction Not Found</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto; }
            .error { color: #d32f2f; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">❌ Transaction Not Found</h1>
            <p>This transaction was not found in our system. Please verify the transaction ID.</p>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">Transaction ID: ${transactionId}</p>
          </div>
        </body>
        </html>
      `);
    }

    // Format event date for display
    let formattedDate = '';
    if (eventDate) {
      try {
        const date = new Date(eventDate + 'T00:00:00');
        formattedDate = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } catch (e) {
        formattedDate = eventDate;
      }
    }

    // Return HTML page with ticket information
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket Validation - ${eventName || 'Coffee Conversation Event'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            background: linear-gradient(135deg, #4A2C17 0%, #6F4E37 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { 
            background: white; 
            padding: 40px; 
            border-radius: 12px; 
            max-width: 600px; 
            width: 100%;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #4A2C17;
          }
          .header h1 {
            color: #4A2C17;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin-top: 10px;
          }
          .status.valid {
            background: #4caf50;
            color: white;
          }
          .status.redeemed {
            background: #ff9800;
            color: white;
          }
          .ticket-info {
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .info-label {
            font-weight: bold;
            color: #666;
            width: 140px;
          }
          .info-value {
            color: #333;
            flex: 1;
            text-align: right;
          }
          .checkin-btn {
            background: #4A2C17;
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            margin-top: 20px;
            transition: background 0.3s;
          }
          .checkin-btn:hover {
            background: #6F4E37;
          }
          .checkin-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
          }
          .message {
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            text-align: center;
          }
          .message.success {
            background: #e8f5e9;
            color: #2e7d32;
            border: 1px solid #4caf50;
          }
          .message.warning {
            background: #fff3e0;
            color: #e65100;
            border: 1px solid #ff9800;
          }
          .ticket-id {
            font-family: monospace;
            font-size: 12px;
            color: #999;
            margin-top: 20px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${eventName || 'Coffee Conversation Event'}</h1>
            <span class="status ${isRedeemed ? 'redeemed' : 'valid'}">
              ${isRedeemed ? '✓ Already Checked In' : '✓ Valid Ticket'}
            </span>
          </div>

          <div class="ticket-info">
            ${(transactionStatus.customerName || customerName) ? `
            <div class="info-row">
              <span class="info-label">Customer Name:</span>
              <span class="info-value">${transactionStatus.customerName || customerName}</span>
            </div>
            ` : ''}
            ${(transactionStatus.customerEmail || customerEmail) ? `
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${transactionStatus.customerEmail || customerEmail}</span>
            </div>
            ` : ''}
            ${(transactionStatus.tickets?.[0]?.customer_phone || customerPhone) ? `
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${transactionStatus.tickets?.[0]?.customer_phone || customerPhone}</span>
            </div>
            ` : ''}
            ${formattedDate ? `
            <div class="info-row">
              <span class="info-label">Event Date:</span>
              <span class="info-value">${formattedDate}</span>
            </div>
            ` : ''}
            ${(transactionStatus.tickets?.[0]?.event_time || eventTime) ? `
            <div class="info-row">
              <span class="info-label">Event Time:</span>
              <span class="info-value">${transactionStatus.tickets?.[0]?.event_time || eventTime}</span>
            </div>
            ` : ''}
            ${transactionStatus.tickets && transactionStatus.tickets.length > 1 ? `
            <div class="info-row">
              <span class="info-label">Tickets:</span>
              <span class="info-value">${transactionStatus.tickets.length} ticket(s) in this transaction</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">${transactionId}</span>
            </div>
            ${isRedeemed ? `
            <div class="info-row">
              <span class="info-label">Checked In At:</span>
              <span class="info-value">${transactionStatus.redeemedAt ? new Date(transactionStatus.redeemedAt).toLocaleString() : 'N/A'}</span>
            </div>
            ${transactionStatus.redeemedBy ? `
            <div class="info-row">
              <span class="info-label">Checked In By:</span>
              <span class="info-value">${transactionStatus.redeemedBy}</span>
            </div>
            ` : ''}
            ` : ''}
          </div>

              ${isRedeemed ? `
              <div class="message warning">
                ⚠️ This transaction has already been checked in.
                ${transactionStatus.redeemedBy ? `<br><small>Checked in by: ${transactionStatus.redeemedBy}</small>` : ''}
                ${transactionStatus.redeemedAt ? `<br><small>Checked in at: ${new Date(transactionStatus.redeemedAt).toLocaleString()}</small>` : ''}
                ${transactionStatus.tickets && transactionStatus.tickets.length > 1 ? `<br><small>${transactionStatus.tickets.length} ticket(s) redeemed</small>` : ''}
              </div>
              <button class="checkin-btn" disabled style="opacity: 0.5; cursor: not-allowed;">
                Already Checked In
              </button>
              ` : `
              <button class="checkin-btn" onclick="checkIn()">
                Check In Transaction
              </button>
              <div id="message"></div>
              `}

          <div class="ticket-id">
            Transaction ID: ${transactionId}
            ${ticketId ? `<br>Ticket ID: ${ticketId}` : ''}
          </div>
        </div>

        <script>
          async function checkIn() {
            const btn = document.querySelector('.checkin-btn');
            const messageDiv = document.getElementById('message');
            
            btn.disabled = true;
            btn.textContent = 'Checking in...';
            messageDiv.innerHTML = '';

            try {
              // Collect purchaser data from URL params for tracking
              const urlParams = new URLSearchParams(window.location.search);
              const purchaserData = {
                customerName: urlParams.get('customerName') || '${customerName || ''}',
                customerEmail: urlParams.get('customerEmail') || '${customerEmail || ''}',
                customerPhone: urlParams.get('customerPhone') || '${customerPhone || ''}',
                eventName: urlParams.get('eventName') || '${eventName || ''}',
                eventDate: urlParams.get('eventDate') || '${eventDate || ''}',
                ticketNumber: urlParams.get('ticketNumber') || '${ticketNumber || '1'}',
                ticketCount: urlParams.get('ticketCount') || '${ticketCount || '1'}',
                transactionId: '${transactionId}'
              };

              const response = await fetch(window.location.href, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  transactionId: '${transactionId}',
                  ticketId: '${ticketId}', // Keep for reference but not used for redemption
                  action: 'checkin',
                  redeemedBy: 'Staff',
                  purchaserData: purchaserData
                })
              });

              console.log('📥 Check-in response status:', response.status);
              console.log('📥 Check-in response ok:', response.ok);
              console.log('📥 Check-in response headers:', Object.fromEntries(response.headers.entries()));
              
              // Check if response is JSON before parsing
              const contentType = response.headers.get('content-type');
              console.log('📥 Response content-type:', contentType);
              
              let data;
              if (contentType && contentType.includes('application/json')) {
                data = await response.json();
                console.log('📥 Check-in response data (JSON):', JSON.stringify(data, null, 2));
              } else {
                // Response is not JSON (might be HTML error page)
                const text = await response.text();
                console.error('❌ Response is not JSON! Status:', response.status);
                console.error('❌ Response text (first 500 chars):', text.substring(0, 500));
                throw new Error('Server returned non-JSON response. Status: ' + response.status + '. This usually means the ticket was not found.');
              }

              // Check response status
              if (!response.ok) {
                console.error('❌ Response not OK. Status:', response.status);
                console.error('❌ Response data:', data);
                const errorMsg = data?.message || 'Check-in failed with status ' + response.status;
                messageDiv.innerHTML = '<div class="message warning">❌ Error: ' + errorMsg + '</div>';
                btn.disabled = false;
                btn.textContent = 'Check In Ticket';
                return;
              }

              if (data.success) {
                if (data.alreadyRedeemed) {
                  console.log('⚠️ Transaction already redeemed response received');
                  // Show detailed info about when it was checked in
                  const redeemedInfo = data.redeemedAt 
                    ? 'This transaction was already checked in on ' + new Date(data.redeemedAt).toLocaleString()
                    : 'This transaction was already checked in';
                  const redeemedByInfo = data.redeemedBy ? ' by ' + data.redeemedBy : '';
                  const ticketCountInfo = data.ticketCount ? ' (' + data.ticketCount + ' ticket(s))' : '';
                  messageDiv.innerHTML = '<div class="message warning">⚠️ ' + redeemedInfo + redeemedByInfo + ticketCountInfo + '</div>';
                  btn.disabled = true;
                  btn.textContent = 'Already Checked In';
                  // Don't reload - the message already shows the status
                  // Reloading can cause confusion and unnecessary GET requests
                } else {
                  console.log('✅ Check-in successful response received');
                  const ticketCountInfo = data.ticketCount ? ' (' + data.ticketCount + ' ticket(s))' : '';
                  messageDiv.innerHTML = '<div class="message success">✓ Transaction successfully checked in!' + ticketCountInfo + '</div>';
                  btn.disabled = true;
                  btn.textContent = 'Checked In';
                  // Don't reload - just update the UI to show redeemed status
                  // The page will naturally show "already redeemed" if user refreshes
                  // Reloading immediately can cause confusion
                }
              } else {
                console.error('❌ ===== CHECK-IN FAILED (success: false) =====');
                console.error('❌ Response status:', response.status);
                console.error('❌ Response data:', JSON.stringify(data, null, 2));
                console.error('❌ Error message:', data.message);
                console.error('❌ Full response object:', data);
                
                const errorMsg = data.message || 'Failed to check in';
                messageDiv.innerHTML = '<div class="message warning">❌ Error: ' + errorMsg + '</div>';
                btn.disabled = false;
                btn.textContent = 'Check In Ticket';
              }
            } catch (error) {
              console.error('❌ ===== CHECK-IN FRONTEND EXCEPTION =====');
              console.error('❌ Error type:', error.constructor.name);
              console.error('❌ Error message:', error.message);
              console.error('❌ Error stack:', error.stack);
              console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
              
              messageDiv.innerHTML = '<div class="message warning">❌ An error occurred: ' + error.message + '</div>';
              btn.disabled = false;
              btn.textContent = 'Check In Ticket';
            }
          }
        </script>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Ticket validation error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto; }
          .error { color: #d32f2f; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">❌ Error</h1>
          <p>An error occurred while validating the ticket.</p>
        </div>
      </body>
      </html>
    `);
  }
};
