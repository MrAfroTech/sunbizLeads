const axios = require('axios');

const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY || process.env.KLAVIYO_PRIVATE_API_KEY;

async function sendTestEvent() {
  if (!KLAVIYO_PRIVATE_KEY) {
    console.error('❌ KLAVIYO_PRIVATE_API_KEY is not set');
    return { success: false, error: 'API key missing' };
  }
  console.log('✅ Klaviyo API Key found (first 10 chars):', KLAVIYO_PRIVATE_KEY.substring(0, 10));

  try {
    const nameParts = 'Test User'.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const eventData = {
      data: {
        type: 'event',
        attributes: {
          profile: {
            email: 'test@example.com',
            first_name: firstName,
            last_name: lastName
          },
          metric: {
            name: 'Ticket Purchased'
          },
          properties: {
            event_name: 'Coffee Conversation Event',
            event_date: '2024-12-07',
            event_time: '10:00 AM - 12:00 PM EST',
            venue_name: 'Coffee Conversations Collective',
            venue_address: '',
            ticket_quantity: 1,
            ticket_type: 'basic',
            qr_code_url: 'data:image/png;base64,...',
            transaction_id: 'TXN_TEST_001',
            total_price: 25.00,
            customer_name: 'Test User',
            organizer_name: 'Coffee Conversations Collective',
            event_slug: 'coffee_conversation_event_2024_12_07',
            ticket_number: 1,
            purchase_date: new Date().toISOString()
          },
          time: new Date().toISOString()
        }
      }
    };

    console.log('=== Sending to Klaviyo ===');
    console.log('Email:', eventData.data.attributes.profile.email);
    console.log('Metric:', eventData.data.attributes.metric.name);
    console.log('Full Payload:', JSON.stringify(eventData, null, 2));

    const response = await axios.post(
      'https://a.klaviyo.com/api/events/',
      eventData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
          'revision': '2024-10-15'
        }
      }
    );

    console.log('✅ Klaviyo Response Status:', response.status);
    console.log('✅ Klaviyo Response Data:', JSON.stringify(response.data, null, 2));
    console.log('✅ Test event sent to Klaviyo', response.data);
    return { success: true, data: response.data };
  } catch (err) {
    console.error('❌ Klaviyo API Error Status:', err.response?.status);
    console.error('❌ Klaviyo API Error Data:', JSON.stringify(err.response?.data, null, 2));
    console.error('❌ Full Error:', err.message);
    return { success: false, error: err.response?.data || err.message };
  }
}

module.exports = { sendTestEvent };

