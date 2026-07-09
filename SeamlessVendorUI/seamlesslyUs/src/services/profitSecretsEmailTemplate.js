// services/profitSecretsEmailTemplate.js

/**
 * Generates HTML email content for the 7 Bar Profit Secrets lead magnet
 * 
 * @param {object} userData - User data for personalizing the email
 * @returns {string} - HTML content for the email
 */
function generateProfitSecretsEmail(userData) {
    const { name = 'there', email = '', businessName = 'your venue', venueType = 'bar' } = userData;
    
    // Base URL with fallback
    const baseUrl = process.env.BASE_URL || 'https://www.ezdrink.us';
    
    // Generate the link to the HTML guide
    const guideUrl = `${baseUrl}/api/profit-secrets?name=${encodeURIComponent(name)}&business=${encodeURIComponent(businessName)}&type=${encodeURIComponent(venueType)}`;
    
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your 7 Bar Profit Secrets Guide</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: linear-gradient(135deg, #6e00ff 0%, #bb00ff 100%);
        color: white;
        padding: 20px;
        text-align: center;
      }
      .content {
        padding: 20px;
        background-color: #ffffff;
      }
      .footer {
        background-color: #f5f5f5;
        padding: 15px;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #d4af37 0%, #f2c94c 100%);
        color: #000;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 5px;
        font-weight: bold;
        margin: 20px 0;
      }
      .profit-item {
        margin-bottom: 15px;
        border-left: 3px solid #d4af37;
        padding-left: 15px;
      }
      .guide-button {
        display: inline-block;
        background: linear-gradient(135deg, #22074e 0%, #3b0d63 100%);
        color: white;
        text-decoration: none;
        padding: 15px 30px;
        border-radius: 5px;
        font-weight: bold;
        margin: 20px 0;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>7 Bar Profit Secrets</h1>
        <h2>The Strategies Top-Performing Venues Don't Share</h2>
      </div>
      <div class="content">
        <p>Hi ${name},</p>
        <p>Thank you for your interest in maximizing profits at ${businessName}. Your guide to the 7 Bar Profit Secrets is ready to view online.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${guideUrl}" class="guide-button">VIEW YOUR 7 PROFIT SECRETS GUIDE</a>
        </div>
        
        <p>Inside, you'll discover:</p>
        
        <div class="profit-item">
          <strong>Secret #1:</strong> Strategic Menu Engineering & Pricing - how to increase profit per item by 15-22%
        </div>
        
        <div class="profit-item">
          <strong>Secret #2:</strong> Precision Inventory Management - how to reduce pour costs by 4-7%
        </div>
        
        <p>But that's just the beginning of what's in your guide...</p>
        
        <p>To see how these strategies can be implemented at your specific venue, book your personalized EZ Drink demo today:</p>
        
        <center>
          <a href="https://ezdrink.us/demo" class="button">SCHEDULE YOUR FREE DEMO</a>
        </center>
        
        <p>During this 30-minute call, our experts will analyze your current operations and show you exactly how EZ Drink can help you implement these profit-boosting strategies.</p>
        
        <p>To your success,</p>
        <p>The EZ Drink Team</p>
      </div>
      <div class="footer">
        <p>© 2025 EZ Drink AI. All rights reserved.</p>
        <p>123 Tech Lane, Suite 100, San Francisco, CA 94107</p>
        <p><a href="https://ezdrink.us/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
      </div>
    </div>
  </body>
  </html>
    `;
  }
  
  /**
   * Generates plain text email content for the 7 Bar Profit Secrets lead magnet
   * 
   * @param {object} userData - User data for personalizing the email
   * @returns {string} - Plain text content for the email
   */
  function generateProfitSecretsPlainText(userData) {
    const { name = 'there', email = '', businessName = 'your venue', venueType = 'bar' } = userData;
    
    // Base URL with fallback
    const baseUrl = process.env.BASE_URL || 'https://www.ezdrink.us';
    
    // Generate the link to the HTML guide
    const guideUrl = `${baseUrl}/api/profit-secrets?name=${encodeURIComponent(name)}&business=${encodeURIComponent(businessName)}&type=${encodeURIComponent(venueType)}`;
    
    return `
  7 BAR PROFIT SECRETS - The Strategies Top-Performing Venues Don't Share
  
  Hi ${name},
  
  Thank you for your interest in maximizing profits at ${businessName}. Your guide to the 7 Bar Profit Secrets is ready to view online.
  
  VIEW YOUR GUIDE: ${guideUrl}
  
  Inside, you'll discover:
  
  - Secret #1: Strategic Menu Engineering & Pricing - how to increase profit per item by 15-22%
  - Secret #2: Precision Inventory Management - how to reduce pour costs by 4-7%
  
  But that's just the beginning of what's in your guide...
  
  To see how these strategies can be implemented at your specific venue, book your personalized EZ Drink demo today:
  
  SCHEDULE YOUR FREE DEMO: https://ezdrink.us/demo
  
  During this 30-minute call, our experts will analyze your current operations and show you exactly how EZ Drink can help you implement these profit-boosting strategies.
  
  To your success,
  The EZ Drink Team
  
  © 2025 EZ Drink AI. All rights reserved.
  123 Tech Lane, Suite 100, San Francisco, CA 94107
  To unsubscribe: https://ezdrink.us/unsubscribe?email=${encodeURIComponent(email)}
    `;
  }
  
  module.exports = {
    generateProfitSecretsEmail,
    generateProfitSecretsPlainText
  };
