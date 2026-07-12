import React from 'react';
import '../styles/CalculatorGlassCard.css';
import '../styles/CalculatorRangeField.css';
import { CALCULATOR_PAGE_KEYS } from '../lib/calculatorPageVisits';
import EventLeakCalculator from './EventLeakCalculator';

const EventSpacesCalculator = () => (
  <EventLeakCalculator
    pageKey={CALCULATOR_PAGE_KEYS.EVENTS_CALCULATOR}
    leadCampaign="events-calculator-leak-report"
    idPrefix="events-calc"
  />
);

export default EventSpacesCalculator;
