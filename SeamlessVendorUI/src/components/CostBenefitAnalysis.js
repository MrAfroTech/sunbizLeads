import React, { useState, useEffect } from 'react';
import '../styles/CostBenefitAnalysis.css';

const CostBenefitAnalysis = () => {
  const [calculatorData, setCalculatorData] = useState({
    dailyCustomers: 100,
    peakHourCustomers: 60,
    averageOrderValue: 25,
    lineAbandonmentRate: 15,
    hourlyStaffCost: 15,
    currentPeakStaff: 3,
    inStoreAbandonmentRate: 12,
    loyaltyProgramValue: 50
  });

  const [calculations, setCalculations] = useState({});

  useEffect(() => {
    calculateROI();
  }, [calculatorData]);

  const calculateROI = () => {
    const {
      dailyCustomers,
      peakHourCustomers,
      averageOrderValue,
      lineAbandonmentRate,
      hourlyStaffCost,
      currentPeakStaff,
      inStoreAbandonmentRate,
      loyaltyProgramValue
    } = calculatorData;

    // Calculate lost revenue from line abandonment
    const dailyLostCustomers = Math.round(peakHourCustomers * (lineAbandonmentRate / 100));
    const dailyLostRevenue = dailyLostCustomers * averageOrderValue;
    const annualLostRevenue = dailyLostRevenue * 365;

    // Calculate in-store line abandonment
    const inStoreCustomers = dailyCustomers - peakHourCustomers;
    const dailyInStoreLostCustomers = Math.round(inStoreCustomers * (inStoreAbandonmentRate / 100));
    const dailyInStoreLostRevenue = dailyInStoreLostCustomers * averageOrderValue;
    const annualInStoreLostRevenue = dailyInStoreLostRevenue * 365;

    // Calculate labor efficiency gains
    const staffEfficiencyGain = 0.3; // 30% efficiency improvement
    const dailyLaborSavings = currentPeakStaff * hourlyStaffCost * staffEfficiencyGain;
    const annualLaborSavings = dailyLaborSavings * 365;

    // Calculate additional revenue from mobile ordering
    const mobileOrderIncrease = 0.3; // 30% increase in orders
    const additionalDailyRevenue = dailyCustomers * averageOrderValue * mobileOrderIncrease;
    const annualAdditionalRevenue = additionalDailyRevenue * 365;

    // Calculate loyalty program value
    const capturedCustomers = dailyCustomers - dailyLostCustomers - dailyInStoreLostCustomers;
    const loyaltyEnrollmentRate = 0.85; // 85% enrollment rate
    const dailyLoyaltyValue = capturedCustomers * loyaltyEnrollmentRate * (loyaltyProgramValue / 365);
    const annualLoyaltyValue = dailyLoyaltyValue * 365;

    // Calculate repeat customer increase
    const repeatCustomerIncrease = 0.4; // 40% more frequent returns
    const repeatCustomerRevenue = capturedCustomers * averageOrderValue * repeatCustomerIncrease;
    const annualRepeatCustomerRevenue = repeatCustomerRevenue * 365;

    // Calculate total benefits
    const totalAnnualBenefits = annualLostRevenue + annualInStoreLostRevenue + annualLaborSavings + annualAdditionalRevenue + annualLoyaltyValue + annualRepeatCustomerRevenue;
    const mobileOrderingCost = 2000; // Estimated annual cost
    const netAnnualBenefit = totalAnnualBenefits - mobileOrderingCost;
    const roi = ((netAnnualBenefit / mobileOrderingCost) * 100).toFixed(0);

    setCalculations({
      dailyLostCustomers,
      dailyLostRevenue,
      annualLostRevenue,
      dailyInStoreLostCustomers,
      dailyInStoreLostRevenue,
      annualInStoreLostRevenue,
      dailyLaborSavings,
      annualLaborSavings,
      additionalDailyRevenue,
      annualAdditionalRevenue,
      dailyLoyaltyValue,
      annualLoyaltyValue,
      annualRepeatCustomerRevenue,
      totalAnnualBenefits,
      mobileOrderingCost,
      netAnnualBenefit,
      roi
    });
  };

  const handleInputChange = (field, value) => {
    setCalculatorData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  return (
    <div className="cost-benefit-page">

      {/* In-Store Mobile Ordering Section */}
      <section className="pain-points-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">In-Store Mobile Ordering: Skip the Line, Keep the Customer</span>
          </h2>
          
          <div className="pain-points-grid">
            <div className="pain-point-card">
              <h3>QR Code Ordering</h3>
              <h3>Skip Lines, Capture Data</h3>
              <p>
                QR code ordering allows customers to skip lines while physically in the restaurant. 
                In-store mobile ordering captures customer data for loyalty programs and repeat business tracking.
              </p>
              <div className="cost-highlight">
                <strong>Key Benefit:</strong> Turn every in-store visit into a data capture opportunity
              </div>
            </div>
            
            <div className="pain-point-card">
              <h3>Seated Ordering</h3>
              <h3>Browse, Customize, Pay</h3>
              <p>
                Customers can browse menu, customize orders, and pay while seated - no waiting in line. 
                Perfect opportunity to enroll customers in loyalty programs during checkout process.
              </p>
              <div className="cost-highlight">
                <strong>Result:</strong> 85% higher enrollment in loyalty programs when offered during mobile checkout
              </div>
            </div>
            
            <div className="pain-point-card">
              <h3>Customer Retention</h3>
              <h3>40% More Frequent Returns</h3>
              <p>
                Restaurants using mobile ordering see significant improvements in customer retention and satisfaction. 
                In-store mobile ordering customers return 40% more frequently and spend 20% more per visit.
              </p>
              <div className="cost-highlight">
                <strong>Impact:</strong> One-time visitors become loyal repeat customers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Ordering Benefits Section */}
      <section className="data-loss-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">Mobile Ordering: Your Revenue Recovery System</span>
          </h2>
          
          <div className="data-loss-content">
            <div className="data-loss-text">
              <h3>Verified ROI Data</h3>
              <p>
                Restaurants with online ordering systems raise their takeout profits by <strong>30% higher</strong> than those without. 
                Enhanced order accuracy, convenience of remote ordering and reduced wait times achieve <strong>2x customer satisfaction</strong>.
              </p>
              
              <div className="data-points">
                <div className="data-point">
                  <div className="data-icon">💰</div>
                  <div className="data-text">
                    <strong>Immediate Revenue Impact:</strong> 30% higher takeout profits
                  </div>
                </div>
                <div className="data-point">
                  <div className="data-icon">⚡</div>
                  <div className="data-text">
                    <strong>Operational Efficiency:</strong> Staff focus on food prep, not order-taking
                  </div>
                </div>
                <div className="data-point">
                  <div className="data-icon">😊</div>
                  <div className="data-text">
                    <strong>Customer Experience:</strong> Eliminated wait times, better accuracy
                  </div>
                </div>
                <div className="data-point">
                  <div className="data-icon">📊</div>
                  <div className="data-text">
                    <strong>Data Ownership:</strong> Track preferences, build loyalty programs
                  </div>
                </div>
              </div>
              
              <div className="legal-note">
                <strong>Bottom Line:</strong> Mobile ordering isn't just convenience - it's revenue recovery and operational optimization that pays for itself.
              </div>
            </div>
            
            <div className="data-visual">
              <div className="customer-flow vertical">
                <div className="flow-step">
                  <div className="step-number">1</div>
                  <div className="step-text">Customer places mobile order in advance</div>
                </div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">
                  <div className="step-number">2</div>
                  <div className="step-text">Kitchen prepares order without rush</div>
                </div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">
                  <div className="step-number">3</div>
                  <div className="step-text">Customer picks up - no wait, perfect timing</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Pain Points Section */}
      <section className="pain-points-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">The Financial Bleeding</span>
          </h2>
          
          <div className="pain-points-grid">
            <div className="pain-point-card">
              <h3>Wait Time Crisis: </h3>
              <h3>Lost Revenue Every Minute</h3>
              <p>
                <strong>66% of food trucks</strong> have adopted mobile ordering systems to improve user experience and reduce wait times. 
                Customer frustration from long wait times leads to negative reviews and reduced repeat business.
              </p>
              <div className="cost-highlight">
                <strong>Real Impact:</strong> Every minute of wait time = lost customers
              </div>
            </div>
            
            <div className="pain-point-card">
              <h3>Line Abandonment</h3>
              <h3>10-25% Lost During Peak Hours</h3>
              <p>
                Every customer who walks away due to long lines = <strong>lost immediate sale + lost lifetime value</strong>. 
                Peak hour bottlenecks create maximum revenue loss during highest opportunity periods.
              </p>
              <div className="cost-highlight">
                <strong>Hidden Cost:</strong> 10-25% of customers abandon during peak hours
              </div>
            </div>
            
            <div className="pain-point-card">
              <h3>Staff Overwhelm</h3>
              <h3>Quality Suffers</h3>
              <p>
                Staff overwhelmed with order-taking can't focus on food quality and service. 
                Phone interruptions during busy periods create chaos and reduce efficiency.
              </p>
              <div className="cost-highlight">
                <strong>Result:</strong> Poor service quality = lost repeat business
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Calculator Section */}
      <section className="brand-damage-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">Calculate Your ROI</span>
          </h2>
          
          <div className="calculator-container">
            <div className="calculator-inputs">
              <h3>Your Restaurant Data</h3>
              <div className="input-grid">
                <div className="input-group">
                  <label>Daily Customer Count (Peak Hours)</label>
                  <input
                    type="number"
                    value={calculatorData.peakHourCustomers}
                    onChange={(e) => handleInputChange('peakHourCustomers', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Average Order Value ($)</label>
                  <input
                    type="number"
                    value={calculatorData.averageOrderValue}
                    onChange={(e) => handleInputChange('averageOrderValue', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Line Abandonment Rate (%)</label>
                  <input
                    type="number"
                    value={calculatorData.lineAbandonmentRate}
                    onChange={(e) => handleInputChange('lineAbandonmentRate', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Peak Hour Staff Count</label>
                  <input
                    type="number"
                    value={calculatorData.currentPeakStaff}
                    onChange={(e) => handleInputChange('currentPeakStaff', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Hourly Staff Cost ($)</label>
                  <input
                    type="number"
                    value={calculatorData.hourlyStaffCost}
                    onChange={(e) => handleInputChange('hourlyStaffCost', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>In-store customers who abandon due to lines (%)</label>
                  <input
                    type="number"
                    value={calculatorData.inStoreAbandonmentRate}
                    onChange={(e) => handleInputChange('inStoreAbandonmentRate', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Average loyalty program value per customer ($)</label>
                  <input
                    type="number"
                    value={calculatorData.loyaltyProgramValue}
                    onChange={(e) => handleInputChange('loyaltyProgramValue', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="calculator-results">
              <h3>Your ROI Analysis Results</h3>
              
              <div className="results-grid">
                <div className="result-item">
                  <div className="result-icon">💰</div>
                  <div className="result-info">
                    <div className="result-label">Daily Lost Revenue</div>
                    <div className="result-value">${calculations.dailyLostRevenue?.toLocaleString() || 0}</div>
                    <div className="result-detail">{calculations.dailyLostCustomers || 0} customers lost daily</div>
                  </div>
                </div>
                
                <div className="result-item">
                  <div className="result-icon">📈</div>
                  <div className="result-info">
                    <div className="result-label">Annual Lost Revenue</div>
                    <div className="result-value">${calculations.annualLostRevenue?.toLocaleString() || 0}</div>
                    <div className="result-detail">From line abandonment alone</div>
                  </div>
                </div>
                
                <div className="result-item">
                  <div className="result-icon">⚡</div>
                  <div className="result-info">
                    <div className="result-label">Labor Savings</div>
                    <div className="result-value">${calculations.annualLaborSavings?.toLocaleString() || 0}</div>
                    <div className="result-detail">Annual efficiency gains</div>
                  </div>
                </div>
                
                <div className="result-item">
                  <div className="result-icon">🚀</div>
                  <div className="result-info">
                    <div className="result-label">Additional Revenue</div>
                    <div className="result-value">${calculations.annualAdditionalRevenue?.toLocaleString() || 0}</div>
                    <div className="result-detail">From mobile ordering increase</div>
                  </div>
                </div>
                
                <div className="result-item">
                  <div className="result-icon">📱</div>
                  <div className="result-info">
                    <div className="result-label">In-Store Revenue Recovered</div>
                    <div className="result-value">${calculations.annualInStoreLostRevenue?.toLocaleString() || 0}</div>
                    <div className="result-detail">From in-store line abandonment</div>
                  </div>
                </div>
                
                <div className="result-item">
                  <div className="result-icon">💎</div>
                  <div className="result-info">
                    <div className="result-label">Loyalty Program Value</div>
                    <div className="result-value">${calculations.annualLoyaltyValue?.toLocaleString() || 0}</div>
                    <div className="result-detail">From captured customer data</div>
                  </div>
                </div>
                
                <div className="result-item">
                  <div className="result-icon">🔄</div>
                  <div className="result-info">
                    <div className="result-label">Repeat Customer Revenue</div>
                    <div className="result-value">${calculations.annualRepeatCustomerRevenue?.toLocaleString() || 0}</div>
                    <div className="result-detail">40% more frequent returns</div>
                  </div>
                </div>
                
                <div className="result-item total">
                  <div className="result-icon">🎯</div>
                  <div className="result-info">
                    <div className="result-label">Total Annual Benefit</div>
                    <div className="result-value">${calculations.totalAnnualBenefits?.toLocaleString() || 0}</div>
                    <div className="result-detail">ROI: {calculations.roi || 0}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="solution-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">Take Back Control</span>
          </h2>
          
          <div className="solution-content">
            <div className="solution-text">
              <h3>Mobile Ordering: Essential Infrastructure, Not Optional Technology</h3>
              <p>
                Turn every in-store visit into a data capture opportunity. When customers skip your line using mobile ordering, 
                you capture their contact info, preferences, and can automatically enroll them in rewards programs - 
                turning one-time visitors into loyal repeat customers.
              </p>
              
              <div className="solution-benefits">
                <div className="benefit-item">
                  <div className="benefit-icon">🎯</div>
                  <div className="benefit-text">
                    <strong>Skip the line, keep the customer:</strong> QR code ordering eliminates wait times
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">📊</div>
                  <div className="benefit-text">
                    <strong>Capture every customer:</strong> 85% higher loyalty program enrollment
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🔄</div>
                  <div className="benefit-text">
                    <strong>Build repeat business:</strong> 40% more frequent returns, 20% higher spend
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">💎</div>
                  <div className="benefit-text">
                    <strong>Data-driven growth:</strong> Turn one-time visitors into loyal customers
                  </div>
                </div>
              </div>
            </div>
            
            <div className="solution-visual">
              <div className="customer-flow">
                <div className="flow-step">
                  <div className="step-number">1</div>
                  <div className="step-text">Customer arrives at restaurant</div>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="step-number">2</div>
                  <div className="step-text">Scans QR code at table</div>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="step-number">3</div>
                  <div className="step-text">Orders on phone, skips line</div>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="step-number">4</div>
                  <div className="step-text">Gets food, enrolled in rewards</div>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="step-number">5</div>
                  <div className="step-text">Returns 40% more often</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="cta-section">
            <h3>Stop Losing Money to Wait Times & Line Abandonment</h3>
            <p>
              Every day you wait is another day of lost revenue and lost customers. 
              Take control of your business with mobile ordering that actually works.
            </p>
            <div className="cta-buttons">
              <button className="primary-button large">
                Schedule a Demo
              </button>
              <button className="secondary-button large">
                See Implementation Plan
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CostBenefitAnalysis;
