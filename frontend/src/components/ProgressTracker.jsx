export default function ProgressTracker({ progress, status }) {
  if (progress == null) return null;

  return (
    <div className="progress-wrap fade-up">
      <div className="progress-label">
        <span>{status || 'Generating slips…'}</span>
        <span>{progress}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
