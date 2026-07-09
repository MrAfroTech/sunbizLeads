import React, { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fireCalculatorEngagementEvent } from '../lib/fireCalculatorEngagementEvent';
import {
  buildCalendlyBookingUrl,
  REVENUE_FIT_CALENDLY_URL,
} from '../lib/revenueFitAttribution';
import { getStoredCalculatorVisitId } from '../lib/seamlesslyContactCapture';

const CalculatorScheduleCTA = ({
  calculatorType,
  email,
  name,
  phone,
  contactId,
}) => {
  const [searchParams] = useSearchParams();

  const resolvedContactId =
    contactId ||
    searchParams.get('contactId') ||
    searchParams.get('contact_id') ||
    getStoredCalculatorVisitId() ||
    undefined;

  const handleSchedule = useCallback(() => {
    void fireCalculatorEngagementEvent(calculatorType, 'schedule_clicked', {
      email,
      name,
      phone,
      phone_number: phone,
    });

    const bookingUrl =
      buildCalendlyBookingUrl({
        name,
        email,
        attribution: {
          calculatorType,
          contactId: resolvedContactId,
          campaign: searchParams.get('campaign') || undefined,
        },
      }) || REVENUE_FIT_CALENDLY_URL;

    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
  }, [calculatorType, email, name, phone, resolvedContactId, searchParams]);

  if (!email) return null;

  return (
    <div className="calculator-post-reveal">
      <p className="calculator-post-reveal__confirm">
        Your full report is on its way to {email}. Book a time below to walk through it together.
      </p>

      <div className="calculator-schedule-cta">
        <h3 className="calculator-schedule-cta__headline">BOOK YOUR FREE REVENUE LIFT SESSION</h3>
        <p className="calculator-schedule-cta__subhead">
          30 minutes. We&apos;ll walk through your numbers and show you exactly where the money is.
        </p>
        <button
          type="button"
          className="calculator-schedule-cta__button"
          onClick={handleSchedule}
        >
          SCHEDULE MY SESSION →
        </button>
      </div>
    </div>
  );
};

export default CalculatorScheduleCTA;
