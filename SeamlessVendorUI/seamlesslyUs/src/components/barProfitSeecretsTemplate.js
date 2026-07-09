// services/barProfitSecretsTemplate.js
const generateBarProfitSecretsHTML = (userData) => {
    const { name = 'Bar Owner', businessName = 'Your Bar', venueType = 'bar' } = userData;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>7 Bar Profit Secrets The Top 1% Don't Share</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
        
        body {
          font-family: 'Montserrat', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          line-height: 1.6;
        }
        
        .page {
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .cover {
          background: linear-gradient(135deg, #22074e 0%, #3b0d63 100%);
          color: white;
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 60px 20px;
        }
        
        .gold-text {
          color: #d4af37;
        }
        
        h1 {
          font-size: 42px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        
        h2 {
          font-size: 24px;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 30px;
        }
        
        h3 {
          font-size: 28px;
          color: #3b0d63;
          border-bottom: 2px solid #d4af37;
          padding-bottom: 10px;
        }
        
        .cover-subtitle {
          max-width: 500px;
          margin: 0 auto 50px;
          font-size: 18px;
          opacity: 0.9;
        }
        
        .cover-footer {
          margin-top: 60px;
          font-size: 14px;
          opacity: 0.7;
        }
        
        .intro {
          padding: 40px;
          font-size: 16px;
        }
        
        .custom-message {
          background-color: #f8f4ff;
          border-left: 4px solid #3b0d63;
          padding: 20px;
          margin: 20px 0;
        }
        
        .secret {
          margin-bottom: 40px;
        }
        
        .secret-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .secret-number {
          background: linear-gradient(135deg, #d4af37 0%, #f2c94c 100%);
          color: #22074e;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 24px;
          margin-right: 20px;
          flex-shrink: 0;
        }
        
        .secret-title {
          font-size: 22px;
          color: #3b0d63;
          font-weight: 600;
        }
        
        .callout {
          background-color: #f8f4ff;
          border: 2px solid #d4af37;
          padding: 20px;
          margin: 30px 0;
          text-align: center;
        }
        
        .footer {
          text-align: center;
          font-size: 12px;
          margin-top: 50px;
          color: #666;
          padding: 20px;
        }
        
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #d4af37 0%, #f2c94c 100%);
          color: #22074e;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 5px;
          font-weight: 700;
          margin: 20px 0;
          text-align: center;
        }
        
        @media (max-width: 768px) {
          .page {
            padding: 20px;
          }
          
          h1 {
            font-size: 32px;
          }
          
          h2 {
            font-size: 20px;
          }
          
          h3 {
            font-size: 24px;
          }
          
          .secret-title {
            font-size: 18px;
          }
        }
      </style>
    </head>
    <body>
      <!-- Cover Section -->
      <div class="cover">
        <h1><span class="gold-text">7</span> Bar Profit Secrets</h1>
        <h2>The Strategies Top-Performing Venues Don't Share</h2>
        <p class="cover-subtitle">
          Discover how the top 1% of bars and restaurants maintain consistently high profits regardless of market conditions
        </p>
        <p class="cover-footer">Presented by EZ Drink AI - www.ezdrink.us</p>
      </div>
      
      <!-- Introduction Section -->
      <div class="page intro">
        <h3>Introduction</h3>
        <p>Dear ${name},</p>
        <p>
          Thank you for taking the first step toward transforming ${businessName} into a more profitable and efficient operation. 
          This guide reveals key strategies that the most successful ${venueType === 'bar' ? 'bars' : venueType === 'restaurant' ? 'restaurants' : 'venues'} 
          implement to maximize their profits while enhancing customer experience.
        </p>
        
        <div class="custom-message">
          <p>
            <strong>A special note for ${businessName}:</strong> As you read through these secrets, consider how implementing 
            automated ordering systems could help address your specific challenges. Many of our clients in the 
            ${venueType} space have seen dramatic improvements in both efficiency and revenue.
          </p>
        </div>
        
        <p>
          Each of these seven secrets has been tested and proven across hundreds of venues like yours. 
          These aren't theoretical concepts—they're practical strategies that you can begin implementing immediately.
        </p>
        
        <p>Let's dive in.</p>
      </div>
      
      <!-- Secret #1 -->
      <div class="page">
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">1</div>
            <div class="secret-title">Strategic Menu Engineering & Pricing</div>
          </div>
          
          <p>
            The most profitable bars don't just set prices based on cost plus markup. They strategically 
            engineer their menus to highlight high-margin items and create price anchors that guide customers 
            toward the most profitable selections.
          </p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Analyze your menu using the BCG matrix (Stars, Puzzles, Plowhorses, and Dogs)</li>
            <li>Place high-margin items in the visual "sweet spots" of your menu (top right, center)</li>
            <li>Use decoy pricing to make target items appear more attractive</li>
            <li>Implement seasonal pricing strategies during peak periods</li>
            <li>Remove dollar signs from prices to reduce price sensitivity</li>
          </ul>
          
          <p>
            <strong>Average profit impact: 15-22% increase in profit per item</strong>
          </p>
        </div>
      </div>
      
      <!-- Secret #2 -->
      <div class="page">
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">2</div>
            <div class="secret-title">Precision Inventory Management</div>
          </div>
          
          <p>
            Top-performing venues treat inventory as cash on the shelves. They implement systems that track 
            every ounce poured and can account for 98%+ of their inventory at any time.
          </p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Implement digital pour monitoring systems</li>
            <li>Conduct weekly spot audits of high-value items</li>
            <li>Use the "par level" system for inventory ordering</li>
            <li>Train staff on proper portioning and measurement</li>
            <li>Track variance between theoretical and actual usage</li>
          </ul>
          
          <p>
            <strong>Average profit impact: 4-7% reduction in pour costs</strong>
          </p>
        </div>
      </div>
      
      <!-- Secret #3 -->
      <div class="page">
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">3</div>
            <div class="secret-title">Dynamic Labor Optimization</div>
          </div>
          
          <p>
            Labor costs often represent 30%+ of a venue's expenses. The most profitable establishments 
            use data-driven systems to align staffing with demand patterns while maintaining service quality.
          </p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Create dynamic scheduling based on historical sales data</li>
            <li>Implement sales-per-labor-hour targets and tracking</li>
            <li>Cross-train staff to increase flexibility</li>
            <li>Use technology to reduce labor-intensive processes</li>
            <li>Restructure service models during different dayparts</li>
          </ul>
          
          <p>
            <strong>Average profit impact: 22% reduction in labor costs</strong>
          </p>
        </div>
      </div>
      
      <!-- Secret #4 -->
      <div class="page">
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">4</div>
            <div class="secret-title">Strategic Upselling & Cross-Selling</div>
          </div>
          
          <p>
            The difference between average and top-performing venues often comes down to their ability 
            to increase the average check size through thoughtful upselling and cross-selling techniques.
          </p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Train staff on suggestive selling techniques that feel authentic</li>
            <li>Create strategic drink pairings for food items</li>
            <li>Implement tableside tablet ordering with visual prompts</li>
            <li>Design combo offers with higher margins than individual items</li>
            <li>Use the "Rule of Three" when presenting options</li>
          </ul>
          
          <p>
            <strong>Average profit impact: 15-20% increase in average check size</strong>
          </p>
        </div>
      </div>
      
      <!-- Secret #5 -->
      <div class="page">
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">5</div>
            <div class="secret-title">Data-Driven Operational Decisions</div>
          </div>
          
          <p>
            The top 1% of venues make decisions based on data, not intuition. They track key performance 
            indicators (KPIs) obsessively and adjust their strategies in real-time.
          </p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Implement a comprehensive POS analytics system</li>
            <li>Create daily, weekly, and monthly KPI dashboards</li>
            <li>Track performance metrics by daypart, section, and server</li>
            <li>Monitor ticket times and correlation with customer satisfaction</li>
            <li>Use A/B testing for menu items, pricing, and promotions</li>
          </ul>
          
          <p>
            <strong>Average profit impact: 12-18% improvement in overall profit margin</strong>
          </p>
        </div>
      </div>
      
      <!-- Secret #6 -->
      <div class="page">
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">6</div>
            <div class="secret-title">Strategic Supplier Relationships</div>
          </div>
          
          <p>
            While most venues focus only on getting the lowest prices from suppliers, top performers build strategic 
            partnerships that provide value beyond just cost savings.
          </p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Consolidate orders with fewer suppliers for better leverage</li>
            <li>Negotiate payment terms as aggressively as pricing</li>
            <li>Join or form buying groups with other local establishments</li>
            <li>Secure marketing support and promotional funding</li>
            <li>Develop custom products with key suppliers</li>
          </ul>
          
          <p>
            <strong>Average profit impact: 8-12% reduction in COGS</strong>
          </p>
        </div>
      </div>
      
      <!-- Secret #7 -->
      <div class="page">
        <div class="secret">
          <div class="secret-header">
            <div class="secret-number">7</div>
            <div class="secret-title">Technology Leverage</div>
          </div>
          
          <p>
            The most profitable venues use technology not just for efficiency but as a strategic advantage that 
            transforms the guest experience while reducing costs.
          </p>
          
          <p><strong>Key implementation strategies:</strong></p>
          <ul>
            <li>Implement self-service ordering systems to reduce wait times</li>
            <li>Use AI-powered demand forecasting for inventory and staffing</li>
            <li>Deploy mobile payment solutions to turn tables faster</li>
            <li>Implement customer recognition systems for personalized service</li>
            <li>Leverage digital marketing automation for customer retention</li>
          </ul>
          
          <p>
            <strong>Average profit impact: 25-30% increase in operational efficiency</strong>
          </p>
          
          <div class="callout">
            <p>
              <strong>The EZ Drink AI platform</strong> helps venues implement Secret #7 through our 
              comprehensive solution that includes self-service ordering, AI-powered analytics, and 
              seamless integration with your existing systems.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Conclusion Section -->
      <div class="page">
        <h3>Next Steps: Implementing These Secrets</h3>
        
        <p>
          While each of these secrets can individually improve your profitability, the true power comes 
          from implementing them together as part of a cohesive strategy.
        </p>
        
        <p>
          At EZ Drink, we've helped hundreds of venues like ${businessName} implement these exact strategies 
          and achieve remarkable results:
        </p>
        
        <ul>
          <li>Average revenue increase of 25%</li>
          <li>Labor cost reduction of 22%</li>
          <li>Customer wait time reduction of 30%</li>
          <li>Staff efficiency improvement of 40%</li>
        </ul>
        
        <div class="callout">
          <p>
            <strong>Ready to see how these strategies can work specifically for ${businessName}?</strong>
          </p>
          <p>
            <a href="https://www.ezdrink.us/demo" class="cta-button">BOOK YOUR FREE DEMO</a>
          </p>
        </div>
        
        <p>
          During this consultation, our industry experts will analyze your current operations and create 
          a custom implementation plan tailored specifically to your venue's unique needs and challenges.
        </p>
        
        <div class="footer">
          <p>© 2025 EZ Drink AI. All rights reserved.</p>
          <p>This guide is exclusively for ${name} at ${businessName}</p>
        </div>
      </div>
    </body>
    </html>
    `;
  };
  
  module.exports = {
    generateBarProfitSecretsPDF: generateBarProfitSecretsHTML // Keep the same function name for compatibility
  };