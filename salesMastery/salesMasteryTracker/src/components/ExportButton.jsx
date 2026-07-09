import { exportToCSV } from '../utils/csvExport';

function ExportButton({ weekKey, formState }) {
  return (
    <button
      type="button"
      onClick={() => exportToCSV(weekKey, formState)}
      style={{
        padding: '12px 28px',
        marginTop: 8,
        cursor: 'pointer',
        background: 'var(--btn-primary-bg)',
        color: 'var(--btn-primary-color)',
        fontWeight: 600,
        borderRadius: 'var(--btn-primary-radius)',
        boxShadow: 'var(--btn-primary-shadow)',
        transition: 'all 0.3s ease',
      }}
    >
      Export to CSV
    </button>
  );
}

export default ExportButton;
