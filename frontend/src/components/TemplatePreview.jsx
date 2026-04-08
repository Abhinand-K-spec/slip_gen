export default function TemplatePreview({ previewData }) {
  if (!previewData) return null;

  const { preview, firstRow, totalRows, skippedRows, errors } = previewData;

  return (
    <div className="card fade-up">
      <div className="card-title">Template Preview</div>

      {/* Stats */}
      <div className="stats-row">
        <span className="stat-badge green">✓ {totalRows} valid rows</span>
        {skippedRows > 0 && (
          <span className="stat-badge yellow">⚠ {skippedRows} skipped</span>
        )}
        <span className="stat-badge purple">🖼 JPG output</span>
      </div>

      {/* First-row slip preview */}
      {preview && (
        <div className="preview-img-wrap" style={{ marginTop: '20px' }}>
          <img src={preview} alt="Slip preview" id="preview-image" />
        </div>
      )}

      {/* Field mapping */}
      {firstRow && (
        <>
          <p style={{ marginTop: '20px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            First row data — mapped to template fields:
          </p>
          <div className="field-grid">
            {Object.entries(firstRow).map(([key, val]) => (
              <div className="field-item" key={key}>
                <div className="field-label">{key}</div>
                <div className="field-value">{val || '—'}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Skipped row errors */}
      {errors && errors.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--accent-warn)', marginBottom: '8px', fontWeight: 600 }}>
            ⚠ Skipped rows ({errors.length})
          </p>
          <ul className="error-list">
            {errors.slice(0, 10).map((e, i) => (
              <li className="error-item" key={i}>
                <span className="error-row">Row {e.row}</span>
                <span className="error-reason">{e.reason}</span>
              </li>
            ))}
            {errors.length > 10 && (
              <li className="error-item">
                <span className="error-reason">…and {errors.length - 10} more</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
