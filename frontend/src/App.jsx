import { useState } from 'react';
import './index.css';
import FileUpload from './components/FileUpload';
import TemplatePreview from './components/TemplatePreview';
import ProgressTracker from './components/ProgressTracker';
import { previewSlip, generateSlips } from './services/api';

export default function App() {
  const [file, setFile]             = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress]     = useState(null);
  const [progressStatus, setProgressStatus] = useState('');
  const [error, setError]           = useState(null);
  const [done, setDone]             = useState(false);
  const [txnMode, setTxnMode]       = useState('IMPS');
  const [txnStatus, setTxnStatus]   = useState('Success');

  const handleFileSelect = (f) => {
    setFile(f);
    setPreviewData(null);
    setError(null);
    setDone(false);
    setProgress(null);
  };

  const handlePreview = async () => {
    if (!file) return;
    setPreviewing(true);
    setError(null);
    try {
      const data = await previewSlip(file, txnMode, txnStatus);
      setPreviewData(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Preview failed.');
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;
    setGenerating(true);
    setDone(false);
    setError(null);
    setProgress(0);
    setProgressStatus('Uploading & parsing file…');

    try {
      // First tick — simulate parsing phase (no streaming length header during upload)
      setTimeout(() => setProgressStatus('Generating slips with worker pool…'), 800);

      await generateSlips(file, txnMode, txnStatus, (pct) => {
        setProgress(pct);
        if (pct >= 90) setProgressStatus('Packaging ZIP file…');
      });

      setDone(true);
      setProgress(100);
      setProgressStatus('Done! ZIP downloaded.');
    } catch (e) {
      setError(e.message || 'Generation failed. Please try again.');
      setProgress(null);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-inner">
            <div className="header-logo">🪪</div>
            <div>
              <h1>ReceiptGen</h1>
              <p>Bulk payment receipt generator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        <div className="container">
          <h2 className="page-title">
            Generate <span>Payment Receipts</span> in Bulk
          </h2>
          <p className="page-subtitle">
            Upload your headerless Excel file (A: Name, B: Account, C: IFSC, D: Amount, E: Ref No) — we'll bake a professional receipt for every row.
          </p>

          {/* Upload card */}
          <div className="card fade-up">
            <div className="card-title">Upload Spreadsheet</div>
            <FileUpload onFileSelect={handleFileSelect} disabled={previewing || generating} />

            {/* Errors */}
            {error && (
              <div className="alert alert-error">
                <span>⚠</span> {error}
              </div>
            )}

            {/* Done */}
            {done && (
              <div className="alert alert-success">
                <span>✓</span> All slips generated! Your ZIP download has started.
              </div>
            )}

            {/* Progress */}
            <ProgressTracker progress={progress} status={progressStatus} />

            {/* Global Options */}
            <div className="btn-row" style={{ marginTop: '20px', gap: '15px', justifyContent: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>TRANSACTION MODE</label>
                <select 
                  value={txnMode} 
                  onChange={(e) => setTxnMode(e.target.value)}
                  className="btn btn-outline"
                  style={{ width: '100%', textAlign: 'left', padding: '10px' }}
                >
                  <option value="IMPS">IMPS</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>PAYMENT STATUS</label>
                <select 
                  value={txnStatus} 
                  onChange={(e) => setTxnStatus(e.target.value)}
                  className="btn btn-outline"
                  style={{ width: '100%', textAlign: 'left', padding: '10px' }}
                >
                  <option value="Success">Success (Green)</option>
                  <option value="Failure">Failure (Red)</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="btn-row">
              <button
                id="btn-preview"
                className="btn btn-outline"
                onClick={handlePreview}
                disabled={!file || previewing || generating}
              >
                {previewing ? <><span className="spinner" /> Parsing…</> : '👁 Preview Template'}
              </button>

              <button
                id="btn-generate"
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={!file || generating || (!previewData && !file)}
              >
                {generating
                  ? <><span className="spinner" /> Generating…</>
                  : '⚡ Generate All Slips'}
              </button>
            </div>
          </div>

          {/* Preview card */}
          {previewData && <TemplatePreview previewData={previewData} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          SlipGen — images generated in-memory, no data stored on server.
        </div>
      </footer>
    </div>
  );
}
