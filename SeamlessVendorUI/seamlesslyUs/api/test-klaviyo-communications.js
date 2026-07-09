const axios = require('axios');

// Klaviyo configuration
const KLAVIYO_API_KEY = process.env.KLAVIYO_PRIVATE_API_KEY;

// Helper function to send test email via Klaviyo
async function sendTestEmail(profileId, contactData) {
    try {
        console.log('📧 Sending test email via Klaviyo...');
        
        const emailData = {
            data: {
                type: 'email',
                attributes: {
                    profile: {
                        $id: profileId
                    },
                    subject: `Test Email - Welcome to EzDrink, ${contactData.vendorName}!`,
                    template_id: 'welcome_vendor_email', // You'll need to create this template in Klaviyo
                    context: {
                        vendor_name: contactData.vendorName,
                        business_name: contactData.businessName,
                        plan: contactData.selectedPlan,
                        setup_url: `${process.env.FRONTEND_URL}/setup/${profileId}`
                    }
                }
            }
        };

        const response = await axios.post(
            'https://a.klaviyo.com/api/emails/',
            emailData,
            {
                headers: {
                    'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Revision': '2023-12-15'
                }
            }
        );

        console.log('✅ Test email sent via Klaviyo:', response.data);
        return { success: true, messageId: response.data.data.id };
    } catch (error) {
        console.error('❌ Error sending test email:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

// Helper function to send test SMS via Klaviyo
async function sendTestSMS(profileId, contactData) {
    try {
        console.log('📱 Sending test SMS via Klaviyo...');
        
        // Format phone number for SMS
        let formattedPhone = contactData.phone;
        if (formattedPhone && !formattedPhone.startsWith('+')) {
            if (formattedPhone.replace(/\D/g, '').length === 10) {
                formattedPhone = '+1' + formattedPhone.replace(/\D/g, '');
            } else if (formattedPhone.replace(/\D/g, '').length === 11 && formattedPhone.replace(/\D/g, '').startsWith('1')) {
                formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
            }
        }
        
        if (!formattedPhone || formattedPhone.length < 10) {
            console.log('📱 Invalid phone number for SMS, skipping');
            return { success: false, error: 'Invalid phone number' };
        }

        const smsData = {
            data: {
                type: 'sms',
                attributes: {
                    profile: {
                        $id: profileId
                    },
                    message: `Test SMS: Welcome to EzDrink, ${contactData.vendorName}! Your ${contactData.selectedPlan} plan is now active. We'll be in touch within 24 hours to complete your setup. Reply STOP to unsubscribe.`,
                    template_id: 'welcome_vendor_sms' // You'll need to create this template in Klaviyo
                }
            }
        };

        const response = await axios.post(
            'https://a.klaviyo.com/api/sms/',
            smsData,
            {
                headers: {
                    'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Revision': '2023-12-15'
                }
            }
        );

        console.log('✅ Test SMS sent via Klaviyo:', response.data);
        return { success: true, messageId: response.data.data.id };
    } catch (error) {
        console.error('❌ Error sending test SMS:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

// Test endpoint
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-vercel-protection-bypass');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        console.log('🧪 Testing Klaviyo communications...');
        
        const {
            profileId,
            vendorName,
            businessName,
            selectedPlan,
            phone,
            email
        } = req.body;

        if (!profileId || !vendorName || !businessName || !selectedPlan) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const contactData = {
            vendorName,
            businessName,
            selectedPlan,
            phone,
            email
        };

        // Send test email
        const emailResult = await sendTestEmail(profileId, contactData);
        
        // Send test SMS if phone provided
        let smsResult = { success: false, error: 'No phone number provided' };
        if (phone && phone.replace(/\D/g, '').length >= 10) {
            smsResult = await sendTestSMS(profileId, contactData);
        }

        return res.json({
            success: true,
            message: 'Test communications sent',
            results: {
                email: emailResult,
                sms: smsResult
            }
        });

    } catch (error) {
        console.error('❌ Test communications error:', error);
        return res.status(500).json({
            success: false,
            error: 'Test communications failed',
            details: error.message
        });
    }
}; 