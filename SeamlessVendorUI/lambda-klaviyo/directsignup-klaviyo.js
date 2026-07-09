const axios = require('axios');
const AWS = require('aws-sdk');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const crypto = require('crypto');

exports.handler = async (event) => {
  const allowedOrigins = [
    "https://seamlessly.us",
    "https://www.seamlessly.us",
    "https://seamless-client-maurice-sanders-projects.vercel.app"
  ];

  const origin = event.headers?.origin || event.headers?.Origin;
  let corsOrigin = "";

  // Allow both seamlessly.us (with and without www) AND vercel.app patterns
  if (
    allowedOrigins.includes(origin) ||
    (origin && origin.includes('vercel.app')) ||
    (origin && origin.startsWith('https://seamless-client-site-'))
  ) {
    corsOrigin = origin;
  }

  // If still empty, allow seamlessly.us as fallback
  if (!corsOrigin) {
    corsOrigin = "https://seamlessly.us";
  }

  // Handle preflight (OPTIONS)
  if (event.requestContext?.http?.method === "OPTIONS" || event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
      },
      body: ''
    };
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    const { 
      businessName, 
      vendorType, 
      cuisineType, 
      email, 
      phone, 
      posSystem, 
      selectedPlan 
    } = body;
    
    console.log('📋 Received DirectSignup data:', {
      businessName,
      vendorType,
      cuisineType,
      email,
      phone,
      posSystem,
      selectedPlan
    });
    
    // Validate required fields
    if (!email || !businessName || !phone || !selectedPlan) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
        },
        body: JSON.stringify({
          success: false,
          message: 'Email, business name, phone, and selected plan are required'
        })
      };
    }
    
    // Check if Klaviyo API key is configured
    const klaviyoApiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    if (!klaviyoApiKey) {
      console.error('❌ KLAVIYO_PRIVATE_API_KEY not configured');
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
        },
        body: JSON.stringify({
          success: false,
          message: 'KLAVIYO_PRIVATE_API_KEY not configured'
        })
      };
    }

    // Get the client list ID from environment variable
    const clientListId = process.env.KLAVIYO_CLIENT_LIST_ID;
    if (!clientListId) {
      console.error('❌ KLAVIYO_CLIENT_LIST_ID not configured');
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
        },
        body: JSON.stringify({
          success: false,
          message: 'KLAVIYO_CLIENT_LIST_ID not configured'
        })
      };
    }
    
    console.log('📧 Using Klaviyo client list ID:', clientListId);
    
    // Prepare profile data for Klaviyo with DirectSignup specific fields
    // Format phone number to E.164 format (required by Klaviyo)
    let formattedPhone = phone;
    if (phone && !phone.startsWith('+')) {
      // Remove all non-digits and add +1 prefix for US numbers
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        formattedPhone = `+1${cleanPhone}`;
      } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
        formattedPhone = `+${cleanPhone}`;
      } else {
        formattedPhone = `+1${cleanPhone}`; // Default to +1 prefix
      }
    }
    
    console.log('📞 Phone formatting debug:', { original: phone, formatted: formattedPhone });
    
    const profileData = {
      data: {
        type: 'profile',
        attributes: {
          email: email,
          phone_number: formattedPhone,
          organization: businessName, // Standard field for company
          properties: { // Only custom fields here
            business_type: vendorType || undefined,
            cuisine_type: cuisineType || undefined,
            pos_system: posSystem || undefined,
            selected_plan: selectedPlan,
            source: 'DirectSignup Form',
            signup_date: new Date().toISOString(),
            form_type: 'DirectSignup',
            plan_tier: selectedPlan
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
    
    console.log('📧 Creating Klaviyo profile with data:', JSON.stringify(profileData, null, 2));
    
    // Try to create profile in Klaviyo, or update if it already exists
    let profileId;
    try {
      const profileResponse = await axios.post('https://a.klaviyo.com/api/profiles/', profileData, {
        headers: {
          'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Revision': '2023-12-15'
        }
      });
      
      if (!profileResponse.data || !profileResponse.data.data || !profileResponse.data.data.id) {
        throw new Error('Invalid response from Klaviyo profile creation');
      }
      
      profileId = profileResponse.data.data.id;
      console.log('✅ Profile created successfully with ID:', profileId);
      
    } catch (error) {
      // If profile already exists (409 conflict), try to get the existing profile ID
      if (error.response && error.response.status === 409) {
        console.log('📧 Profile already exists, getting existing profile ID...');
        
        // Extract the duplicate profile ID from the error response
        const duplicateProfileId = error.response.data.errors?.[0]?.meta?.duplicate_profile_id;
        if (duplicateProfileId) {
          profileId = duplicateProfileId;
          console.log('✅ Using existing profile ID:', profileId);
          
          // Update the existing profile with new data
          try {
            const updateData = {
              data: {
                type: 'profile',
                id: profileId,
                attributes: {
                  email: email,
                  phone_number: formattedPhone,
                  organization: businessName,
                  properties: {
                    business_type: vendorType || undefined,
                    cuisine_type: cuisineType || undefined,
                    pos_system: posSystem || undefined,
                    selected_plan: selectedPlan,
                    source: 'DirectSignup Form',
                    signup_date: new Date().toISOString(),
                    form_type: 'DirectSignup',
                    plan_tier: selectedPlan
                  }
                }
              }
            };
            
            await axios.patch(`https://a.klaviyo.com/api/profiles/${profileId}/`, updateData, {
              headers: {
                'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Revision': '2023-12-15'
              }
            });
            console.log('✅ Profile updated successfully');
          } catch (updateError) {
            console.warn('⚠️ Could not update profile, but will continue with list addition:', updateError.message);
          }
        } else {
          throw new Error('Profile already exists but could not retrieve profile ID');
        }
      } else {
        throw error;
      }
    }
    
    // Add profile to the client list
    const listData = {
      data: [
        {
          type: 'profile',
          id: profileId
        }
      ]
    };
    
    console.log(`📧 Adding profile ${profileId} to client list ${clientListId}...`);
    
    const listResponse = await axios.post(`https://a.klaviyo.com/api/lists/${clientListId}/relationships/profiles/`, listData, {
      headers: {
        'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Revision': '2023-12-15'
      }
    });
    
    console.log(`✅ Successfully added ${email} to Klaviyo client list ${clientListId}`);
    
    // 🆕 SQUARE INTEGRATION EXTENSION STARTS HERE
    
    // Generate Square integration token if POS system is Square
    let squareToken = null;
    if (posSystem && posSystem.toLowerCase() === 'square') {
      console.log('🔄 Generating Square integration token...');
      
      try {
        // Generate a secure random token
        squareToken = crypto.randomBytes(32).toString('hex');
        
        // Store token in DynamoDB
        const tokenData = {
          TableName: process.env.SQUARE_TOKENS_TABLE || 'seamless-square-tokens',
          Item: {
            token: squareToken,
            email: email,
            businessName: businessName,
            profileId: profileId,
            posSystem: posSystem,
            selectedPlan: selectedPlan,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiry
            integrationStatus: 'pending', // Changed from 'status' to avoid reserved word
            integrationUrl: `${process.env.INTEGRATION_BASE_URL || 'https://app.seamless.us'}/integrate/square?token=${squareToken}`
          }
        };
        
        await dynamodb.put(tokenData).promise();
        console.log('✅ Square integration token stored in DynamoDB');
        
        // Trigger Klaviyo email with Square integration link
        console.log('📧 Triggering Square integration email via Klaviyo...');
        
        // Create a custom event in Klaviyo to trigger the email
        const integrationEventData = {
          data: {
            type: 'event',
            attributes: {
              properties: {
                email: email,
                organization: businessName,
                business_type: vendorType || '',
                cuisine_type: cuisineType || '',
                pos_system: posSystem,
                selected_plan: selectedPlan,
                square_integration_token: squareToken,
                integration_url: tokenData.Item.integrationUrl,
                signup_date: new Date().toISOString()
              },
              metric: {
                name: 'Square Integration Requested',
                value: 1
              }
            }
          }
        };
        
        // Send the event to Klaviyo
        await axios.post('https://a.klaviyo.com/api/events/', integrationEventData, {
          headers: {
            'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Revision': '2023-12-15'
          }
        });
        
        console.log('✅ Square integration event sent to Klaviyo');
        
      } catch (error) {
        console.error('⚠️ Error in Square integration setup:', error);
        // Don't fail the entire signup if Square integration fails
        // The user can still complete their signup
      }
    }
    
    // 🆕 SQUARE INTEGRATION EXTENSION ENDS HERE
    
    // Return success response
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
      },
      body: JSON.stringify({
        success: true,
        message: 'DirectSignup successful! Contact added to Klavlyo client list',
        profileId: profileId,
        listId: clientListId,
        email: email,
        businessName: businessName,
        selectedPlan: selectedPlan,
        squareIntegration: posSystem && posSystem.toLowerCase() === 'square' ? {
          token: squareToken,
          status: 'pending',
          message: 'Square integration email sent via Klaviyo'
        } : null
      })
    };
    
  } catch (error) {
    console.error('❌ Error in DirectSignup Lambda function:', error);
    
    // Handle specific Klaviyo API errors
    if (error.response) {
      console.error('❌ Klaviyo API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to process DirectSignup',
        error: error.message,
        details: error.response?.data || 'No additional details available'
      })
    };
  }
}; 