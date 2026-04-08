import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const ACCEPTED_TYPES = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FileUpload({ onFileSelect, disabled }) {
  const [file, setFile] = useState(null);

  const onDrop = useCallback((accepted) => {
    if (accepted.length === 0) return;
    const f = accepted[0];
    setFile(f);
    onFileSelect(f);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    disabled,
  });

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    onFileSelect(null);
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`dropzone${isDragActive ? ' active' : ''}`}
        id="dropzone"
      >
        <input {...getInputProps()} id="file-input" />
        <div className="dropzone-icon">📊</div>
        {isDragActive ? (
          <>
            <h3>Release to upload</h3>
            <p>Drop your Excel or CSV file here</p>
          </>
        ) : (
          <>
            <h3>Drag &amp; drop your spreadsheet</h3>
            <p>
              or <span className="browse-link">browse to choose</span> — .xlsx, .xls, .csv
            </p>
          </>
        )}
      </div>

      {file && (
        <div className="file-selected fade-up">
          <div className="file-icon">📁</div>
          <div className="file-info">
            <div className="file-name">{file.name}</div>
            <div className="file-size">{formatBytes(file.size)}</div>
          </div>
          <button className="file-remove" onClick={removeFile} title="Remove file">✕</button>
        </div>
      )}
    </div>
  );
}
