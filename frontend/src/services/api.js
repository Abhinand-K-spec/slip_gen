import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

/**
 * POST /slips/preview
 */
export async function previewSlip(file, mode, status) {
  const form = new FormData();
  form.append('file', file);
  form.append('mode', mode);
  form.append('status', status);
  const { data } = await API.post('/slips/preview', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/**
 * POST /slips/generate — triggers zip download
 */
export async function generateSlips(file, mode, status, onProgress) {
  const form = new FormData();
  form.append('file', file);
  form.append('mode', mode);
  form.append('status', status);

  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/slips/generate`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Server error ${response.status}`);
  }

  // Stream response body to track download progress
  const contentLength = response.headers.get('Content-Length');
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (contentLength && onProgress) {
      onProgress(Math.round((received / parseInt(contentLength)) * 100));
    }
  }

  if (onProgress) onProgress(100);

  const blob = new Blob(chunks, { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `slips_${Date.now()}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
