// Debug Klaviyo API directly
import { withCORS } from './cors-middleware.js';

async function handler(req, res) {

    console.log('🔧 === KLACIYO DEBUG START ===');
    
    // Test data
    const testContact = {
        vendorName: 'Test User',
        businessName: 'Test Business',
        vendorType: 'food-truck',
        cuisineType: 'bbq',
        email: 'test@example.com',
        phone: '555-1234',
        posSystem: 'square',
        selectedPlan: 'free'
    };

    const KLAVIYO_API_KEY = 'pk_6811fc9f50361d1357c49b1bd91a029acc';
    const KLAVIYO_LIST_ID = 'TJr6rx';

    console.log('🔧 Using API Key:', KLAVIYO_API_KEY ? `${KLAVIYO_API_KEY.substring(0, 10)}...` : 'NOT SET');
    console.log('🔧 Using List ID:', KLAVIYO_LIST_ID);
    console.log('🔧 Test contact data:', testContact);

    try {
        // Test 1: Create profile
        console.log('🔧 Testing Klaviyo profile creation...');
        
        const klaviyoData = {
            data: {
                type: 'profile',
                attributes: {
                    email: testContact.email,
                    phone_number: testContact.phone,
                    first_name: testContact.vendorName,
                    last_name: testContact.businessName,
                    properties: {
                        $consent: ['email', 'sms'],
                        vendor_type: testContact.vendorType,
                        cuisine_type: testContact.cuisineType || '',
                        pos_system: testContact.posSystem || '',
                        business_name: testContact.businessName,
                        plan_selected: testContact.selectedPlan,
                        source: 'ezfest_vendor_registration'
                    }
                }
            }
        };

        console.log('🔧 Klaviyo request payload:', JSON.stringify(klaviyoData, null, 2));

        const response = await fetch('https://a.klaviyo.com/api/profiles/', {
            method: 'POST',
            headers: {
                'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Revision': '2023-12-15'
            },
            body: JSON.stringify(klaviyoData)
        });

        console.log('🔧 Klaviyo response status:', response.status);
        console.log('🔧 Klaviyo response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.log('🔧 Klaviyo error response:', errorText);
            return res.json({
                success: false,
                error: `Klaviyo API error: ${response.status} ${response.statusText}`,
                details: errorText,
                step: 'profile_creation'
            });
        }

        const result = await response.json();
        console.log('🔧 Klaviyo profile creation result:', result);

        const profileId = result.data.id;
        console.log('🔧 Created profile ID:', profileId);

        // Test 2: Add to list
        console.log('🔧 Testing list subscription...');
        
        const listPayload = {
            data: {
                type: 'profile-subscription-bulk-create-job',
                attributes: {
                    profiles: {
                        data: [
                            {
                                type: 'profile',
                                id: profileId
                            }
                        ]
                    }
                }
            }
        };

        const listResponse = await fetch(`https://a.klaviyo.com/api/lists/${KLAVIYO_LIST_ID}/profile-subscription-bulk-create-jobs/`, {
            method: 'POST',
            headers: {
                'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Revision': '2023-12-15'
            },
            body: JSON.stringify(listPayload)
        });

        console.log('🔧 List subscription response status:', listResponse.status);

        if (!listResponse.ok) {
            const listErrorText = await listResponse.text();
            console.log('🔧 List subscription error:', listErrorText);
            return res.json({
                success: false,
                error: `List subscription error: ${listResponse.status} ${listResponse.statusText}`,
                details: listErrorText,
                step: 'list_subscription',
                profileId: profileId
            });
        }

        const listResult = await listResponse.json();
        console.log('🔧 List subscription result:', listResult);

        console.log('🔧 === KLACIYO DEBUG SUCCESS ===');

        return res.json({
            success: true,
            message: 'Klaviyo integration test successful',
            profileId: profileId,
            listResult: listResult,
            step: 'complete'
        });

    } catch (error) {
        console.error('🔧 === KLACIYO DEBUG ERROR ===');
        console.error('🔧 Error:', error);
        console.error('🔧 Error message:', error.message);
        console.error('🔧 Error stack:', error.stack);

        return res.json({
            success: false,
            error: 'Klaviyo integration test failed',
            details: error.message,
            step: 'error'
        });
    }
}

// Export the handler wrapped with CORS middleware
export default withCORS(handler);