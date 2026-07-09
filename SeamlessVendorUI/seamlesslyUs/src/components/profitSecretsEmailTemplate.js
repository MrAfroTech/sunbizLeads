// components/profitSecretsEmailTemplate.js

/**
 * Generates HTML email content for the 7 Bar Profit Secrets lead magnet
 * 
 * @param {object} userData - User data for personalizing the email
 * @returns {string} - HTML content for the email
 */
function generateProfitSecretsEmail(userData) {
    const { name = 'there', email = '', businessName = 'your venue', venueType = 'bar' } = userData;
    
    // Use www version of URL as that's where requests are redirected
    const demoUrl = "https://www.ezdrink.us/demo";
    
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>7 Bar Profit Secrets The Top 1% Don't Share</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
      
      body {
        font-family: 'Montserrat', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f8f8f8;
      }
      
      .container {
        max-width: 650px;
        margin: 0 auto;
        background-color: #ffffff;
      }
      
      .header {
        background: linear-gradient(135deg, #22074e 0%, #3b0d63 100%);
        color: white;
        padding: 30px;
        text-align: center;
      }
      
      .content {
        padding: 30px;
      }
      
      .footer {
        background-color: #f5f5f5;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      
      h1 {
        font-size: 28px;
        margin-bottom: 10px;
        font-weight: 700;
        margin-top: 0;
      }
      
      h2 {
        font-size: 22px;
        font-weight: 600;
        margin-top: 0;
        margin-bottom: 15px;
      }
      
      h3 {
        font-size: 20px;
        color: #3b0d63;
        border-bottom: 2px solid #d4af37;
        padding-bottom: 8px;
        margin-top: 30px;
      }
      
      .gold-text {
        color: #d4af37;
      }
      
      .intro-message {
        background-color: #f8f4ff;
        border-left: 4px solid #3b0d63;
        padding: 15px;
        margin: 20px 0;
      }
      
      .secret {
        margin-bottom: 25px;
        padding: 0 0 15px 0;
        border-bottom: 1px dashed #ddd;
      }
      
      .secret-header {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
      }
      
      .secret-number {
        background: linear-gradient(135deg, #d4af37 0%, #f2c94c 100%);
        color: #22074e;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 18px;
        margin-right: 15px;
        flex-shrink: 0;
      }
      
      .secret-title {
        font-size: 18px;
        color: #3b0d63;
        font-weight: 600;
        margin: 0;
      }
      
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #d4af37 0%, #f2c94c 100%);
        color: #22074e;
        text-decoration: none;
        padding: 12px 25px;
        border-radius: 5px;
        font-weight: 700;
        margin: 15px 0;
      }
      
      .callout {
        background-color: #f8f4ff;
        border: 2px solid #d4af37;
        padding: 20px;
        margin: 25px 0;
        text-align: center;
      }
      
      ul {
        padding-left: 20px;
      }
      
      li {
        margin-bottom: 8px;
      }
      
      .profit-impact {
        font-weight: 700;
        color: #3b0d63;
        margin-top: 15px;
      }
      
      .unsubscribe {
        color: #999;
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1><span class="gold-text">7</span> Bar Profit Secrets</h1>
        <h2>The Strategies Top-Performing Venues Don't Share</h2>
      </div>
      
      <div class="content">
        <p>Hi ${name},</p>
        
        <p>Thank you for taking the first step toward transforming ${businessName} into a more profitable and efficient operation. This guide reveals key strategies that the most successful ${venueType === 'bar' ? 'bars' : venueType === 'restaurant' ? 'restaurants' : 'venues'} implement to maximize their profits while enhancing customer experience.</p>
        
        <div class="intro-message">
          <p><strong>A special note for ${businessName}:</strong> As you read through these secrets, consider how implementing automated ordering systems could help address your specific challenges. Many of our clients in the ${venueType} space have seen dramatic improvements in both efficiency and revenue.</p>
        </div>
        
        <p>Each of these seven secrets has been tested and proven across hundreds of venues like yours. These aren't theoretical concepts—they're practical strategies that you can begin implementing immediately.</p>
        
        <!-- Secret #1 -->
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">1</div>
            <div class="secret-title">Strategic Menu Engineering & Pricing</div>
          </div>
          
          <p>The most profitable bars don't just set prices based on cost plus markup. They strategically engineer their menus to highlight high-margin items and create price anchors that guide customers toward the most profitable selections.</p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Analyze your menu using the BCG matrix (Stars, Puzzles, Plowhorses, and Dogs)</li>
            <li>Place high-margin items in the visual "sweet spots" of your menu (top right, center)</li>
            <li>Use decoy pricing to make target items appear more attractive</li>
          </ul>
          
          <p class="profit-impact">Average profit impact: 15-22% increase in profit per item</p>
        </div>
        
        <!-- Secret #2 -->
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">2</div>
            <div class="secret-title">Precision Inventory Management</div>
          </div>
          
          <p>Top-performing venues treat inventory as cash on the shelves. They implement systems that track every ounce poured and can account for 98%+ of their inventory at any time.</p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Implement digital pour monitoring systems</li>
            <li>Conduct weekly spot audits of high-value items</li>
            <li>Use the "par level" system for inventory ordering</li>
          </ul>
          
          <p class="profit-impact">Average profit impact: 4-7% reduction in pour costs</p>
        </div>
        
        <!-- Secret #3 -->
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">3</div>
            <div class="secret-title">Dynamic Labor Optimization</div>
          </div>
          
          <p>Labor costs often represent 30%+ of a venue's expenses. The most profitable establishments use data-driven systems to align staffing with demand patterns while maintaining service quality.</p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Create dynamic scheduling based on historical sales data</li>
            <li>Implement sales-per-labor-hour targets and tracking</li>
            <li>Cross-train staff to increase flexibility</li>
          </ul>
          
          <p class="profit-impact">Average profit impact: 22% reduction in labor costs</p>
        </div>
        
        <!-- Secret #4 -->
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">4</div>
            <div class="secret-title">Strategic Upselling & Cross-Selling</div>
          </div>
          
          <p>The difference between average and top-performing venues often comes down to their ability to increase the average check size through thoughtful upselling and cross-selling techniques.</p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Train staff on suggestive selling techniques that feel authentic</li>
            <li>Create strategic drink pairings for food items</li>
            <li>Implement tableside tablet ordering with visual prompts</li>
          </ul>
          
          <p class="profit-impact">Average profit impact: 15-20% increase in average check size</p>
        </div>
        
        <!-- Secret #5 -->
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">5</div>
            <div class="secret-title">Data-Driven Operational Decisions</div>
          </div>
          
          <p>The top 1% of venues make decisions based on data, not intuition. They track key performance indicators (KPIs) obsessively and adjust their strategies in real-time.</p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Implement a comprehensive POS analytics system</li>
            <li>Create daily, weekly, and monthly KPI dashboards</li>
            <li>Track performance metrics by daypart, section, and server</li>
          </ul>
          
          <p class="profit-impact">Average profit impact: 12-18% improvement in overall profit margin</p>
        </div>
        
        <!-- Secret #6 -->
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">6</div>
            <div class="secret-title">Strategic Supplier Relationships</div>
          </div>
          
          <p>While most venues focus only on getting the lowest prices from suppliers, top performers build strategic partnerships that provide value beyond just cost savings.</p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Consolidate orders with fewer suppliers for better leverage</li>
            <li>Negotiate payment terms as aggressively as pricing</li>
            <li>Join or form buying groups with other local establishments</li>
          </ul>
          
          <p class="profit-impact">Average profit impact: 8-12% reduction in COGS</p>
        </div>
        
        <!-- Secret #7 -->
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">7</div>
            <div class="secret-title">Technology Leverage</div>
          </div>
          
          <p>The most profitable venues use technology not just for efficiency but as a strategic advantage that transforms the guest experience while reducing costs.</p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Implement self-service ordering systems to reduce wait times</li>
            <li>Use AI-powered demand forecasting for inventory and staffing</li>
            <li>Deploy mobile payment solutions to turn tables faster</li>
          </ul>
          
          <p class="profit-impact">Average profit impact: 25-30% increase in operational efficiency</p>
        </div>
        
        <div class="callout">
          <p><strong>The EZ Drink AI platform</strong> helps venues implement these secrets through our comprehensive solution that includes self-service ordering, AI-powered analytics, and seamless integration with your existing systems.</p>
        </div>
        
        <h3>Next Steps: Implementing These Secrets</h3>
        
        <p>While each of these secrets can individually improve your profitability, the true power comes from implementing them together as part of a cohesive strategy.</p>
        
        <p>At EZ Drink, we've helped hundreds of venues like ${businessName} implement these exact strategies and achieve remarkable results:</p>
        
        <ul>
          <li>Average revenue increase of 25%</li>
          <li>Labor cost reduction of 22%</li>
          <li>Customer wait time reduction of 30%</li>
          <li>Staff efficiency improvement of 40%</li>
        </ul>
        
        <div class="callout">
          <p><strong>Ready to see how these strategies can work specifically for ${businessName}?</strong></p>
          <p><a href="${demoUrl}" class="button">BOOK YOUR FREE DEMO</a></p>
        </div>
        
        <p>During this consultation, our industry experts will analyze your current operations and create a custom implementation plan tailored specifically to your venue's unique needs and challenges.</p>
        
        <p>To your success,</p>
        <p>The EZ Drink Team</p>
      </div>
      
      <div class="footer">
        <p>© 2025 EZ Drink AI. All rights reserved.</p>
        <p>This guide is exclusively for ${name} at ${businessName}</p>
        <p><a href="https://www.ezdrink.us/unsubscribe?email=${encodeURIComponent(email)}" class="unsubscribe">Unsubscribe</a></p>
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
    
    // Use www version of URL as that's where requests are redirected
    const demoUrl = "https://www.ezdrink.us/demo";
    
    return `
  7 BAR PROFIT SECRETS - The Strategies Top-Performing Venues Don't Share
  
  Hi ${name},
  
  Thank you for taking the first step toward transforming ${businessName} into a more profitable and efficient operation. This guide reveals key strategies that the most successful venues implement to maximize their profits while enhancing customer experience.
  
  ----------------------
  
  SECRET #1: STRATEGIC MENU ENGINEERING & PRICING
  
  The most profitable bars don't just set prices based on cost plus markup. They strategically engineer their menus to highlight high-margin items and create price anchors that guide customers toward the most profitable selections.
  
  Key implementation strategies:
  - Analyze your menu using the BCG matrix (Stars, Puzzles, Plowhorses, and Dogs)
  - Place high-margin items in the visual "sweet spots" of your menu
  - Use decoy pricing to make target items appear more attractive
  
  Average profit impact: 15-22% increase in profit per item
  
  ----------------------
  
  SECRET #2: PRECISION INVENTORY MANAGEMENT
  
  Top-performing venues treat inventory as cash on the shelves. They implement systems that track every ounce poured and can account for 98%+ of their inventory at any time.
  
  Key implementation strategies:
  - Implement digital pour monitoring systems
  - Conduct weekly spot audits of high-value items
  - Use the "par level" system for inventory ordering
  
  Average profit impact: 4-7% reduction in pour costs
  
  ----------------------
  
  SECRET #3: DYNAMIC LABOR OPTIMIZATION
  
  Labor costs often represent 30%+ of a venue's expenses. The most profitable establishments use data-driven systems to align staffing with demand patterns while maintaining service quality.
  
  Key implementation strategies:
  - Create dynamic scheduling based on historical sales data
  - Implement sales-per-labor-hour targets and tracking
  - Cross-train staff to increase flexibility
  
  Average profit impact: 22% reduction in labor costs
  
  ----------------------
  
  SECRET #4: STRATEGIC UPSELLING & CROSS-SELLING
  
  The difference between average and top-performing venues often comes down to their ability to increase the average check size through thoughtful upselling and cross-selling techniques.
  
  Key implementation strategies:
  - Train staff on suggestive selling techniques that feel authentic
  - Create strategic drink pairings for food items
  - Implement tableside tablet ordering with visual prompts
  
  Average profit impact: 15-20% increase in average check size
  
  ----------------------
  
  SECRET #5: DATA-DRIVEN OPERATIONAL DECISIONS
  
  The top 1% of venues make decisions based on data, not intuition. They track key performance indicators (KPIs) obsessively and adjust their strategies in real-time.
  
  Key implementation strategies:
  - Implement a comprehensive POS analytics system
  - Create daily, weekly, and monthly KPI dashboards
  - Track performance metrics by daypart, section, and server
  
  Average profit impact: 12-18% improvement in overall profit margin
  
  ----------------------
  
  SECRET #6: STRATEGIC SUPPLIER RELATIONSHIPS
  
  While most venues focus only on getting the lowest prices from suppliers, top performers build strategic partnerships that provide value beyond just cost savings.
  
  Key implementation strategies:
  - Consolidate orders with fewer suppliers for better leverage
  - Negotiate payment terms as aggressively as pricing
  - Join or form buying groups with other local establishments
  
  Average profit impact: 8-12% reduction in COGS
  
  ----------------------
  
  SECRET #7: TECHNOLOGY LEVERAGE
  
  The most profitable venues use technology not just for efficiency but as a strategic advantage that transforms the guest experience while reducing costs.
  
  Key implementation strategies:
  - Implement self-service ordering systems to reduce wait times
  - Use AI-powered demand forecasting for inventory and staffing
  - Deploy mobile payment solutions to turn tables faster
  
  Average profit impact: 25-30% increase in operational efficiency
  
  ----------------------
  
  NEXT STEPS: IMPLEMENTING THESE SECRETS
  
  While each of these secrets can individually improve your profitability, the true power comes from implementing them together as part of a cohesive strategy.
  
  At EZ Drink, we've helped hundreds of venues like ${businessName} implement these exact strategies and achieve remarkable results:
  
  - Average revenue increase of 25%
  - Labor cost reduction of 22%
  - Customer wait time reduction of 30%
  - Staff efficiency improvement of 40%
  
  Ready to see how these strategies can work specifically for ${businessName}?
  
  BOOK YOUR FREE DEMO: ${demoUrl}
  
  During this consultation, our industry experts will analyze your current operations and create a custom implementation plan tailored specifically to your venue's unique needs and challenges.
  
  To your success,
  The EZ Drink Team
  
  © 2025 EZ Drink AI. All rights reserved.
  This guide is exclusively for ${name} at ${businessName}
  To unsubscribe: https://www.ezdrink.us/unsubscribe?email=${encodeURIComponent(email)}
    `;
  }
  
  // Make sure to properly export the functions
  module.exports = {
    generateProfitSecretsEmail,
    generateProfitSecretsPlainText
  };