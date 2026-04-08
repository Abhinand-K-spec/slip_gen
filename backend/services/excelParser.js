/**
 * excelParser.js
 * Converts an Excel/CSV buffer to validated JSON rows.
 * No headers — using positional columns:
 * A: Name, B: Account Number, C: IFSC, D: Amount, E: Reference Number
 */
const XLSX = require('xlsx');

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

  const rows = [];
  const errors = [];
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  rawRows.forEach((row, index) => {
    // Basic validation: must have at least Name and Account Number
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
      timestamp
    });
  });

  return { rows, errors };
}

module.exports = { parseExcelBuffer };
