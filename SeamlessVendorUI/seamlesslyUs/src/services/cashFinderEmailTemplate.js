// src/services/cashFinderEmailTemplate.js

/**
 * Generates HTML email template for Cash Finder reports
 * @param {Object} userData - User's contact and personal info
 * @param {Object} reportData - Cash Finder report results
 * @returns {String} - Complete HTML email template
 */
export const generateCashFinderEmail = (userData, reportData) => {
    // Start with the base template
    let template = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Discover Your Bar's Hidden Profits with the Cash Finder Report</title>
    <style>
      /* Base styles */
      body {
        font-family: 'Arial', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #121212;
        color: #ffffff;
        line-height: 1.5;
      }
  
      /* Container */
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #0a0a0a;
        border: 1px solid rgba(212, 175, 55, 0.2);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(224, 184, 65, 0.2);
      }
  
      /* Header */
      .email-header {
        padding: 30px;
        text-align: center;
        background: linear-gradient(rgba(10, 10, 10, 0.95), rgba(10, 10, 10, 0.95)), 
                    radial-gradient(circle at 30% 20%, rgba(212, 175, 55, 0.15), transparent 40%),
                    radial-gradient(circle at 70% 60%, rgba(184, 134, 11, 0.1), transparent 50%);
        border-bottom: 1px solid rgba(224, 184, 65, 0.2);
      }
  
      .logo {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 10px;
        background: linear-gradient(135deg, #d4af37, #f5d76e, #926f34);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        display: inline-block;
      }
  
      .tagline {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
      }
  
      /* Content */
      .email-content {
        padding: 30px;
      }
  
      .greeting {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 20px;
        color: #ffffff;
      }
  
      .headline {
        font-size: 28px;
        font-weight: 700;
        line-height: 1.3;
        margin-bottom: 25px;
        color: #e0b841;
      }
  
      .message {
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 25px;
        font-size: 18px;
        line-height: 1.5;
      }
  
      .highlight {
        color: #e0b841;
        font-weight: 600;
      }
  
      .big-highlight {
        font-size: 22px;
        color: #e0b841;
        font-weight: 700;
      }
  
      /* Results Box */
      .results-box {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 25px;
        border-left: 3px solid #d4af37;
      }
  
      .results-title {
        font-size: 20px;
        font-weight: 600;
        margin-top: 0;
        margin-bottom: 15px;
        color: #e0b841;
      }
  
      /* Stats */
      .stats-container {
        display: flex;
        justify-content: space-between;
        margin: 25px 0;
        flex-wrap: wrap;
      }
  
      .stat-box {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(224, 184, 65, 0.1);
        border-radius: 8px;
        padding: 15px;
        text-align: center;
        min-width: 120px;
        flex: 1;
        margin: 0 5px 10px;
      }
  
      .stat-value {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 5px;
        background: linear-gradient(135deg, #d4af37, #f5d76e);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
  
      .stat-label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
      }
  
      /* Testimonial */
      .testimonial {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 10px;
        padding: 20px;
        margin: 30px 0;
        position: relative;
      }
  
      .quote {
        font-style: italic;
        font-size: 16px;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 15px;
        position: relative;
        padding-left: 25px;
      }
  
      .quote:before {
        content: """;
        position: absolute;
        left: 0;
        top: -5px;
        font-size: 40px;
        color: rgba(224, 184, 65, 0.5);
        line-height: 1;
      }
  
      .testimonial-author {
        font-weight: 600;
        color: #e0b841;
      }
  
      /* PS Note */
      .ps-note {
        font-style: italic;
        font-size: 16px;
        color: rgba(255, 255, 255, 0.9);
        margin-top: 25px;
        padding-top: 20px;
        border-top: 1px dashed rgba(224, 184, 65, 0.3);
      }
  
      /* Footer */
      .email-footer {
        padding: 20px 30px;
        background-color: rgba(0, 0, 0, 0.4);
        text-align: center;
        border-top: 1px solid rgba(224, 184, 65, 0.1);
      }
  
      .social-links {
        margin-bottom: 15px;
      }
  
      .social-link {
        display: inline-block;
        width: 36px;
        height: 36px;
        line-height: 36px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 50%;
        margin: 0 5px;
        color: #ffffff;
        text-align: center;
        text-decoration: none;
      }
  
      .footer-text {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 0;
      }
  
      .unsubscribe {
        color: rgba(255, 255, 255, 0.4);
        text-decoration: underline;
        font-size: 12px;
      }
  
      /* Responsive */
      @media screen and (max-width: 600px) {
        .email-container {
          width: 100%;
          border-radius: 0;
        }
  
        .email-header,
        .email-content,
        .email-footer {
          padding: 20px 15px;
        }
  
        .stats-container {
          flex-direction: column;
        }
  
        .stat-box {
          margin-bottom: 10px;
          width: 100%;
        }
      }
  
      /* Cash Finder Form Styles */
      .funnel-container {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10px;
        margin-top: 30px;
        overflow: hidden;
        border: 1px solid rgba(224, 184, 65, 0.2);
      }
  
      .funnel-step {
        padding: 25px;
      }
  
      .funnel-header {
        text-align: center;
        margin-bottom: 25px;
      }
  
      .funnel-title {
        font-size: 24px;
        margin-bottom: 10px;
      }
  
      .gradient-text {
        background: linear-gradient(135deg, #d4af37, #f5d76e);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
  
      .funnel-subtitle {
        color: rgba(255, 255, 255, 0.8);
        font-size: 16px;
        margin: 0;
      }
  
      .funnel-form {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
  
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
  
      .form-group label {
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
      }
  
      .form-group input {
        padding: 12px 15px;
        border-radius: 5px;
        border: 1px solid rgba(224, 184, 65, 0.3);
        background: rgba(0, 0, 0, 0.3);
        color: white;
        font-size: 16px;
      }
  
      .form-group input:focus {
        outline: none;
        border-color: #e0b841;
      }
  
      .input-with-icon {
        position: relative;
      }
  
      .currency-symbol {
        position: absolute;
        left: 15px;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255, 255, 255, 0.6);
      }
  
      .input-with-icon input {
        padding-left: 30px;
      }
  
      .error-message {
        font-size: 12px;
        color: #ff6b6b;
        margin-top: 3px;
      }
  
      .benefits-highlights {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 25px;
        margin-bottom: 25px;
      }
  
      .benefit-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        background: rgba(255, 255, 255, 0.03);
        padding: 15px;
        border-radius: 8px;
      }
  
      .benefit-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        color: #e0b841;
      }
  
      .benefit-text h4 {
        margin: 0 0 5px 0;
        font-size: 16px;
        color: #e0b841;
      }
  
      .benefit-text p {
        margin: 0;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
      }
  
      .privacy-note {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        text-align: center;
        margin-top: 15px;
      }
  
      .form-buttons {
        display: flex;
        gap: 10px;
        margin-top: 5px;
      }
  
      .primary-button {
        background: linear-gradient(135deg, #d4af37, #f5d76e, #926f34);
        color: #0a0a0a;
        border: none;
        padding: 12px 25px;
        border-radius: 30px;
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
        display: inline-block;
        text-align: center;
        text-decoration: none;
      }
  
      .secondary-button {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(224, 184, 65, 0.3);
        padding: 12px 25px;
        border-radius: 30px;
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
      }
  
      .submit-button {
        width: 100%;
        margin-top: 10px;
        font-size: 18px;
        padding: 15px 25px;
      }
  
      .funnel-footer {
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="logo">EZDrink</div>
        <p class="tagline">Bar Cash Finder Report</p>
      </div>
  
      <div class="email-content">
        <h1 class="headline">YOUR BAR HAS HIDDEN PROFITS</h1>
        
             
        <p class="message">What if you could uncover <span class="highlight">thousands in unclaimed revenue</span> hiding in plain sight?</p>
        
        <p class="message">This isn't theory. These are <span class="highlight">concrete dollars specific to YOUR operation</span>.</p>
  
        <div class="stats-container">
          <div class="stat-box">
            <div class="stat-value">$21K+</div>
            <div class="stat-label">AVG ANNUAL PROFIT INCREASE</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">30</div>
            <div class="stat-label">SECONDS TO COMPLETE</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">100%</div>
            <div class="stat-label">FREE PERSONALIZED REPORT</div>
          </div>
        </div>
  
        <div class="results-box">
          <h3 class="results-title">YOUR PERSONAL CASH FINDER REPORT REVEALS:</h3>
          <ul>
            <li>The <span class="highlight">exact dollar amount</span> you're missing from peak hour optimization</li>
            <li>How much your current inventory practices are <span class="highlight">costing you monthly</span></li>
            <li>Your <span class="highlight">total annual opportunity</span> with simple operational adjustments</li>
            <li>The <span class="highlight">3 highest-impact changes</span> you can make this week</li>
          </ul>
        </div>
    
        <!-- Cash Finder Form - Embedded directly in the email -->
        <div class="funnel-container">
          <div class="funnel-step">
            <div class="funnel-header">
              <h2 class="funnel-title">
                <span class="gradient-text">Get Your Free Cash Finder Report</span>
              </h2>
              <p class="funnel-subtitle">
                Discover exactly how much more revenue your bar could generate with the right systems in place.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px 0;">
              <p style="font-size: 18px; margin-bottom: 20px; color: rgba(255, 255, 255, 0.9);">
                <span class="highlight">30 seconds</span> is all it takes to reveal your bar's hidden profit potential!
              </p>
              
              <!-- Main CTA button with direct link -->
              <a href="https://ezdrink.us/cash-finder-form?email=${userData.email}" target="_blank" rel="noopener noreferrer" style="
                display: inline-block;
                background: #0a0a0a;
                color: #d4af37;
                border: 2px solid #d4af37;
                text-decoration: none;
                padding: 20px 35px;
                border-radius: 30px;
                font-weight: 700;
                font-size: 20px;
                text-align: center;
                margin: 10px 0 20px;
                box-shadow: 0 4px 15px rgba(212, 175, 65, 0.3);
                position: relative;">
                TAP HERE: GET YOUR CASH FINDER REPORT
              </a>
              
              <div class="benefits-highlights">
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </div>
                  <div class="benefit-text">
                    <h4>Reduced Wait</h4>
                    <p>30% less wait time</p>
                  </div>
                </div>
                
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div class="benefit-text">
                    <h4>Increased Revenue</h4>
                    <p>25% boost</p>
                  </div>
                </div>
                
                <div class="benefit-item">
                  <div class="benefit-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div class="benefit-text">
                    <h4>Staff Efficiency</h4>
                    <p>40% productivity</p>
                  </div>
                </div>
              </div>
              
              <p class="privacy-note">
                We respect your privacy. Your information will never be sold or shared.
              </p>
            </div>
          </div>
        </div>
  
        <p class="ps-note">P.S. There's absolutely no cost or obligation. This is the exact same analysis we've used to help bars across the country increase profits by $15,000-$45,000 annually.</p>
        
        <p class="ps-note">P.P.S. Your information is always secure and confidential. We use it solely to generate your custom Cash Finder Report and provide follow-up support on implementing your profit opportunities.</p>
      </div>
  
      <div class="email-footer">
        <div class="social-links">
          <!-- Social links with direct links -->
          <a href="https://ezdrink.us/social/facebook" class="social-link">f</a>
          <a href="https://ezdrink.us/social/linkedin" class="social-link">in</a>
          <a href="https://ezdrink.us/social/instagram" class="social-link">ig</a>
          <a href="https://ezdrink.us/social/twitter" class="social-link">tw</a>
        </div>
        <p class="footer-text">© 2025 EZDrink. All rights reserved.</p>
        <p class="footer-text">123 Bar Blvd, Success City, FL 33333</p>
        <p class="footer-text"><a href="https://ezdrink.us/unsubscribe?email=${userData.email}" class="unsubscribe">Unsubscribe</a> | <a href="https://ezdrink.us/privacy" class="unsubscribe">Privacy Policy</a></p>
      </div>
    </div>
  </body>
  </html>`;
  
    // Add personalized greeting
    if (userData.name) {
      const greeting = `<p class="greeting">Hello ${userData.name},</p>`;
      template = template.replace('<h1 class="headline">YOUR BAR HAS HIDDEN PROFITS</h1>', `${greeting}\n<h1 class="headline">YOUR BAR HAS HIDDEN PROFITS</h1>`);
    }
    
    // Add personalized company name
    if (userData.company) {
      template = template.replace('YOUR operation', `${userData.company}'s operation`);
    }
    
    // Add report data if available
    if (reportData) {
      // Create a results section with their specific numbers
      const reportHtml = `
      <div class="results-box" style="margin-top: 30px; background: rgba(255, 255, 255, 0.05); border-left-color: #e0b841;">
        <h3 class="results-title">YOUR PERSONAL RESULTS:</h3>
        <ul>
          ${reportData.peakHourLoss ? `<li>You're currently losing <span class="highlight">$${reportData.peakHourLoss}/month</span> during peak hours</li>` : ''}
          ${reportData.inventoryWaste ? `<li>Your inventory practices cost you <span class="highlight">$${reportData.inventoryWaste}/month</span></li>` : ''}
          ${reportData.totalOpportunity ? `<li>Total annual opportunity: <span class="highlight">$${reportData.totalOpportunity}</span></li>` : ''}
        </ul>
      </div>`;
      
      // Insert the report data before the call-to-action section
      const insertPoint = template.indexOf('<!-- Cash Finder Form - Embedded directly in the email -->');
      if (insertPoint !== -1) {
        template = template.slice(0, insertPoint) + reportHtml + template.slice(insertPoint);
      }
    }
    
    return template;
  };
  
  /**
   * Generates plain text version of Cash Finder email for clients without HTML support
   * @param {Object} userData - User's contact and personal info
   * @param {Object} reportData - Cash Finder report results 
   * @returns {String} - Plain text email version
   */
  export const generateCashFinderPlainText = (userData, reportData) => {
    return `
  EZDrink - Bar Cash Finder Report
  
  Hello ${userData.name},
  
  YOUR BAR HAS HIDDEN PROFITS
  
  What if you could uncover thousands in unclaimed revenue hiding in plain sight?
  This isn't theory. These are concrete dollars specific to ${userData.company || 'YOUR'} operation.
  
  YOUR PERSONAL CASH FINDER REPORT REVEALS:
  - The exact dollar amount you're missing from peak hour optimization
  - How much your current inventory practices are costing you monthly
  - Your total annual opportunity with simple operational adjustments
  - The 3 highest-impact changes you can make this week
  
  ${reportData ? `
  YOUR PERSONAL RESULTS:
  ${reportData.peakHourLoss ? `- You're currently losing $${reportData.peakHourLoss}/month during peak hours` : ''}
  ${reportData.inventoryWaste ? `- Your inventory practices cost you $${reportData.inventoryWaste}/month` : ''}
  ${reportData.totalOpportunity ? `- Total annual opportunity: $${reportData.totalOpportunity}` : ''}
  ` : ''}
  
  Get Your Free Cash Finder Report
  Discover exactly how much more revenue your bar could generate with the right systems in place.
  
  30 seconds is all it takes to reveal your bar's hidden profit potential!
  
  Visit: https://ezdrink.us/cash-finder-form?email=${userData.email}
  
  BENEFITS:
  - Reduced Wait: 30% less wait time
  - Increased Revenue: 25% boost
  - Staff Efficiency: 40% productivity
  
  P.S. There's absolutely no cost or obligation. This is the exact same analysis we've used to help bars across the country increase profits by $15,000-$45,000 annually.
  
  P.P.S. Your information is always secure and confidential. We use it solely to generate your custom Cash Finder Report and provide follow-up support on implementing your profit opportunities.
  
  © 2025 EZDrink. All rights reserved.
  123 Bar Blvd, Success City, FL 33333
  
  Unsubscribe: https://ezdrink.us/unsubscribe?email=${userData.email}
  Privacy Policy: https://ezdrink.us/privacy
  `;
  };
  
  /**
   * Optional queue function for Cash Finder Plus follow-up email
   * @param {Object} userData - Complete user data
   * @returns {Promise} - Resolves when email is queued
   */
  export const queueCashFinderPlusEmail = async (userData) => {
    // Store in localStorage as a backup
    try {
      const cashFinderPlusQueue = JSON.parse(localStorage.getItem('cash_finder_plus_queue') || '[]');
      
      localStorage.setItem('cash_finder_plus_queue', JSON.stringify([
        ...cashFinderPlusQueue,
        {
          name: userData.name,
          firstName: userData.name.split(' ')[0],
          email: userData.email,
          phone: userData.phone,
          company: userData.company,
          cashFinderData: userData.cashFinderResults,
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h later
          createdAt: new Date().toISOString(),
          status: 'pending'
        }
      ]));
      
      return {
        success: true,
        message: 'Follow-up email scheduled successfully (localStorage)'
      };
    } catch (error) {
      console.error('Error queueing Cash Finder Plus email:', error);
      throw error;
    }
  };
