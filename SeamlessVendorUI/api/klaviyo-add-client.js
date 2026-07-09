// Vercel API Route for adding clients to Klaviyo lists
import { withCORS } from './cors-middleware.js';

async function handler(req, res) {

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, firstName, lastName, company, phone, listId } = req.body;
    
    // Validate required fields
    if (!email || !listId) {
      return res.status(400).json({
        success: false,
        message: 'Email and listId are required'
      });
    }
    
    // Check if Klaviyo API key is configured
    const klaviyoApiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    if (!klaviyoApiKey) {
      return res.status(500).json({
        success: false,
        message: 'KLAVIYO_PRIVATE_API_KEY not configured'
      });
    }
    
    // Prepare profile data for Klaviyo
    const profileData = {
      data: {
        type: 'profile',
        attributes: {
          email: email,
          phone_number: phone || undefined,
          properties: {
            $first_name: firstName || undefined,
            $last_name: lastName || undefined,
            $company: company || undefined,
            $title: company ? 'Business Owner' : undefined,
            source: 'EzDrink Web Form',
            signup_date: new Date().toISOString()
          }
        }
      }
    };
    
    // Remove undefined values
    Object.keys(profileData.data.attributes.properties).forEach(key => {
      if (profileData.data.attributes.properties[key] === undefined) {
        delete profileData.data.attributes.properties[key];
      }
    });
    
    if (profileData.data.attributes.phone_number === undefined) {
      delete profileData.data.attributes.phone_number;
    }
    
    // Create profile in Klaviyo
    const profileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Revision': '2023-12-15'
      },
      body: JSON.stringify(profileData)
    });
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('Profile creation failed:', errorText);
      return res.status(profileResponse.status).json({
        success: false,
        message: 'Failed to create Klaviyo profile',
        error: errorText
      });
    }
    
    const profileResult = await profileResponse.json();
    
    // Add profile to the specified list
    const listData = {
      data: {
        type: 'profile',
        id: profileResult.data.id
      }
    };
    
    const listResponse = await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Revision': '2023-12-15'
      },
      body: JSON.stringify(listData)
    });
    
    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('List addition failed:', errorText);
      return res.status(listResponse.status).json({
        success: false,
        message: 'Profile created but failed to add to list',
        profileId: profileResult.data.id,
        error: errorText
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Client successfully added to Klaviyo list',
      profileId: profileResult.data.id,
      listId: listId,
      email: email
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// Export the handler wrapped with CORS middleware
export default withCORS(handler);