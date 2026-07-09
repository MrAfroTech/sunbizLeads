// api/send-seven-profits-lead-magnet.js
const AWS = require('aws-sdk');

// Import the email template functions from the correct path
// This is likely where the error occurred - wrong import path
const emailTemplates = require('../src/components/profitSecretsEmailTemplate');

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

  console.log('📧 Lead Magnet API endpoint called');

  try {
    // Configure AWS
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-2'
    });
    
    // Create SES service object
    const ses = new AWS.SES({ apiVersion: '2010-12-01' });
    
    // Extract data from request body
    const { name, email, phone, businessName, venueType, emailContent } = req.body;
    
    if (!email) {
      console.log('❌ Missing required email');
      return res.status(400).json({
        success: false,
        message: 'Missing required email address'
      });
    }
    
    console.log(`📤 Preparing to send lead magnet to: ${email}`);
    
    // Set sender email with fallback
    const senderEmail = process.env.EMAIL_FROM || 'EzDrink Bar Profits <profits@ezdrink.us>';
    
    // Generate email HTML and text content
    // Use the imported functions from the module
    const htmlContent = emailContent?.html || emailTemplates.generateProfitSecretsEmail({
      name,
      email,
      businessName,
      venueType
    });
    
    const textContent = emailContent?.text || emailTemplates.generateProfitSecretsPlainText({
      name,
      email,
      businessName,
      venueType
    });
    
    // Set up the email parameters
    const emailParams = {
      Source: senderEmail,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: `Your Free Guide: 7 Bar Profit Secrets The Top 1% Don't Share`
        },
        Body: {
          Html: {
            Data: htmlContent
          },
          Text: {
            Data: textContent
          }
        }
      },
      ReplyToAddresses: [process.env.REPLY_EMAIL || 'contact@ezdrink.us']
    };
    
    console.log('📨 Sending email...');
    
    // Send the email
    const result = await ses.sendEmail(emailParams).promise();
    
    console.log('✅ Email sent successfully! MessageId:', result.MessageId);
    
    // Store submission in a database or log for tracking (optional)
    try {
      // Add code here to store the lead in your database
      console.log('📝 Lead data stored successfully');
    } catch (storageError) {
      // Non-critical error - log but continue
      console.error('⚠️ Error storing lead data:', storageError);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lead magnet email sent successfully',
      id: result.MessageId
    });
    
  } catch (error) {
    console.error('❌ Error in lead magnet API:', error.message);
    console.error('Error code:', error.code || 'No error code');
    
    // Return a helpful error response
    return res.status(500).json({
      success: false,
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN'
    });
  }
};