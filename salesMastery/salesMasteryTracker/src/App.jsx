import { useState, useEffect, useRef } from 'react';
import {
  getWeeksInMonth,
  getDefaultYear,
  getDefaultMonth,
  getDefaultWeekIndex,
  buildWeekKey,
  getMonthsForYear,
  getYears,
  getMonthName,
  displayDate,
  getWeekKeysForMonth,
  getWeekKeysForYear,
} from './utils/weekCalendar';
import { saveWeekDataToSupabase, loadWeekDataFromSupabase, loadMultipleWeeksFromSupabase } from './utils/supabaseStorage';
import {
  linkedInConversionRate,
  coldCallConversionRate,
  walkInConversionRate,
  networkingConversionRate,
  emailProspectingConversionRate,
} from './utils/calculations';
import NavigationBar from './components/NavigationBar';
import Section1LinkedIn from './components/Section1LinkedIn';
import Section2ColdCalls from './components/Section2ColdCalls';
import Section3WalkIns from './components/Section3WalkIns';
import Section4Networking from './components/Section4Networking';
import Section5EmailProspecting from './components/Section5EmailProspecting';
import Section6Analytics from './components/Section6Analytics';
import ExportButton from './components/ExportButton';

const emptyFormState = () => ({
  s1Date: '',
  s1Requests: '0',
  s1Accepted: '0',
  s1Responses: '0',
  s1Contact: '0',
  s1FollowUpMessages: '0',
  s1Demos: '0',
  s1Sales: '0',
  s1Revenue: '0',
  s1Rating: '0',
  s1Journal: '',
  s2Calls: '0',
  s2Positive: '0',
  s2Demos: '0',
  s2Sales: '0',
  s2Rating: '0',
  s2Journal: '',
  s3Walkins: '0',
  s3Contact: '0',
  s3Demos: '0',
  s3Sales: '0',
  s3Rating: '0',
  s3Journal: '',
  s4Weekof: '',
  s4Events: '0',
  s4Contacts: '0',
  s4Followups: '0',
  s4Demos: '0',
  s4Sales: '0',
  s4Rating: '0',
  s4Journal: '',
  s5Emails: '0',
  s5Replies: '0',
  s5Demos: '0',
  s5Sales: '0',
  s5Rating: '0',
  s5Journal: '',
});

function formatConv(v) {
  if (v === 0 || v === undefined) return '0%';
  return Number(v).toFixed(2) + '%';
}

const NUMERIC_KEYS = [
  's1Requests', 's1Accepted', 's1Responses', 's1Contact', 's1FollowUpMessages', 's1Demos', 's1Sales', 's1Revenue', 's1Rating',
  's2Calls', 's2Positive', 's2Demos', 's2Sales', 's2Rating',
  's3Walkins', 's3Contact', 's3Demos', 's3Sales', 's3Rating',
  's4Events', 's4Contacts', 's4Followups', 's4Demos', 's4Sales', 's4Rating',
  's5Emails', 's5Replies', 's5Demos', 's5Sales', 's5Rating',
];

function sumFormStates(states, replaceIndex, replaceState) {
  const arr = replaceIndex != null && replaceIndex >= 0 && replaceState
    ? states.map((s, i) => (i === replaceIndex ? replaceState : s))
    : states;
  const out = { ...emptyFormState() };
  for (const k of NUMERIC_KEYS) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i][k];
      if (v === undefined || v === null) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[salesMasteryTracker] aggregation: missing field', k, 'at index', i, 'state keys:', arr[i] ? Object.keys(arr[i]) : []);
        }
      }
      sum += Number(v) || 0;
    }
    out[k] = String(sum);
  }
  return out;
}

const defaultYear = getDefaultYear();
const defaultMonth = getDefaultMonth();
const defaultWeeks = getWeeksInMonth(defaultYear, defaultMonth);
const defaultWeekIndex = getDefaultWeekIndex(defaultWeeks);
const defaultWeekKey = buildWeekKey(defaultYear, defaultMonth, defaultWeekIndex);

