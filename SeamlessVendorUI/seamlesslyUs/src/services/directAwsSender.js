// Create this as a new file: directAwsSender.js

// Import the AWS SDK
import AWS from 'aws-sdk';

/**
 * Configure AWS and send email directly using AWS SES
 * This bypasses the need for a complex backend API
 */
export const sendDirectEmail = async (emailData) => {
  // Log the attempt
  console.log('📧 ATTEMPTING DIRECT AWS EMAIL SEND', {
    to: emailData.to,
    subject: emailData.subject
  });
  
  try {
    // Configure AWS with hardcoded credentials
    // IMPORTANT: In production, you should use a more secure approach
    AWS.config.update({
      accessKeyId: 'YOUR_ACCESS_KEY_ID', // Replace with your actual key
      secretAccessKey: 'YOUR_SECRET_ACCESS_KEY', // Replace with your actual secret
      region: 'us-east-2'
    });
    
    // Create SES service object
    const ses = new AWS.SES({ apiVersion: '2010-12-01' });
    
    // Prepare email parameters
    const params = {
      Source: 'team@ezdrink.us',
      Destination: {
        ToAddresses: [emailData.to]
      },
      Message: {
        Subject: {
          Data: emailData.subject,
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: emailData.text || 'Please view this email with an HTML-capable email client.',
            Charset: 'UTF-8'
          }
        }
      }
    };
    
    // Add HTML body if provided
    if (emailData.html) {
      params.Message.Body.Html = {
        Data: emailData.html,
        Charset: 'UTF-8'
      };
    }
    
    // Send the email
    const result = await ses.sendEmail(params).promise();
    
    console.log('✅ EMAIL SENT DIRECTLY VIA AWS:', result.MessageId);
    
    return { 
      success: true, 
      message: 'Email sent successfully via direct AWS connection',
      id: result.MessageId
    };
  } catch (error) {
    console.error('💥 DIRECT AWS EMAIL ERROR:', error);
    
    return { 
      success: false, 
      message: `Error sending email via AWS: ${error.message}`,
      error: error.message,
      code: error.code
    };
  }
};
