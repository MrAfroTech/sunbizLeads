import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import '../styles/CalculatorGlassCard.css';
import '../styles/CalculatorRangeField.css';
import StaffTurnoverInlineReveal from './StaffTurnoverInlineReveal';
import CalculatorHeroShell from './CalculatorHeroShell';
import CalculatorHeroCardIntro from './CalculatorHeroCardIntro';
import { CALCULATOR_PAGE_KEYS, recordCalculatorPageVisit } from '../lib/calculatorPageVisits';
import { recordStaffTurnoverPrimary, recordStaffTurnoverSecondary } from '../lib/staffJourneys';
import {
  hasLeadEmailInUrl,
  isContactComplete,
  parseContactFromSearchParams,
} from '../lib/journeyContactHelpers';
import { useLeadEventTracker } from '../lib/useLeadEventTracker';
import { submitUnifiedLead } from '../lib/submitUnifiedLead';
import { buildStaffTurnoverEmailFields } from '../lib/calculatorEmailPersonalization';
import CalculatorRangeField from './CalculatorRangeField';
import { CALCULATOR_RANGE_FIELDS } from '../lib/calculatorRangeConfig';
import {
  CalculatorStepChrome,
  CalculatorStepNav,
  CalculatorHeroSubhead,
  scheduleFormSubmit,
} from './CalculatorStepFlow';

const INDUSTRY_AVERAGE_TENURE = 59;
const COST_PER_REHIRE = 5700;

const MILESTONE_DAYS = [59, 90, 120, 180, 365];

