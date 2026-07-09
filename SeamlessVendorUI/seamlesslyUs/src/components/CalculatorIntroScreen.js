import React from 'react';

const CHECKLIST_ITEMS = [
  'Your estimated annual revenue opportunity',
  'Where your biggest revenue leak is',
  'How you compare to similar venues',
];

const CalculatorIntroScreen = ({ onStart }) => (
  <div className="calculator-intro-screen">
    <h1 className="watch-vs-order-title calculator-intro-screen__headline">
      How Much Revenue Is Operational Friction Costing You?
    </h1>
    <p className="calculator-intro-screen__subhead">In 45 seconds, you&apos;ll discover:</p>
    <ul className="calculator-intro-screen__checks">
      {CHECKLIST_ITEMS.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
    <p className="calculator-intro-screen__note">No email required until your results.</p>
    <button type="button" className="watch-vs-order-cta-btn calculator-intro-screen__cta" onClick={onStart}>
      Start My Assessment
    </button>
  </div>
);

export default CalculatorIntroScreen;
