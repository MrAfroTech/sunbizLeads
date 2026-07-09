import React, { useState } from 'react';
import '../styles/WebinarLanding.css';
import RegistrationForm from './RegistrationForm';
import FAQSection from './FAQSection';
import EmbeddedBenefitsSlides from './EmbeddedBenefitsSlides';

const WebinarLanding = () => {
  const [showRegistration, setShowRegistration] = useState(false);

  const handleRegisterClick = () => {
    setShowRegistration(true);
  };

  return (
    <div className="webinar-landing-page">
      {/* Hero Section */}
      <section className="webinar-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              The 12-Minute "From Fee Trap to Freedom" Webinar
            </h1>
            <p className="hero-subtitle">
              What's costing you more: DoorDash's 30% fees or losing customers forever because you don't own their data? 
              And what if I told you there's a way to escape both traps while handling 3x more orders with LESS stress?
            </p>
            <div className="hero-cta">
              <button className="primary-button large" onClick={handleRegisterClick}>
                Reserve Your Spot Now
              </button>
              <p className="cta-note">Free • 12 Minutes • Instant Access</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Point 1: The Fee Trap & Data Prison */}
      <section className="pain-point-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">The Fee Trap & Data Prison</span>
          </h2>
          <div className="pain-point-content">
            <h3>The Brutal Math:</h3>
            <ul className="reality-list">
              <li>DoorDash/Uber: 30% fees</li>
              <li>You make $1,000 → They take $300</li>
              <li><strong>You:</strong> "But at least I get customers, right?"</li>
              <li><strong>Reality:</strong> Those aren't YOUR customers - they're DoorDash's</li>
            </ul>
            
            <div className="gut-punch">
              <h4>The Gut Punch:</h4>
              <p>
                "Every DoorDash customer you serve is a stranger FOREVER because you can't contact them again. 
                You paid 30% to rent a customer for one transaction."
              </p>
            </div>

            <div className="cycle-dependence">
              <h4>The Cycle of Dependence:</h4>
              <ul className="reality-list">
                <li>Get customer through DoorDash → Pay 30% fee</li>
                <li>Customer loves your food → Can't reach them directly</li>
                <li>Want them back? → Pay another 30% fee</li>
                <li><strong>Result:</strong> You're renting customers, not owning them</li>
              </ul>
            </div>

            <div className="hardest-sale">
              <h4>The Hardest Sale:</h4>
              <p>
                "The hardest customer to get is one you've never sold to before. But every DoorDash customer 
                stays a stranger because you never actually meet them."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Point 2: The Success Paradox */}
      <section className="pain-point-section chaos-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">The Success Paradox</span>
          </h2>
          <div className="pain-point-content">
            <h3>The Vendor's Dilemma:</h3>
            <p className="dilemma-text">
              "You want more customers... but when you get them, you panic."
            </p>
            
            <div className="overwhelm-reality">
              <h4>The Overwhelm Reality:</h4>
              <ul className="reality-list">
                <li>Orders flooding in faster than you can handle</li>
                <li>Customers getting angry about wait times</li>
                <li>Kitchen staff stressed and making mistakes</li>
                <li><strong>"I can't handle any more business!"</strong> - Every successful vendor's nightmare</li>
              </ul>
            </div>

            <div className="when-orders-attack">
              <h4>When Orders Attack:</h4>
              <ul className="chaos-list">
                <li>15 orders come in at once during lunch rush</li>
                <li>No idea which order is next</li>
                <li>Customers asking "Where's my food?" every 30 seconds</li>
                <li>Staff fighting over who does what</li>
                <li><strong>Burnt food because you're rushing</strong></li>
              </ul>
            </div>

            <div className="fear-section">
              <h4>The Fear:</h4>
              <p>
                "What if I get TOO busy and ruin my reputation? Success became scarier than failure 
                because you can't manage the chaos."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Point 3: The Raving Fan Problem */}
      <section className="pain-point-section communication-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">The Raving Fan Problem</span>
          </h2>
          <div className="pain-point-content">
            <h3>The Question:</h3>
            <p className="dilemma-text">
              "How do you create raving fans when you never actually meet your customers?"
            </p>

            <div className="communication-black-hole">
              <h4>The Communication Black Hole:</h4>
              <div className="conversation-example">
                <p><strong>Customer:</strong> "How much longer?"</p>
                <p><strong>You:</strong> "Uhh... soon?" (while internally screaming)</p>
                <p><strong>Customer:</strong> "You said that 10 minutes ago!"</p>
              </div>
              <ul className="reality-list">
                <li>No direct communication possible</li>
                <li>No loyalty programs</li>
                <li>No personal connection</li>
                <li><strong>Your best customer could be ordering from your competitor tomorrow and you'd never know</strong></li>
              </ul>
            </div>

            <div className="snowball-effect">
              <h4>The Snowball Effect:</h4>
              <ul>
                <li>Unclear timing creates anxiety</li>
                <li>Anxious customers ask more questions</li>
                <li>More questions interrupt workflow</li>
                <li>Interrupted workflow = longer delays</li>
                <li><strong>The spiral of doom begins</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution: Multi-Vendor Revolution */}
      <section className="solution-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">The Multi-Vendor Revolution</span>
          </h2>
          <div className="solution-content">
            <h3>What if customers could order from 3 different vendors in ONE transaction - and you got a piece of ALL three orders?</h3>
            
            <div className="current-reality">
              <h4>The Current Reality:</h4>
              <ul className="reality-list">
                <li>Customer wants tacos AND ice cream AND coffee</li>
                <li>Has to make 3 separate orders, 3 different payments, 3 different wait times</li>
                <li><strong>50% abandon after the first purchase</strong> (too much hassle)</li>
              </ul>
            </div>

            <div className="seamless-way">
              <h4>The SeamlessMarketplace Way:</h4>
              <p className="solution-intro">
                "Customers open ONE app, see ALL vendors at the event, order from multiple vendors in ONE transaction."
              </p>
            </div>

            <div className="new-revenue-stream">
              <h4>Your New Revenue Stream:</h4>
              <ul className="reality-list">
                <li><strong>Customer's total order:</strong> $60 across 3 vendors</li>
                <li><strong>Your tacos:</strong> $25 (your full profit)</li>
                <li><strong>Your share of ice cream:</strong> $1.50 (5% of their $30 order)</li>
                <li><strong>Your share of coffee:</strong> $0.75 (5% of their $15 order)</li>
                <li><strong>Your total from this customer:</strong> $27.25 instead of just $25</li>
                <li><strong>Plus you OWN their contact info forever</strong></li>
              </ul>
            </div>

            <div className="strategic-alliance">
              <h4>The Strategic Alliance:</h4>
              <p>
                "Every vendor in the network becomes your business partner. When they succeed, you succeed. 
                When you succeed, they succeed. It's not splitting a pie - it's making the whole pie bigger for everyone."
              </p>
            </div>

            <div className="synergy-effect">
              <h4>The Synergy Effect:</h4>
              <p>
                "This isn't about taking from each other - it's about creating MORE together. A customer who only 
                wanted tacos now gets tacos + ice cream + coffee. The total spend goes from $25 to $60. Everyone wins bigger."
              </p>
            </div>

            <div className="strategic-alliance-thinking">
              <h4>Strategic Alliance Thinking:</h4>
              <ul className="reality-list">
                <li><strong>More vendors = More variety = Higher customer satisfaction</strong></li>
                <li><strong>Higher satisfaction = More repeat customers for EVERYONE</strong></li>
                <li><strong>More customers = More orders = More commissions for ALL</strong></li>
                <li><strong>It's not competition - it's collaboration that compounds</strong></li>
              </ul>
            </div>

            <div className="smart-queuing-magic">
              <h4>Smart Order Queuing Magic:</h4>
              <div className="steps-grid">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h5>Order comes in</h5>
                    <p>System calculates prep time based on your current queue</p>
                  </div>
                </div>
                <div className="step-card">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h5>Customer gets text</h5>
                    <p>"Your tacos will be ready at 12:22 PM (8 minutes), ice cream at 12:25 PM"</p>
                  </div>
                </div>
                <div className="step-card">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h5>Kitchen gets organized list</h5>
                    <p>Clear priorities, no confusion</p>
                  </div>
                </div>
                <div className="step-card">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h5>Automatic updates</h5>
                    <p>"Your order is being prepared... almost ready... ready for pickup!"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* From Chaos to Cash Machine */}
      <section className="revenue-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">From Chaos to Cash Machine</span>
          </h2>
          <div className="revenue-comparison">
            <div className="before-after">
              <div className="before">
                <h3>Current State (DoorDash model):</h3>
                <ul>
                  <li>$1,000 daily sales</li>
                  <li>-$300 in fees (30%)</li>
                  <li>= $700 profit</li>
                  <li><strong>Customer lifetime value: $0</strong> (you can't reach them)</li>
                  <li>Handle 50 orders max before chaos</li>
                </ul>
              </div>
              <div className="after">
                <h3>SeamlessMarketplace:</h3>
                <ul>
                  <li>$1,000 your sales + $350 partner commissions = $1,350 total</li>
                  <li>-$50 in fees (5%) = $1,300 profit</li>
                  <li><strong>Customer lifetime value: $500+</strong> (direct access forever)</li>
                  <li>Handle 150+ orders with LESS stress (system manages flow)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="daily-difference">
            <h4>Daily difference: $600 more profit + $500 per customer lifetime value</h4>
          </div>

          <div className="staff-liberation">
            <h4>The Staff Liberation:</h4>
            <div className="before-after-staff">
              <div className="before-staff">
                <strong>Before:</strong> Take order, process payment, make food, serve, answer questions
              </div>
              <div className="after-staff">
                <strong>After:</strong> Get organized digital orders, cook, call number when ready
              </div>
            </div>
            <p><strong>Your best cook can finally just COOK</strong></p>
          </div>
        </div>
      </section>

      {/* The Raving Fan System */}
      <section className="communication-solution-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">The Raving Fan System</span>
          </h2>
          <div className="communication-content">
            <h3>How to Create Superfans:</h3>
            <div className="superfan-steps">
              <div className="superfan-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <strong>Direct contact</strong> → Text them when you're nearby their location
                </div>
              </div>
              <div className="superfan-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <strong>Loyalty rewards</strong> → "Hey John, your 10th taco is free this Friday!"
                </div>
              </div>
              <div className="superfan-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <strong>Personal service</strong> → "Remember, no onions like always"
                </div>
              </div>
              <div className="superfan-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <strong>Event invites</strong> → "We're at the festival you love this weekend"
                </div>
              </div>
              <div className="superfan-step">
                <div className="step-number">5</div>
                <div className="step-content">
                  <strong>Cross-vendor upsells</strong> → "Mike's churros pair perfectly with your tacos"
                </div>
              </div>
            </div>

            <div className="professional-perception">
              <h4>The Professional Perception:</h4>
              <p>
                "Customers think you have a full tech team managing operations. Reality? It's automated. 
                You look like the most professional vendor while earning from every customer interaction."
              </p>
            </div>

            <div className="customer-transformation">
              <h4>Instead of being order #4847 on DoorDash, they become 'John who loves extra hot sauce, always tips well, and orders every Tuesday.'</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Volume Victory Formula */}
      <section className="volume-victory-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">The Volume Victory Formula</span>
          </h2>
          <div className="victory-content">
            <h3>Turn Overwhelm into Opportunity:</h3>
            <div className="victory-grid">
              <div className="victory-item">
                <strong>Smart queuing</strong> = Handle 3x volume with same stress level
              </div>
              <div className="victory-item">
                <strong>Multi-vendor commissions</strong> = Earn from every customer at the event
              </div>
              <div className="victory-item">
                <strong>Customer data ownership</strong> = Direct marketing forever
              </div>
              <div className="victory-item">
                <strong>Automatic updates</strong> = Zero customer management time
              </div>
              <div className="victory-item">
                <strong>Staff focus on cooking</strong> = No more register chaos
              </div>
            </div>

            <div className="growth-mindset">
              <h4>The Growth Mindset Shift:</h4>
              <p>
                "Instead of saying 'I hope it's not too busy today,' you start saying 
                'Bring on the rush - I'm making money from every vendor here!'"
              </p>
            </div>

            <div className="collaboration-revolution">
              <h4>The Collaboration Revolution:</h4>
              <p>
                "Stop competing with other vendors. Start collaborating and ALL make more money. 
                Turn the vendor next to you from competition into commission."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Offer */}
      <section className="offer-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">The Offer</span>
          </h2>
          <div className="offer-content">
            <h3>Stop Renting Customers, Start Owning Them:</h3>
            <div className="offer-features">
              <ul>
                <li><strong>5% fees</strong> (not 30% like DoorDash)</li>
                <li><strong>Customer data ownership</strong> (forever)</li>
                <li><strong>Smart order queuing</strong> (handles unlimited volume)</li>
                <li><strong>Multi-vendor commissions</strong> (earn from other vendors too)</li>
                <li><strong>Automatic customer updates</strong> (no more questions)</li>
                <li><strong>Direct communication tools</strong> (build real relationships)</li>
                <li><strong>Loyalty program built-in</strong> (create raving fans)</li>
              </ul>
            </div>

            <div className="investment-details">
              <div className="investment">
                <strong>Investment:</strong> $50/month
              </div>
              <div className="roi">
                <strong>ROI:</strong> Save $250+ per day in fees + earn commissions + customer lifetime value
              </div>
            </div>

            <div className="guarantee">
              <h4>The Overwhelm-Free Guarantee:</h4>
              <p>
                "If you don't save at least $500 in your first month AND feel more confident handling volume, 
                we'll refund everything. You keep all the customer data we helped you collect."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plus Even More Benefits */}
      <section className="bonus-benefits-section">
        <div className="section-content">
          <h2 className="section-title">
            <span className="gradient-text">Plus Even More Benefits</span>
          </h2>
          <p style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '2rem', color: 'rgba(255, 255, 255, 0.8)' }}>
            When you join SeamlessMarketplace, you get access to exclusive advantages that go beyond just processing orders:
          </p>
          <EmbeddedBenefitsSlides />
        </div>
      </section>

      {/* Urgency Close */}
      <section className="urgency-section">
        <div className="section-content">
          <div className="urgency-content">
            <p className="urgency-text">
              "We're launching your area's first multi-vendor network next week. First 15 vendors get 
              founding member status - higher commission rates, advanced queuing features, and premium placement. 
              After that, regular rates and waiting list."
            </p>
            <p className="urgency-cta">
              "Stop making DoorDash rich with YOUR customers. Stop fearing success. Start owning your customer 
              relationships and earning from every vendor around you. Click below now."
            </p>
            <button className="primary-button large" onClick={handleRegisterClick}>
              Reserve Your Spot Now
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Registration Form Modal */}
      {showRegistration && (
        <RegistrationForm onClose={() => setShowRegistration(false)} />
      )}
    </div>
  );
};

export default WebinarLanding;
