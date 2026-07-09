import React from 'react';
import './PricingComparisonChart.css';

const PricingComparisonChart = () => {
  const comparisonData = [
    {
      factor: "Ticketing fees",
      eventbrite: "3.7% + $1.79",
      tickpick: "10% commission",
      seamlessly: "Flat rate (lower)",
      seamlesslyHighlight: true
    },
    {
      factor: "Data ownership",
      eventbrite: "Locked in their platform",
      tickpick: "Locked in their platform",
      seamlessly: "YOU own it, direct access",
      seamlesslyHighlight: true
    },
    {
      factor: "Food/beverage ordering",
      eventbrite: "Not included (need DoorDash, etc.)",
      tickpick: "Not included",
      seamlessly: "✅ INCLUDED - mobile ordering integrated",
      seamlesslyHighlight: true
    },
    {
      factor: "Attendee experience",
      eventbrite: "Separate apps for tickets + food",
      tickpick: "Separate apps",
      seamlessly: "One app for everything",
      seamlesslyHighlight: true
    },
    {
      factor: "Local support",
      eventbrite: "SF-based ticket system",
      tickpick: "Remote",
      seamlessly: "Florida-based, on-site available",
      seamlesslyHighlight: true
    },
    {
      factor: "Platform control",
      eventbrite: "You rent their system",
      tickpick: "You rent their system",
      seamlessly: "Your platform, your data, your brand",
      seamlesslyHighlight: true
    },
    {
      factor: "Customization",
      eventbrite: "Limited",
      tickpick: "Limited",
      seamlessly: "Fully customizable for your needs",
      seamlesslyHighlight: true
    },
    {
      factor: "Revenue optimization",
      eventbrite: "Ticketing only",
      tickpick: "Ticketing only",
      seamlessly: "Ticketing + F&B = higher per-attendee revenue",
      seamlesslyHighlight: true
    },
    {
      factor: "Data analytics",
      eventbrite: "Basic (in their system)",
      tickpick: "Basic",
      seamlessly: "Full access, real-time, exportable, API",
      seamlesslyHighlight: true
    },
    {
      factor: "Integration",
      eventbrite: "Their APIs (limited)",
      tickpick: "Their APIs (limited)",
      seamlessly: "Direct database access, full API",
      seamlesslyHighlight: true
    }
  ];

  return (
    <div className="pricing-comparison">
      <div className="comparison-header">
        <h2>The Competitive Battle Card</h2>
        <p className="comparison-subtitle">UCF Event Management Platform vs. Industry Leaders</p>
      </div>

      <div className="comparison-table-container">
        <div className="comparison-table">
          <div className="table-header">
            <div className="factor-column">Factor</div>
            <div className="competitor-column">
              <div className="competitor-logo eventbrite">Eventbrite</div>
            </div>
            <div className="competitor-column">
              <div className="competitor-logo tickpick">TickPick</div>
            </div>
            <div className="competitor-column seamlessly-column">
              <div className="competitor-logo seamlessly">SEAMLESSLY</div>
              <div className="winner-badge">🏆 WINNER</div>
            </div>
          </div>

          <div className="table-body">
            {comparisonData.map((row, index) => (
              <div key={index} className={`table-row ${index % 2 === 0 ? 'even' : 'odd'}`}>
                <div className="factor-cell">
                  <span className="factor-name">{row.factor}</span>
                </div>
                <div className="competitor-cell">
                  <span className="competitor-value">{row.eventbrite}</span>
                </div>
                <div className="competitor-cell">
                  <span className="competitor-value">{row.tickpick}</span>
                </div>
                <div className={`competitor-cell seamlessly-cell ${row.seamlesslyHighlight ? 'highlight' : ''}`}>
                  <span className="competitor-value seamlessly-value">{row.seamlessly}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="comparison-footer">
        <div className="key-benefits">
          <h3>Why UCF Chooses SEAMLESSLY</h3>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">💰</div>
              <h4>Lower Costs</h4>
              <p>Flat rate pricing beats percentage-based fees</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📊</div>
              <h4>Data Ownership</h4>
              <p>Your data, your insights, your control</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🍕</div>
              <h4>Integrated F&B</h4>
              <p>One platform for tickets and food ordering</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🏠</div>
              <h4>Local Support</h4>
              <p>Florida-based team with on-site availability</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingComparisonChart;