function App() {
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [weekIndex, setWeekIndex] = useState(defaultWeekIndex);
  const [weeks, setWeeks] = useState(defaultWeeks);
  const [weekKey, setWeekKey] = useState(defaultWeekKey);
  const [formState, setFormState] = useState(emptyFormState());
  const [monthData, setMonthData] = useState([]);
  const [yearData, setYearData] = useState([]);
  const skipSaveRef = useRef(false);

  const s1Conv = formatConv(
    linkedInConversionRate(
      Number(formState.s1Sales) || 0,
      Number(formState.s1Requests) || 0
    )
  );
  const s2Conv = formatConv(
    coldCallConversionRate(
      Number(formState.s2Sales) || 0,
      Number(formState.s2Calls) || 0
    )
  );
  const s3Conv = formatConv(
    walkInConversionRate(
      Number(formState.s3Sales) || 0,
      Number(formState.s3Walkins) || 0
    )
  );
  const s4Conv = formatConv(
    networkingConversionRate(
      Number(formState.s4Sales) || 0,
      Number(formState.s4Contacts) || 0
    )
  );
  const s5Conv = formatConv(
    emailProspectingConversionRate(
      Number(formState.s5Sales) || 0,
      Number(formState.s5Emails) || 0
    )
  );

  const formStateWithConv = {
    ...formState,
    s1Conv,
    s2Conv,
    s3Conv,
    s4Conv,
    s5Conv,
  };

  const weekTotals = formState;
  const monthTotals = sumFormStates(monthData, weekIndex, formState);
  const yearWeekIndex = getWeekKeysForYear(year).indexOf(weekKey);
  const yearTotals = sumFormStates(yearData, yearWeekIndex >= 0 ? yearWeekIndex : null, yearWeekIndex >= 0 ? formState : null);

  useEffect(() => {
    skipSaveRef.current = true;
    loadWeekDataFromSupabase(weekKey).then((supabaseData) => {
      setFormState(supabaseData ? { ...emptyFormState(), ...supabaseData } : emptyFormState());
    });
  }, [weekKey]);

  useEffect(() => {
    const monthKeys = getWeekKeysForMonth(year, month);
    const yearKeys = getWeekKeysForYear(year);
    loadMultipleWeeksFromSupabase(monthKeys).then(setMonthData);
    loadMultipleWeeksFromSupabase(yearKeys).then(setYearData);
  }, [year, month, weekKey]);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    if (!weekKey) return;
    saveWeekDataToSupabase(weekKey, formState);
  }, [weekKey, formState]);

  const updateField = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleYearChange = (newYear) => {
    saveWeekDataToSupabase(weekKey, formState);
    setYear(newYear);
    const months = getMonthsForYear(newYear);
    setMonth(months[0]);
    const w = getWeeksInMonth(newYear, months[0]);
    setWeeks(w);
    setWeekIndex(0);
    setWeekKey(buildWeekKey(newYear, months[0], 0));
  };

  const handleMonthChange = (newMonth) => {
    saveWeekDataToSupabase(weekKey, formState);
    setMonth(newMonth);
    const w = getWeeksInMonth(year, newMonth);
    setWeeks(w);
    setWeekIndex(0);
    setWeekKey(buildWeekKey(year, newMonth, 0));
  };

  const handleWeekChange = (newWeekIndex) => {
    saveWeekDataToSupabase(weekKey, formState);
    setWeekIndex(newWeekIndex);
    setWeekKey(buildWeekKey(year, month, newWeekIndex));
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16, color: 'var(--text-light)', fontFamily: 'var(--font-primary)' }}>
      <NavigationBar
        year={year}
        month={month}
        weekIndex={weekIndex}
        weeks={weeks}
        years={getYears()}
        monthsForYear={getMonthsForYear(year)}
        getMonthName={getMonthName}
        displayDate={displayDate}
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
        onWeekChange={handleWeekChange}
      />
      <Section1LinkedIn
        formState={formState}
        formStateWithConv={formStateWithConv}
        updateField={updateField}
        weekTotals={weekTotals}
        monthTotals={monthTotals}
        yearTotals={yearTotals}
      />
      <Section2ColdCalls
        formState={formState}
        formStateWithConv={formStateWithConv}
        updateField={updateField}
        weekTotals={weekTotals}
        monthTotals={monthTotals}
        yearTotals={yearTotals}
      />
      <Section3WalkIns
        formState={formState}
        formStateWithConv={formStateWithConv}
        updateField={updateField}
        weekTotals={weekTotals}
        monthTotals={monthTotals}
        yearTotals={yearTotals}
      />
      <Section4Networking
        formState={formState}
        formStateWithConv={formStateWithConv}
        updateField={updateField}
        weekTotals={weekTotals}
        monthTotals={monthTotals}
        yearTotals={yearTotals}
      />
      <Section5EmailProspecting
        formState={formState}
        formStateWithConv={formStateWithConv}
        updateField={updateField}
        weekTotals={weekTotals}
        monthTotals={monthTotals}
        yearTotals={yearTotals}
      />
      <Section6Analytics formStateWithConv={formStateWithConv} />
      <ExportButton weekKey={weekKey} formState={formStateWithConv} />
    </div>
  );
}

export default App;
