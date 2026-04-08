/**
 * defaultTemplate.js
 * SVG-based vertical slip template — fully proportional to any 1:2 canvas.
 *
 * Field order:
 *  1. Date & Time
 *  2. Beneficiary Name
 *  3. Account Number
 *  4. IFSC Code
 *  5. Amount
 *  6. Reference Number
 *  7. Transaction Mode
 *  8. Transaction Status
 */

/**
 * @param {object} data       - Row data from Excel
 * @param {number} width      - Canvas width  (px)   e.g. 400
 * @param {number} height     - Canvas height (px)   e.g. 800  (1:2 ratio)
 * @returns {Buffer} SVG buffer
 */
function createSlipSVG(
  { name, account, ifsc, amount, refNo, timestamp, txnMode, txnStatus },
  width  = 400,
  height = 800
) {
  /* ── Theme ────────────────────────────────────────────────── */
  const normalizedStatus = String(txnStatus || '').trim().toLowerCase();
  const isSuccess = normalizedStatus === 'success';

  const headerBg    = isSuccess ? '#1b5e20' : '#b71c1c';
  const accentColor = isSuccess ? '#4caf50' : '#ef5350';
  const statusBg    = isSuccess ? '#e8f5e9' : '#ffebee';
  const statusFg    = isSuccess ? '#2e7d32' : '#c62828';

  /* ── XML-safe helper ──────────────────────────────────────── */
  const safe = (v) =>
    String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const displayMode   = safe(String(txnMode  || 'IMPS').toUpperCase());
  const displayStatus = isSuccess ? 'Success' : 'Failed';

  /* ── Proportional layout (all derived from width / height) ── */
  const CORNER      = Math.round(width * 0.045);          // card corner radius
  const HEADER_H    = Math.round(height * 0.215);         // ~172px at 800h
  const FOOTER_H    = Math.round(height * 0.055);         // ~44px at 800h
  const PAD_X       = Math.round(width * 0.07);           // ~28px at 400w
  const ACCENT_H    = Math.max(3, Math.round(height * 0.004));

  // Icon circle in header
  const ICON_CY     = Math.round(HEADER_H * 0.38);        // ~65px
  const ICON_R_OUTER= Math.round(width * 0.082);          // ~33px
  const ICON_R_INNER= Math.round(width * 0.063);          // ~25px
  const ICON_FONT   = Math.round(ICON_R_INNER * 0.9);

  // Header text
  const TITLE_Y     = Math.round(HEADER_H * 0.82);
  const TITLE_FONT  = Math.max(14, Math.round(width * 0.047));

  // Detail rows — 8 rows split evenly in the body area
  const BODY_START  = HEADER_H + ACCENT_H + Math.round(height * 0.02);
  const BODY_END    = height - FOOTER_H - Math.round(height * 0.012);
  const BODY_H      = BODY_END - BODY_START;
  const ROW_COUNT   = 8;
  const ROW_H       = Math.floor(BODY_H / ROW_COUNT);

  const LABEL_FONT  = Math.max(9,  Math.round(width * 0.026));
  const VALUE_FONT  = Math.max(11, Math.round(width * 0.036));
  const LABEL_OFF   = Math.round(ROW_H * 0.30);
  const VALUE_OFF   = Math.round(ROW_H * 0.68);

  // Footer text
  const FOOTER_FONT = Math.max(8, Math.round(width * 0.022));
  const FOOTER_TY   = height - Math.round(FOOTER_H * 0.25);

  /* ── Row data ─────────────────────────────────────────────── */
  const rows = [
    { label: 'DATE &amp; TIME',      value: safe(timestamp),           mono: false },
    { label: 'BENEFICIARY NAME',     value: safe(name),                mono: false },
    { label: 'ACCOUNT NUMBER',       value: safe(account),             mono: true  },
    { label: 'IFSC CODE',            value: safe(ifsc),                mono: true  },
    { label: 'AMOUNT',               value: `\u20B9 ${safe(amount)}`,  mono: false },
    { label: 'REFERENCE NUMBER',     value: safe(refNo),               mono: true  },
    { label: 'TRANSACTION MODE',     value: displayMode,               mono: false },
    { label: 'TRANSACTION STATUS',   value: displayStatus,             mono: false, colored: true },
  ];

  /* ── Build each detail row ────────────────────────────────── */
  const rowsSVG = rows.map((row, i) => {
    const rowTop  = BODY_START + i * ROW_H;
    const isLast  = (i === rows.length - 1);

    const fontFamily = row.mono
      ? "'Courier New', Courier, monospace"
      : 'Arial, Helvetica, sans-serif';

    const valueColor  = row.colored ? statusFg  : '#1a202c';
    const valueWeight = row.colored ? '700'     : '600';

    // Tinted pill behind the status value
    const pillH   = Math.round(VALUE_FONT * 1.8);
    const pillY   = rowTop + VALUE_OFF - Math.round(pillH * 0.72);
    const pill    = row.colored
      ? `<rect x="${PAD_X}" y="${pillY}" width="${width - PAD_X * 2}" height="${pillH}"
              rx="${Math.round(pillH * 0.3)}" fill="${statusBg}"/>`
      : '';

    const divider = isLast ? '' :
      `<line x1="${PAD_X}" y1="${rowTop + ROW_H - 1}"
             x2="${width - PAD_X}" y2="${rowTop + ROW_H - 1}"
             stroke="#e2e8f0" stroke-width="1"/>`;

    return `
    ${pill}
    <text x="${PAD_X}" y="${rowTop + LABEL_OFF}"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${LABEL_FONT}" font-weight="700"
          fill="#94a3b8" letter-spacing="0.5">${row.label}</text>
    <text x="${PAD_X}" y="${rowTop + VALUE_OFF}"
          font-family="${fontFamily}"
          font-size="${VALUE_FONT}" font-weight="${valueWeight}"
          fill="${valueColor}">${row.value}</text>
    ${divider}`;
  }).join('\n');

  /* ── Full SVG ─────────────────────────────────────────────── */
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg">

  <!-- Card background (white, rounded) -->
  <rect width="${width}" height="${height}" rx="${CORNER}" ry="${CORNER}" fill="#ffffff"/>

  <!-- ── HEADER ── -->
  <rect width="${width}" height="${HEADER_H}" rx="${CORNER}" ry="${CORNER}" fill="${headerBg}"/>
  <!-- square off the bottom rounded corners of the header -->
  <rect y="${HEADER_H - CORNER}" width="${width}" height="${CORNER}" fill="${headerBg}"/>

  <!-- Icon: outer glow ring -->
  <circle cx="${width / 2}" cy="${ICON_CY}" r="${ICON_R_OUTER}"
          fill="rgba(255,255,255,0.15)"/>
  <!-- Icon: white disc -->
  <circle cx="${width / 2}" cy="${ICON_CY}" r="${ICON_R_INNER}"
          fill="rgba(255,255,255,0.92)"/>
  <!-- Icon: tick / cross -->
  <text x="${width / 2}" y="${ICON_CY + Math.round(ICON_FONT * 0.35)}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${ICON_FONT}" font-weight="900"
        fill="${headerBg}" text-anchor="middle">${isSuccess ? '&#10003;' : '&#10005;'}</text>

  <!-- Header title text -->
  <text x="${width / 2}" y="${TITLE_Y}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${TITLE_FONT}" font-weight="700"
        fill="#ffffff" text-anchor="middle">Payment ${isSuccess ? 'Successful' : 'Failed'}</text>

  <!-- Accent bar -->
  <rect y="${HEADER_H}" width="${width}" height="${ACCENT_H}" fill="${accentColor}"/>

  <!-- ── DETAIL ROWS ── -->
  ${rowsSVG}

  <!-- ── FOOTER ── -->
  <rect y="${height - FOOTER_H}" width="${width}" height="${FOOTER_H}"
        rx="0" fill="${headerBg}"/>
  <!-- round only the bottom corners -->
  <rect y="${height - CORNER}" width="${width}" height="${CORNER}"
        rx="${CORNER}" ry="${CORNER}" fill="${headerBg}"/>

  <text x="${width / 2}" y="${FOOTER_TY}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${FOOTER_FONT}" font-weight="500"
        fill="rgba(255,255,255,0.65)" text-anchor="middle">This is a system-generated receipt</text>

</svg>`.trim();

  return Buffer.from(svg);
}

module.exports = { createSlipSVG };
