/**
 * excelParser.js
 * Converts an Excel/CSV buffer to validated JSON rows.
 * No headers — using positional columns:
 * A: Name, B: Account Number, C: IFSC, D: Amount, E: Reference Number
 */
const XLSX = require('xlsx');

function getRandomTimeRange(count) {
  const now = new Date();
  const TEN_MINUTES_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

  // Window: current time ± 10 minutes
  const startMs = now.getTime() - TEN_MINUTES_MS;
  const rangeMs = TEN_MINUTES_MS * 2; // total 20-minute window

  // Generate random offsets within the ±10 min window
  const offsets = [];
  for (let i = 0; i < count; i++) {
    offsets.push(Math.floor(Math.random() * rangeMs));
  }
  // Sort to keep a somewhat chronological but random order
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
