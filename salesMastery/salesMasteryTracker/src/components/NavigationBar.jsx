function NavigationBar({
  year,
  month,
  weekIndex,
  weeks,
  years,
  monthsForYear,
  getMonthName,
  displayDate,
  onYearChange,
  onMonthChange,
  onWeekChange,
}) {
  return (
    <nav style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24, color: 'var(--text-light)' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-light)' }}>
        Year
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          style={{ padding: '6px 10px' }}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-light)' }}>
        Month
        <select
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          style={{ padding: '6px 10px' }}
        >
          {monthsForYear.map((m) => (
            <option key={m} value={m}>
              {getMonthName(m)}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-light)' }}>
        Week
        <select
          value={weekIndex}
          onChange={(e) => onWeekChange(Number(e.target.value))}
          style={{ padding: '6px 10px' }}
        >
          {weeks.map((w, i) => (
            <option key={i} value={i}>
              Week {i + 1}: {displayDate(w.mon)} – {displayDate(w.sun)}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}

export default NavigationBar;
