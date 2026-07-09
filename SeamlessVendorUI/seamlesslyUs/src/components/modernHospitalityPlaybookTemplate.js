// services/modernHospitalityPlaybookTemplate.js
const generateModernHospitalityPlaybookHTML = () => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>The Modern Hospitality Playbook</title>
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
        margin-top: 40px;
        margin-bottom: 20px;
      }
      
      .cover-subtitle {
        max-width: 600px;
        margin: 0 auto 50px;
        font-size: 18px;
        opacity: 0.9;
        line-height: 1.8;
      }
      
      .cover-footer {
        margin-top: 60px;
        font-size: 14px;
        opacity: 0.7;
      }
      
      .step {
        margin-bottom: 50px;
        page-break-inside: avoid;
      }
      
      .step-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .step-number {
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
      
      .step-title {
        font-size: 22px;
        color: #3b0d63;
        font-weight: 600;
      }
      
      .step-body {
        font-size: 16px;
        margin-bottom: 20px;
        line-height: 1.8;
      }
      
      .step-subheading {
        font-size: 18px;
        color: #3b0d63;
        font-weight: 600;
        margin-top: 20px;
        margin-bottom: 15px;
      }
      
      ul {
        margin: 15px 0;
        padding-left: 25px;
      }
      
      li {
        margin-bottom: 10px;
        line-height: 1.7;
      }
      
      .insight-callout {
        background-color: #f8f4ff;
        border-left: 4px solid #d4af37;
        border-right: 2px solid #d4af37;
        padding: 20px;
        margin: 30px 0;
        font-style: italic;
        font-size: 18px;
        color: #3b0d63;
        font-weight: 600;
        text-align: center;
      }
      
      .divider {
        text-align: center;
        margin: 40px 0;
        color: #d4af37;
        font-size: 24px;
        letter-spacing: 5px;
      }
      
      .footer {
        text-align: center;
        font-size: 12px;
        margin-top: 50px;
        color: #666;
        padding: 20px;
        border-top: 1px solid #ddd;
      }
      
      @media print {
        .page {
          page-break-after: always;
        }
        
        .step {
          page-break-inside: avoid;
        }
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
        
        .step-title {
          font-size: 18px;
        }
      }
    </style>
  </head>
  <body>
    <!-- Cover Section -->
    <div class="cover">
      <h1>The Modern Hospitality Playbook</h1>
      <h2>7 Steps Cutting-Edge Venues Use to Compete in the 21st Century</h2>
      <p class="cover-subtitle">
        A practical guide for venues, vendors, and operators who want higher revenue, lower stress, and better guest experiences—without adding complexity.
      </p>
      <p class="cover-footer">Presented by Seamlessly - www.seamless.us</p>
    </div>
    
    <!-- Step 1 -->
    <div class="page">
      <div class="step">
        <div class="step-header">
          <div class="step-number">1</div>
          <div class="step-title">Treat Wait Time as a Revenue Metric</div>
        </div>
        
        <p class="step-body">
          Modern venues don't see lines as a "staffing issue."<br>
          They treat wait time as a core KPI.
        </p>
        
        <ul>
          <li>Guests begin abandoning purchases after 5–10 minutes</li>
          <li>Long lines reduce spend, satisfaction, and repeat visits</li>
          <li>Top venues design systems to keep waits under 6 minutes</li>
        </ul>
        
        <div class="insight-callout">
          "If guests are waiting, revenue is leaking."
        </div>
      </div>
    </div>
    
    <!-- Step 2 -->
    <div class="page">
      <div class="step">
        <div class="step-header">
          <div class="step-number">2</div>
          <div class="step-title">Design for Peak Demand, Not Average Demand</div>
        </div>
        
        <p class="step-body">
          Most venues operate for the "normal" hour and break during rushes.
        </p>
        
        <p class="step-subheading">Cutting-edge operators:</p>
        
        <ul>
          <li>Design workflows specifically for peak volume</li>
          <li>Shift ordering and payment away from bottlenecks</li>
          <li>Reduce cognitive load on staff during high-stress moments</li>
        </ul>
        
        <div class="insight-callout">
          "Service quality doesn't fail randomly—it fails under load."
        </div>
      </div>
    </div>
    
    <!-- Step 3 -->
    <div class="page">
      <div class="step">
        <div class="step-header">
          <div class="step-number">3</div>
          <div class="step-title">Reduce Staff Stress Before Hiring More Staff</div>
        </div>
        
        <p class="step-body">
          Hiring faster doesn't fix broken systems.
        </p>
        
        <p class="step-subheading">High-performing venues:</p>
        
        <ul>
          <li>Remove repetitive tasks from staff workflows</li>
          <li>Eliminate manual order relay and payment handling</li>
          <li>Create calmer, more predictable shifts</li>
        </ul>
        
        <div class="insight-callout">
          "Lower stress increases tenure, consistency, and service quality."
        </div>
      </div>
    </div>
    
    <!-- Step 4 -->
    <div class="page">
      <div class="step">
        <div class="step-header">
          <div class="step-number">4</div>
          <div class="step-title">Eliminate Fragmented Guest Experiences</div>
        </div>
        
        <p class="step-body">
          Guests don't think in "systems."<br>
          They think in experiences.
        </p>
        
        <p class="step-subheading">Modern venues:</p>
        
        <ul>
          <li>Connect entry, ordering, payment, fulfillment, and follow-up</li>
          <li>Avoid forcing guests across multiple apps or platforms</li>
          <li>Maintain continuity from arrival to exit</li>
        </ul>
        
        <div class="insight-callout">
          "Fragmentation kills engagement—even when each tool works 'fine.'"
        </div>
      </div>
    </div>
    
    <!-- Step 5 -->
    <div class="page">
      <div class="step">
        <div class="step-header">
          <div class="step-number">5</div>
          <div class="step-title">Take Back Control of Customer Data</div>
        </div>
        
        <p class="step-body">
          Third-party platforms optimize for their margins, not yours.
        </p>
        
        <p class="step-subheading">Advanced operators:</p>
        
        <ul>
          <li>Own first-party customer relationships</li>
          <li>Track preferences, behavior, and frequency</li>
          <li>Use data to improve retention and spend per guest</li>
        </ul>
        
        <div class="insight-callout">
          "Data ownership compounds value over time."
        </div>
      </div>
    </div>
    
    <!-- Step 6 -->
    <div class="page">
      <div class="step">
        <div class="step-header">
          <div class="step-number">6</div>
          <div class="step-title">Forecast Revenue, Inventory, and Staffing Together</div>
        </div>
        
        <p class="step-body">
          Most venues forecast in silos—if they forecast at all.
        </p>
        
        <p class="step-subheading">Leaders:</p>
        
        <ul>
          <li>Use demand signals to align inventory and labor</li>
          <li>Reduce out-of-stock moments and overstaffing</li>
          <li>Make decisions proactively, not reactively</li>
        </ul>
        
        <div class="insight-callout">
          "Predictability is profit."
        </div>
      </div>
    </div>
    
    <!-- Step 7 -->
    <div class="page">
      <div class="step">
        <div class="step-header">
          <div class="step-number">7</div>
          <div class="step-title">Build Systems That Get Better as You Grow</div>
        </div>
        
        <p class="step-body">
          The best venues don't just scale locations—they scale intelligence.
        </p>
        
        <p class="step-subheading">They:</p>
        
        <ul>
          <li>Learn from guest behavior across nights, events, and seasons</li>
          <li>Improve performance through network effects</li>
          <li>Create experiences that feel personal, even at scale</li>
        </ul>
        
        <div class="insight-callout">
          "Growth should simplify operations, not complicate them."
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="page">
      <div class="footer">
        <p>© 2025 Seamlessly. All rights reserved.</p>
        <p>www.seamless.us</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

// CommonJS export (works with both require and import)
module.exports = {
  generateModernHospitalityPlaybookHTML
};
