// api/send-email.js
const AWS = require('aws-sdk');

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

  console.log('📧 Email API endpoint called');

  try {
    // Configure AWS directly - no separate function needed
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-2'
    });
    
    // Create SES service object
    const ses = new AWS.SES({ apiVersion: '2010-12-01' });
    
    // Extract data from request body
    const { userData, emailContent } = req.body;
    
    if (!userData || !userData.email) {
      console.log('❌ Missing required user data');
      return res.status(400).json({
        success: false,
        message: 'Missing required user data'
      });
    }
    
    console.log(`📤 Preparing to send email to: ${userData.email}`);
    
    // Set sender email with fallback
    const senderEmail = process.env.EMAIL_FROM || 'EzDrink Cash Finder <team@ezdrink.us>';
    
    // Prepare email parameters
    const emailParams = {
      Source: senderEmail,
      Destination: {
        ToAddresses: [userData.email]
      },
      Message: {
        Subject: {
          Data: `Cash Finder Report for ${userData.company || userData.barName || 'Your Bar'}`
        },
        Body: {
          Html: {
            Data: emailContent && emailContent.html 
              ? emailContent.html 
              : '<p>Your Cash Finder Report is attached.</p>'
          },
          Text: {
            Data: emailContent && emailContent.text 
              ? emailContent.text 
              : 'Your Cash Finder Report is attached.'
          }
        }
      }
    };
    
    console.log('📨 Sending email...');
    
    // Send the email
    const result = await ses.sendEmail(emailParams).promise();
    
    console.log('✅ Email sent successfully! MessageId:', result.MessageId);
    
    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      id: result.MessageId
    });
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('Error code:', error.code || 'No error code');
    
    // Return a more helpful error response
    return res.status(500).json({
      success: false,
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN'
    });
  }
};