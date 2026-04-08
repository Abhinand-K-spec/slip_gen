/**
 * excelParser.js
 * Converts an Excel/CSV buffer to validated JSON rows.
 * No headers — using positional columns:
 * A: Name, B: Account Number, C: IFSC, D: Amount, E: Reference Number
 */
const XLSX = require('xlsx');

function getRandomTimeRange(count) {
  const now = new Date();
  
  // Start time: 9:00 AM Today
  const startTime = new Date(now.getTime());
  startTime.setHours(9, 0, 0, 0);

  // End time: Right now
  const endTime = now.getTime();
  const startMs = startTime.getTime();
  const rangeMs = endTime - startMs;

  // If the upload happens before 9 AM (unlikely but possible), 
  // allow a small fallback window from 9 AM to 9:05 AM.
  const activeRange = rangeMs > 0 ? rangeMs : 300000; 

  // Generate unique randomized timestamps within the range
  const offsets = [];
  for (let i = 0; i < count; i++) {
    offsets.push(Math.floor(Math.random() * activeRange));
  }
  // Sort them to keep a somewhat chronological but random order
  offsets.sort((a, b) => a - b);

  return offsets.map(offset => {
    const d = new Date(startMs + offset);
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  });
}

/**
 * Parse an xlsx/csv buffer into validated rows.
 * @param {Buffer} buffer - File buffer from multer
 * @returns {{ rows: object[], errors: { row: number, reason: string }[] }}
 */
function parseExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw Object.assign(new Error('The uploaded file contains no sheets.'), { status: 400 });
  }

  const sheet = workbook.Sheets[sheetName];
  // header: 1 returns an array of arrays
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (rawRows.length === 0) {
    throw Object.assign(new Error('The spreadsheet has no data rows.'), { status: 400 });
  }

  // Pre-calculate randomized timestamps for valid rows
  // First, filter to see how many valid rows we have
  const validIndices = [];
  rawRows.forEach((row, i) => {
    const name = String(row[0] || '').trim();
    const account = String(row[1] || '').trim();
    if (name && account) validIndices.push(i);
  });

  const timestamps = getRandomTimeRange(validIndices.length);

  const rows = [];
  const errors = [];
  let validCount = 0;

  rawRows.forEach((row, index) => {
    const name    = String(row[0] || '').trim();
    const account = String(row[1] || '').trim();
    const ifsc    = String(row[2] || '').trim();
    const amount  = String(row[3] || '').trim();
    const refNo   = String(row[4] || '').trim();

    if (!name || !account) {
      if (name || account || ifsc || amount || refNo) {
        errors.push({
          row: index + 1,
          reason: 'Missing Name or Account Number',
          data: row
        });
      }
      return;
    }

    rows.push({
      name,
      account,
      ifsc,
      amount,
      refNo: (refNo || '—').toUpperCase(),
      timestamp: timestamps[validCount++]
    });
  });

  return { rows, errors };
}

module.exports = { parseExcelBuffer };
