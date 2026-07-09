// emailTemplates.js
// Contains templates for different email types

/**
 * Generates HTML content for the Cash Finder Report email
 * @param {Object} data - User and report data
 * @returns {String} HTML content for the email
 */
export const cashFinderReportTemplate = (data) => {
    const {
      userName,
      companyName,
      reportData,
    } = data;
  
    const firstName = userName.split(' ')[0];
    
    // Format currency values
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(value);
    };
  
    const formattedAverageRevenue = formatCurrency(reportData.averageRevenue);
    const formattedBestNightRevenue = formatCurrency(reportData.bestNightRevenue);
    const formattedPeakOpportunity = formatCurrency(reportData.peakOpportunity);
    const formattedInventoryOpportunity = formatCurrency(reportData.inventoryOpportunity);
    const formattedTotalOpportunity = formatCurrency(reportData.totalOpportunity);
  
    return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Cash Finder Report</title>
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
        background: linear-gradient(to right, #3a7bd5, #00d2ff);
        padding: 20px;
        color: white;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .content {
        padding: 20px;
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 0 0 5px 5px;
      }
      .section {
        margin-bottom: 25px;
      }
      .report-data {
        background-color: white;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      .data-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
      }
      .data-row:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }
      .highlight {
        color: #3a7bd5;
        font-weight: bold;
      }
      .total {
        font-size: 18px;
        font-weight: bold;
        color: #FF9900;
        margin-top: 15px;
        text-align: center;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(to right, #FF9900, #F76B1C);
        color: white;
        text-decoration: none;
        padding: 12px 25px;
        border-radius: 5px;
        font-weight: bold;
        margin-top: 15px;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        font-size: 12px;
        color: #888;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">EzDrink</div>
        <h1>Cash Finder Report for ${companyName}</h1>
      </div>
      
      <div class="content">
        <div class="section">
          <h2>Hi ${firstName},</h2>
          <p>Thank you for using our Cash Finder tool. Below is your personalized report showing the potential revenue opportunities for ${companyName}.</p>
        </div>
        
        <div class="section">
          <h3>Your Revenue Analysis</h3>
          <div class="report-data">
            <div class="data-row">
              <div>Average Night Revenue:</div>
              <div>${formattedAverageRevenue}</div>
            </div>
            <div class="data-row">
              <div>Best Night Revenue:</div>
              <div>${formattedBestNightRevenue}</div>
            </div>
            <div class="data-row">
              <div>Cases Purchased Weekly:</div>
              <div>${reportData.casesPurchased}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3>Your Opportunity Breakdown</h3>
          <div class="report-data">
            <div class="data-row">
              <div>Monthly Peak Performance Opportunity:</div>
              <div class="highlight">${formattedPeakOpportunity}</div>
            </div>
            <div class="data-row">
              <div>Monthly Inventory Optimization Opportunity:</div>
              <div class="highlight">${formattedInventoryOpportunity}</div>
            </div>
            <div class="total">
              Annual Revenue Opportunity: ${formattedTotalOpportunity}
            </div>
          </div>
        </div>
        
        <div class="section">
          <p>Based on our analysis, implementing EzDrink's systems could help ${companyName} capture up to <span class="highlight">${formattedTotalOpportunity}</span> in additional annual revenue through optimized operations and improved peak performance.</p>
          
          <p>Would you like to learn exactly how to capture this opportunity? Schedule a free strategy call with one of our bar revenue experts.</p>
          
          <div style="text-align: center;">
            <a href="https://ezdrink.com/schedule-call?source=cash-finder" class="cta-button">Schedule My Strategy Call</a>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>This report is based on the information you provided and industry averages. Individual results may vary.</p>
        <p>© 2025 EzDrink. All rights reserved.</p>
        <p><a href="https://ezdrink.com/unsubscribe">Unsubscribe</a> | <a href="https://ezdrink.com/privacy-policy">Privacy Policy</a></p>
        <p><a href="https://ezdrink.com/contact">Contact Us</a></p>
      </div>
    </div>
  </body>
  </html>`;
  };
  
  /**
   * Generates a simple text email for the Cash Finder Report
   * @param {Object} data - User and report data
   * @returns {String} Plain text content for the email
   */
  export const cashFinderReportTextTemplate = (data) => {
    const {
      userName,
      companyName,
      reportData,
    } = data;
  
    const firstName = userName.split(' ')[0];
    
    // Format currency values
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(value);
    };
  
    const formattedAverageRevenue = formatCurrency(reportData.averageRevenue);
    const formattedBestNightRevenue = formatCurrency(reportData.bestNightRevenue);
    const formattedPeakOpportunity = formatCurrency(reportData.peakOpportunity);
    const formattedInventoryOpportunity = formatCurrency(reportData.inventoryOpportunity);
    const formattedTotalOpportunity = formatCurrency(reportData.totalOpportunity);
  
    return `
  CASH FINDER REPORT FOR ${companyName.toUpperCase()}
  
  Hi ${firstName},
  
  Thank you for using our Cash Finder tool. Below is your personalized report showing the potential revenue opportunities for ${companyName}.
  
  YOUR REVENUE ANALYSIS
  ---------------------
  Average Night Revenue: ${formattedAverageRevenue}
  Best Night Revenue: ${formattedBestNightRevenue}
  Cases Purchased Weekly: ${reportData.casesPurchased}
  
  YOUR OPPORTUNITY BREAKDOWN
  -------------------------
  Monthly Peak Performance Opportunity: ${formattedPeakOpportunity}
  Monthly Inventory Optimization Opportunity: ${formattedInventoryOpportunity}
  ANNUAL REVENUE OPPORTUNITY: ${formattedTotalOpportunity}
  
  Based on our analysis, implementing EzDrink's systems could help ${companyName} capture up to ${formattedTotalOpportunity} in additional annual revenue through optimized operations and improved peak performance.
  
  Would you like to learn exactly how to capture this opportunity? Schedule a free strategy call with one of our bar revenue experts.
  
  Schedule your call here: https://ezdrink.com/schedule-call?source=cash-finder
  
  This report is based on the information you provided and industry averages. Individual results may vary.
  
  © 2025 EzDrink. All rights reserved.
  `;
  };
  
  /**
   * Generates HTML content for the Cash Finder Plus follow-up email
   * @param {Object} data - User and report data
   * @returns {String} HTML content for the email
   */
  export const cashFinderPlusTemplate = (data) => {
    const {
      firstName,
      company,
      cashFinderData
    } = data;
    
    // Format currency values
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(value);
    };
  
    // Calculate estimated cost savings (for demonstration purposes)
    const weeklyCasesPurchased = parseInt(cashFinderData.casesPurchased);
    const estimatedWaste = Math.round(weeklyCasesPurchased * 0.15); // Assume 15% waste
    const estimatedWasteCost = estimatedWaste * 80; // Assume $80 per case average cost
    const monthlyWasteCost = estimatedWasteCost * 4.3; // Monthly conversion
    const annualWasteCost = monthlyWasteCost * 12; // Annual waste cost
    
    // Calculate labor optimization (for demonstration)
    const averageRevenue = parseFloat(cashFinderData.averageRevenue);
    const laborPercentEstimate = 0.3; // Assume 30% labor cost
    const currentLaborCost = averageRevenue * laborPercentEstimate;
    const optimizedLaborPercent = 0.25; // Optimized to 25%
    const optimizedLaborCost = averageRevenue * optimizedLaborPercent;
    const laborSavingsPerNight = currentLaborCost - optimizedLaborCost;
    const monthlyLaborSavings = laborSavingsPerNight * 30; // Monthly savings
    const annualLaborSavings = monthlyLaborSavings * 12; // Annual savings
    
    // Calculate total savings
    const totalAnnualSavings = annualWasteCost + annualLaborSavings;
    
    return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Cash Finder Plus Report</title>
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
        background: linear-gradient(to right, #d4af37, #f7e98e);
        padding: 20px;
        color: #333;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .content {
        padding: 20px;
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 0 0 5px 5px;
      }
      .section {
        margin-bottom: 25px;
      }
      .gold-badge {
        display: inline-block;
        background-color: #d4af37;
        color: white;
        font-weight: bold;
        padding: 5px 10px;
        border-radius: 3px;
        margin-bottom: 10px;
      }
      .report-data {
        background-color: white;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      .data-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
      }
      .data-row:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }
      .highlight {
        color: #d4af37;
        font-weight: bold;
      }
      .total {
        font-size: 18px;
        font-weight: bold;
        color: #d4af37;
        margin-top: 15px;
        text-align: center;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(to right, #d4af37, #f7e98e);
        color: #333;
        text-decoration: none;
        padding: 12px 25px;
        border-radius: 5px;
        font-weight: bold;
        margin-top: 15px;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        font-size: 12px;
        color: #888;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">EzDrink</div>
        <h1>Cash Finder Plus Report</h1>
      </div>
      
      <div class="content">
        <div class="section">
          <div class="gold-badge">PREMIUM INSIGHTS</div>
          <h2>Hi ${firstName},</h2>
          <p>Yesterday you received your Cash Finder Report showing the potential <strong>revenue opportunities</strong> for ${company}. Today, we're excited to share your exclusive Cash Finder Plus analysis, focusing on <strong>cost-saving opportunities</strong>.</p>
        </div>
        
        <div class="section">
          <h3>Inventory Waste Analysis</h3>
          <div class="report-data">
            <div class="data-row">
              <div>Weekly Cases Purchased:</div>
              <div>${weeklyCasesPurchased}</div>
            </div>
            <div class="data-row">
              <div>Estimated Weekly Waste:</div>
              <div>${estimatedWaste} cases</div>
            </div>
            <div class="data-row">
              <div>Weekly Waste Cost:</div>
              <div class="highlight">${formatCurrency(estimatedWasteCost)}</div>
            </div>
            <div class="data-row">
              <div>Annual Waste Cost:</div>
              <div class="highlight">${formatCurrency(annualWasteCost)}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3>Labor Optimization</h3>
          <div class="report-data">
            <div class="data-row">
              <div>Current Labor Cost (est.):</div>
              <div>${formatCurrency(currentLaborCost)}/night</div>
            </div>
            <div class="data-row">
              <div>Optimized Labor Cost (est.):</div>
              <div>${formatCurrency(optimizedLaborCost)}/night</div>
            </div>
            <div class="data-row">
              <div>Labor Savings Per Night:</div>
              <div class="highlight">${formatCurrency(laborSavingsPerNight)}</div>
            </div>
            <div class="data-row">
              <div>Annual Labor Savings:</div>
              <div class="highlight">${formatCurrency(annualLaborSavings)}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="total">
            Total Annual Cost Savings: ${formatCurrency(totalAnnualSavings)}
          </div>
          
          <p>Combined with the revenue opportunity of ${formatCurrency(cashFinderData.totalOpportunity)} from your Cash Finder Report, implementing EzDrink's systems could potentially improve your bottom line by <span class="highlight">${formatCurrency(totalAnnualSavings + cashFinderData.totalOpportunity)}</span> annually.</p>
          
          <p>Ready to see how our bar management system can help you capture both these revenue and cost-saving opportunities? Our experts can create a customized implementation plan for ${company}.</p>
          
          <div style="text-align: center;">
            <a href="https://ezdrink.com/schedule-plus?source=cash-finder-plus" class="cta-button">Book My Optimization Session</a>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>This advanced analysis is based on industry averages and the information you provided. Individual results may vary.</p>
        <p>© 2025 EzDrink. All rights reserved.</p>
        <p><a href="https://ezdrink.com/unsubscribe">Unsubscribe</a> | <a href="https://ezdrink.com/privacy-policy">Privacy Policy</a></p>
        <p><a href="https://ezdrink.com/contact">Contact Us</a></p>
      </div>
    </div>
  </body>
  </html>`;
  };
  
  /**
   * Generates a simple text email for the Cash Finder Plus follow-up
   * @param {Object} data - User and report data
   * @returns {String} Plain text content for the email
   */
  export const cashFinderPlusTextTemplate = (data) => {
    const {
      firstName,
      company,
      cashFinderData
    } = data;
    
    // Format currency values
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(value);
    };
  
    // Calculate estimated cost savings (for demonstration purposes)
    const weeklyCasesPurchased = parseInt(cashFinderData.casesPurchased);
    const estimatedWaste = Math.round(weeklyCasesPurchased * 0.15); // Assume 15% waste
    const estimatedWasteCost = estimatedWaste * 80; // Assume $80 per case average cost
    const monthlyWasteCost = estimatedWasteCost * 4.3; // Monthly conversion
    const annualWasteCost = monthlyWasteCost * 12; // Annual waste cost
    
    // Calculate labor optimization (for demonstration)
    const averageRevenue = parseFloat(cashFinderData.averageRevenue);
    const laborPercentEstimate = 0.3; // Assume 30% labor cost
    const currentLaborCost = averageRevenue * laborPercentEstimate;
    const optimizedLaborPercent = 0.25; // Optimized to 25%
    const optimizedLaborCost = averageRevenue * optimizedLaborPercent;
    const laborSavingsPerNight = currentLaborCost - optimizedLaborCost;
    const monthlyLaborSavings = laborSavingsPerNight * 30; // Monthly savings
    const annualLaborSavings = monthlyLaborSavings * 12; // Annual savings
    
    // Calculate total savings
    const totalAnnualSavings = annualWasteCost + annualLaborSavings;
  
    return `
  CASH FINDER PLUS REPORT - PREMIUM INSIGHTS
  
  Hi ${firstName},
  
  Yesterday you received your Cash Finder Report showing the potential revenue opportunities for ${company}. Today, we're excited to share your exclusive Cash Finder Plus analysis, focusing on cost-saving opportunities.
  
  INVENTORY WASTE ANALYSIS
  ------------------------
  Weekly Cases Purchased: ${weeklyCasesPurchased}
  Estimated Weekly Waste: ${estimatedWaste} cases
  Weekly Waste Cost: ${formatCurrency(estimatedWasteCost)}
  Annual Waste Cost: ${formatCurrency(annualWasteCost)}
  
  LABOR OPTIMIZATION
  -----------------
  Current Labor Cost (est.): ${formatCurrency(currentLaborCost)}/night
  Optimized Labor Cost (est.): ${formatCurrency(optimizedLaborCost)}/night
  Labor Savings Per Night: ${formatCurrency(laborSavingsPerNight)}
  Annual Labor Savings: ${formatCurrency(annualLaborSavings)}
  
  TOTAL ANNUAL COST SAVINGS: ${formatCurrency(totalAnnualSavings)}
  
  Combined with the revenue opportunity of ${formatCurrency(cashFinderData.totalOpportunity)} from your Cash Finder Report, implementing EzDrink's systems could potentially improve your bottom line by ${formatCurrency(totalAnnualSavings + cashFinderData.totalOpportunity)} annually.
  
  Ready to see how our bar management system can help you capture both these revenue and cost-saving opportunities? Our experts can create a customized implementation plan for ${company}.
  
  Book your optimization session: https://ezdrink.com/schedule-plus?source=cash-finder-plus
  
  This advanced analysis is based on industry averages and the information you provided. Individual results may vary.
  
  © 2025 EzDrink. All rights reserved.
  `;
  };