const StaffTurnoverCalculator = () => {
  const [searchParams] = useSearchParams();
  const leadFromUrl = useMemo(() => hasLeadEmailInUrl(searchParams), [searchParams]);
  const { fire: fireEngagement, trackStartedOnce } = useLeadEventTracker('staff_turnover');

  const journeyIdRef = useRef(null);
  const calculatorVisitIdRef = useRef(null);
  const formRef = useRef(null);
  const [contact, setContact] = useState({ fullName: '', email: '', phone: '' });
  const [contactError, setContactError] = useState('');

  const [turnoverPerMonthInput, setTurnoverPerMonthInput] = useState('');
  const [tenureDaysInput, setTenureDaysInput] = useState('');
  const [primaryResultsShown, setPrimaryResultsShown] = useState(false);
  const [primarySnapshot, setPrimarySnapshot] = useState(null);

  const [secondaryResultsShown, setSecondaryResultsShown] = useState(false);
  const [secondarySnapshot, setSecondarySnapshot] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const stepFields = useMemo(
    () => (leadFromUrl ? ['turnover', 'tenure'] : ['turnover', 'tenure', 'fullName', 'email', 'phone']),
    [leadFromUrl]
  );
  const totalSteps = stepFields.length;
  const currentStepField = stepFields[currentStep];

  useEffect(() => {
    if (leadFromUrl) {
      setContact(parseContactFromSearchParams(searchParams));
    }
  }, [leadFromUrl, searchParams]);

  useEffect(() => {
    void recordCalculatorPageVisit({
      pageKey: CALCULATOR_PAGE_KEYS.STAFF_TURNOVER_CALCULATOR,
      searchParams,
    }).then((id) => {
      if (id) calculatorVisitIdRef.current = id;
    });
  }, [searchParams]);

  const handleContactChange = (field, value) => {
    trackStartedOnce();
    setContact((c) => ({ ...c, [field]: value }));
  };

  const formatMoney = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const formatNum = (n) =>
    n.toLocaleString('en-US', { maximumFractionDigits: 2 });

  const monthlyToAnnual = (monthly) => (parseFloat(monthly) || 0) * 12;

  const milestoneRow = (annualTurnover, days) => {
    const raw = annualTurnover * ((days - INDUSTRY_AVERAGE_TENURE) / INDUSTRY_AVERAGE_TENURE);
    const turnoverAvoided = Math.min(Math.max(raw, 0), annualTurnover);
    const savings = turnoverAvoided * COST_PER_REHIRE;
    return { turnoverAvoided, savings };
  };

  const requireContactBeforeCalculate = () => {
    if (!leadFromUrl && !isContactComplete(contact)) {
      setContactError('Please enter your full name, a valid email, and a phone number (at least 7 digits).');
      return false;
    }
    setContactError('');
    return true;
  };

  const handleReportSubmit = useCallback(
    async (contactPayload) => {
      fireEngagement('cta_clicked', 'interact');
      const campaign =
        (searchParams.get('campaign') || '').trim() || 'staff-turnover-calculator';
      const result = await submitUnifiedLead({
        email: contactPayload.email,
        name: contactPayload.fullName,
        phone: contactPayload.phone,
        source: 'staff_turnover',
        campaign,
        visitId: calculatorVisitIdRef.current,
        visitContact: {
          name: contactPayload.fullName,
          email: contactPayload.email,
          phone: contactPayload.phone,
          lastClickCampaign: campaign,
        },
        calculatorEmailFields: buildStaffTurnoverEmailFields(primarySnapshot),
      });
      if (!result.ok) {
        return { ok: false };
      }
      fireEngagement('lead_submitted', 'submit');
      fireEngagement('phone_provided', 'phone_provided');
      return { ok: true };
    },
    [fireEngagement, primarySnapshot, searchParams]
  );

  const handlePrimaryCalculate = () => {
    if (!requireContactBeforeCalculate()) return;

    const turnoverPerMonth = parseFloat(turnoverPerMonthInput) || 0;
    const annualTurnover = monthlyToAnnual(turnoverPerMonthInput);
    const monthlyCost = turnoverPerMonth * COST_PER_REHIRE;
    const turnoverCost = annualTurnover * COST_PER_REHIRE;

    setPrimarySnapshot({ turnoverPerMonth, annualTurnover, turnoverCost, monthlyCost });
    setPrimaryResultsShown(true);
    setSecondaryResultsShown(false);
    setSecondarySnapshot(null);
    fireEngagement('calculator_completed', 'interact');

    void recordStaffTurnoverPrimary({
      contact,
      turnoverPerMonth,
    }).then((id) => {
      if (id) journeyIdRef.current = id;
    });
  };

  const validateCurrentStep = () => {
    setContactError('');

    if (currentStepField === 'turnover') {
      const turnover = parseFloat(turnoverPerMonthInput);
      if (!Number.isFinite(turnover) || turnover < 0) return false;
    }
    if (currentStepField === 'tenure') {
      const tenure = parseFloat(tenureDaysInput);
      if (!Number.isFinite(tenure) || tenure < 0) return false;
    }
    if (currentStepField === 'fullName' && !contact.fullName.trim()) {
      return false;
    }
    if (currentStepField === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      return false;
    }
    if (currentStepField === 'phone' && contact.phone.replace(/\D/g, '').length < 7) {
      return false;
    }
    return true;
  };

  const handleStepNext = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep((step) => Math.min(step + 1, totalSteps - 1));
  };

  const handleStepBack = () => {
    setContactError('');
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handlePrimaryFormSubmit = (ev) => {
    ev.preventDefault();
    if (!validateCurrentStep()) return;
    handlePrimaryCalculate();
  };

  const handleSecondaryCalculate = () => {
    if (!requireContactBeforeCalculate()) return;

    const turnoverPerMonth = parseFloat(turnoverPerMonthInput) || 0;
    const annualTurnover = monthlyToAnnual(turnoverPerMonthInput);
    const avgTenureDays = parseFloat(tenureDaysInput) || 0;
    const extraDays = avgTenureDays - INDUSTRY_AVERAGE_TENURE;
    const rawAvoided = annualTurnover * (extraDays / INDUSTRY_AVERAGE_TENURE);
    const turnoverAvoidedAnnual = Math.min(Math.max(rawAvoided, 0), annualTurnover);
    const savings = turnoverAvoidedAnnual * COST_PER_REHIRE;

    const monthlyCost = turnoverPerMonth * COST_PER_REHIRE;
    const turnoverCost = annualTurnover * COST_PER_REHIRE;

    setSecondarySnapshot({ extraDays, turnoverAvoidedAnnual, savings });
    setSecondaryResultsShown(true);
    fireEngagement('calculator_completed', 'interact');

    if (!primarySnapshot) {
      setPrimarySnapshot({ turnoverPerMonth, annualTurnover, turnoverCost, monthlyCost });
      setPrimaryResultsShown(true);
    }

    const id = journeyIdRef.current;
    if (id) {
      void recordStaffTurnoverSecondary({
        journeyId: id,
        contact,
        tenureDays: avgTenureDays,
      });
    } else {
      void recordStaffTurnoverPrimary({
        contact,
        turnoverPerMonth,
      }).then((newId) => {
        if (newId) {
          journeyIdRef.current = newId;
          void recordStaffTurnoverSecondary({
            journeyId: newId,
            contact,
            tenureDays: avgTenureDays,
          });
        }
      });
    }
  };

  return (
    <CalculatorHeroShell
      className="watch-vs-order-page--clear-navbar watch-vs-order-page--staffburnout"
      glassCard
    >
      {!primaryResultsShown ? (
        <form ref={formRef} className="watch-vs-order-calc-body" onSubmit={handlePrimaryFormSubmit}>
          <CalculatorHeroCardIntro
            currentStep={currentStep}
            totalSteps={totalSteps}
          />

                <CalculatorStepChrome currentStep={currentStep} totalSteps={totalSteps} />

                {currentStepField === 'turnover' ? (
                  <CalculatorRangeField
                    id="staff-turnover-per-month"
                    label="Staff turnover per month (voluntary and involuntary) combined"
                    value={turnoverPerMonthInput}
                    onChange={(nextValue) => {
                      trackStartedOnce();
                      setTurnoverPerMonthInput(nextValue);
                    }}
                    onFocus={trackStartedOnce}
                    {...CALCULATOR_RANGE_FIELDS.turnoverPerMonth}
                  />
                ) : null}

                {currentStepField === 'tenure' ? (
                  <CalculatorRangeField
                    id="staff-tenure-days"
                    label="Average employee tenure (in days)"
                    value={tenureDaysInput}
                    onChange={(nextValue) => {
                      trackStartedOnce();
                      setTenureDaysInput(nextValue);
                    }}
                    onFocus={trackStartedOnce}
                    {...CALCULATOR_RANGE_FIELDS.tenureDays}
                  />
                ) : null}

                {currentStepField === 'fullName' ? (
                  <div className="watch-vs-order-field-group">
                    <div className="watch-vs-order-field-label">Full name</div>
                    <input
                      className="watch-vs-order-field-input"
                      type="text"
                      autoComplete="name"
                      value={contact.fullName}
                      onChange={(e) => handleContactChange('fullName', e.target.value)}
                    />
                  </div>
                ) : null}

                {currentStepField === 'email' ? (
                  <div className="watch-vs-order-field-group">
                    <div className="watch-vs-order-field-label">Email</div>
                    <input
                      className="watch-vs-order-field-input"
                      type="email"
                      autoComplete="email"
                      value={contact.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                    />
                  </div>
                ) : null}

                {currentStepField === 'phone' ? (
                  <div className="watch-vs-order-field-group">
                    <div className="watch-vs-order-field-label">Phone</div>
                    <input
                      className="watch-vs-order-field-input"
                      type="tel"
                      autoComplete="tel"
                      value={contact.phone}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      onBlur={() => {
                        if (currentStep === totalSteps - 1 && validateCurrentStep()) {
                          scheduleFormSubmit(formRef);
                        }
                      }}
                    />
                  </div>
                ) : null}

                {contactError ? (
                  <p style={{ color: '#b91c1c', marginBottom: '12px', fontSize: '0.95rem' }}>{contactError}</p>
                ) : null}

                <CalculatorStepNav
                  showBack={currentStep > 0}
                  onBack={handleStepBack}
                  onNext={handleStepNext}
                  isLastStep={currentStep === totalSteps - 1}
                  submitLabel="Show Me What Turnover Is Costing Me"
                />
        </form>
      ) : (
        <div className="watch-vs-order-calc-body">
          {primarySnapshot && (
            <>
              <div className="watch-vs-order-result-block">
                <div className="watch-vs-order-result-sub">
                  You&apos;re losing {formatMoney(primarySnapshot.turnoverCost)} per year to staff turnover
                </div>
                <div className="watch-vs-order-result-sub" style={{ marginTop: '12px' }}>
                  That&apos;s {formatMoney(primarySnapshot.monthlyCost)} every month walking out the door
                </div>
              </div>

              <button type="button" className="watch-vs-order-cta-btn" onClick={handleSecondaryCalculate}>
                Calculate tenure savings
              </button>

              {secondaryResultsShown && secondarySnapshot ? (
                <>
                  <div className="watch-vs-order-result-block" style={{ marginTop: '20px' }}>
                    <div className="watch-vs-order-result-sub">
                      If you keep each employee just {secondarySnapshot.extraDays} days longer than average:
                    </div>
                    <div className="watch-vs-order-result-sub" style={{ marginTop: '12px' }}>
                      You avoid {formatNum(secondarySnapshot.turnoverAvoidedAnnual)} turnover events per year
                    </div>
                    <div className="watch-vs-order-result-sub" style={{ marginTop: '12px' }}>
                      You save {formatMoney(secondarySnapshot.savings)} annually
                    </div>
                  </div>

                  <StaffTurnoverInlineReveal
                    turnoverPerMonthInput={turnoverPerMonthInput}
                    monthlyToAnnual={monthlyToAnnual}
                    milestoneRow={milestoneRow}
                    formatMoney={formatMoney}
                    formatNum={formatNum}
                    contact={contact}
                    leadFromUrl={leadFromUrl}
                    onContactChange={handleContactChange}
                    onReportSubmit={handleReportSubmit}
                    onConsultationCta={() => fireEngagement('consultation_cta_clicked', 'interact')}
                    milestoneDays={MILESTONE_DAYS}
                    industryAverageTenure={INDUSTRY_AVERAGE_TENURE}
                  />
                </>
              ) : null}
            </>
          )}
        </div>
      )}
    </CalculatorHeroShell>
  );
};

export default StaffTurnoverCalculator;
