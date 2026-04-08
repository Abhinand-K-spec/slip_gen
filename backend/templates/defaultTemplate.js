/**
 * defaultTemplate.js — Redesigned to match reference image layout
 * Portrait slip: 400 × 800 base (scaled 2× internally for HiDPI)
 *
 * Returns { svg: Buffer }
 */

function convertToIndianWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  let n = parseInt(String(num ?? '0').replace(/,/g, ''), 10);
  if (isNaN(n) || n === 0) return 'Zero Rupees Only';

  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  }

  return convert(n).trim() + ' Rupees Only';
}

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function createSlipSVG(
  { name, account, ifsc, amount, refNo, timestamp, txnMode, txnStatus } = {},
  width,
  height
) {
  const isSuccess = String(txnStatus || '').trim().toLowerCase() === 'success';

  /* ── Colors ─────────────────────────────────────────────── */
  const PALE_BG      = isSuccess ? '#e0f2fe' : '#ffebee';      // Light blue 100 instead of green
  const PRIMARY_TEXT = isSuccess ? '#0284c7' : '#c62828';      // Blue 600 instead of green
  const BOLD_TEXT    = '#1a202c';
  const LIGHT_TEXT   = '#94a3b8';
  const DIVIDER      = '#e2e8f0';
  const ICON_COLOR   = isSuccess ? '#0ea5e9' : '#f44336';      // Sky blue 500 instead of green

  /* ── Escape helper ───────────────────────────────────────── */
  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ── Scale helpers ────────────────────────────────────────── */
  // Use uniform scale based on width so elements keep aspect ratio
  const sx = width  / 400;
  const s  = (px) => Math.round(px * sx);
  const sf = (px) => Math.round(px * sx);

  /* ── Font ─────────────────────────────────────────────────── */
  const FF = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  /* ── Layout constants ─────────────────────────────────────── */
  const CARD_R  = s(16);
  const PAD_X   = s(24);
  const HDR_H   = s(205);
  const ICON_CY = s(50);
  const ICON_R  = s(32);
  const ICON_IR = s(20);
  /* ── Amount in words ─────────────────────────────────────── */
  const amountWords = convertToIndianWords(amount);
  const wordLines   = wrapText(amountWords, 32);

  /* ── Detail rows ─────────────────────────────────────────── */
  const details = [
    { lbl: 'Date',       val: esc(timestamp) },
    { lbl: 'Remarks',    val: esc(refNo)     },
    { lbl: 'Mode',       val: esc(txnMode)   },
    { lbl: 'Account No', val: esc(account)   },
    { lbl: 'Name',       val: esc(name)      },
    { lbl: 'Status',     val: isSuccess ? 'Success' : 'Failed', status: true },
  ];

  // Fixed smaller row heights for a tighter table layout, leaving padding at the bottom
  const ROW_H      = s(34);
  const TABLE_MARGIN = s(8); // Gap below the blue header
  const ROWS_START = HDR_H + TABLE_MARGIN;
  const FOOTER_SEP_Y = ROWS_START + details.length * ROW_H;

  const gridSVG = details.map((d, i) => {
    const rowY     = ROWS_START + i * ROW_H;
    const midY     = rowY + ROW_H / 2;
    const lblY     = Math.round(midY + sf(4.5)); // optically vertical center
    const valColor = d.status ? PRIMARY_TEXT : BOLD_TEXT;
    const valWgt   = d.status ? '700' : '500';
    const sep = i > 0
      ? `<line x1="${PAD_X}" y1="${rowY}" x2="${width - PAD_X}" y2="${rowY}" stroke="${DIVIDER}" stroke-width="1"/>`
      : '';
    return `
    ${sep}
    <text x="${PAD_X}" y="${lblY}"
          font-family="${FF}" font-size="${sf(13)}"
          font-weight="400" fill="${LIGHT_TEXT}">${d.lbl}</text>
    <text x="${width - PAD_X}" y="${lblY}"
          font-family="${FF}" font-size="${sf(13)}"
          font-weight="${valWgt}" fill="${valColor}" text-anchor="end">${d.val}</text>
    `;
  }).join('\n');

  /* ── Status icon mark ────────────────────────────────────── */
  const iconMark = isSuccess
    ? `<path d="M ${width / 2 - s(8)} ${ICON_CY} L ${width / 2 - s(2)} ${ICON_CY + s(7)} L ${width / 2 + s(10)} ${ICON_CY - s(8)}"
             fill="none" stroke="#fff" stroke-width="${s(4)}" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<path d="M ${width / 2 - s(7)} ${ICON_CY - s(7)} L ${width / 2 + s(7)} ${ICON_CY + s(7)}
              M ${width / 2 + s(7)} ${ICON_CY - s(7)} L ${width / 2 - s(7)} ${ICON_CY + s(7)}"
             fill="none" stroke="#fff" stroke-width="${s(4)}" stroke-linecap="round" stroke-linejoin="round"/>`;

  /* ── Amount words tspans ─────────────────────────────────── */
  const wordTspans = wordLines.map((line, i) =>
    `<tspan x="${width / 2}" dy="${i === 0 ? '0' : sf(18)}">${line}</tspan>`
  ).join('');

  /* ── Footer layout ───────────────────────────────────────── */
  const FOOTER_LBL_Y = height - s(40);

  // Compact RSD logo — use sf() so sizing is relative to the shorter axis (width)
  const LOGO_FS     = sf(16);           // font-size for R, S, D
  const LOGO_W      = sf(34);           // approximate rendered width of "RSD"
  const PS_FS       = sf(13);           // "PAYMENT SOLUTION" font-size
  const GAP         = sf(6);            // gap between logo and text
  
  // "PAYMENT SOLUTION" is 16 uppercase bold chars (approx 0.75em width each) + 0.6px letter spacing
  const PS_W        = sf(165);          // approx width of "PAYMENT SOLUTION"
  const BLOCK_W     = LOGO_W + GAP + PS_W;

  // Nudge the logo block slightly to the right as requested
  const RIGHT_NUDGE = sf(14);
  const BLOCK_X     = Math.round((width - BLOCK_W) / 2) + RIGHT_NUDGE;  // left edge of the whole group
  const BASELINE_Y  = height - s(14);  // shared text baseline for logo & text

  const PS_X = BLOCK_X + LOGO_W + GAP;

  // Swoosh coordinates (relative to BLOCK_X, BASELINE_Y origin → use sf)
  const SW_X1 = sf(8),  SW_Y1 = sf(-2);
  const SW_CX = sf(16), SW_CY = sf(4);
  const SW_X2 = sf(32), SW_Y2 = sf(-14);
  const ARR_X = sf(36), ARR_Y = sf(-16);
  const ARR_L = sf(30), ARR_LY = sf(-16);

  const logoSVG = `
  <g transform="translate(${BLOCK_X}, ${BASELINE_Y})">
    <!-- R -->
    <text x="0" y="0"
          font-family="${FF}" font-size="${LOGO_FS}" font-weight="900"
          fill="#1a3a6b">R</text>
    <!-- S (accent blue) -->
    <text x="${sf(12)}" y="0"
          font-family="${FF}" font-size="${LOGO_FS}" font-weight="900"
          fill="#4a7fb5">S</text>
    <!-- D -->
    <text x="${sf(23)}" y="0"
          font-family="${FF}" font-size="${LOGO_FS}" font-weight="900"
          fill="#1a3a6b">D</text>
    <!-- Clean diagonal swoosh arrow (thin line + arrowhead) -->
    <line x1="${sf(9)}" y1="${sf(-1)}" x2="${sf(30)}" y2="${sf(-14)}"
          stroke="#4a7fb5" stroke-width="${sf(2)}" stroke-linecap="round"/>
    <polygon points="${sf(30)},${sf(-17)} ${sf(34)},${sf(-12)} ${sf(28)},${sf(-11)}"
             fill="#4a7fb5"/>
  </g>`;

  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg">

  <!-- White card background -->
  <rect width="${width}" height="${height}" rx="${CARD_R}" ry="${CARD_R}" fill="#ffffff"/>

  <!-- Pale header with white border gap -->
  <rect x="${s(12)}" y="${s(12)}" width="${width - s(24)}" height="${HDR_H - s(12)}"
        rx="${CARD_R}" ry="${CARD_R}" fill="${PALE_BG}"/>
  <rect x="${s(12)}" y="${HDR_H - CARD_R}" width="${width - s(24)}" height="${CARD_R}" fill="${PALE_BG}"/>

  <!-- Status icon outer circle -->
  <circle cx="${width / 2}" cy="${ICON_CY}" r="${ICON_R}"
          fill="#ffffff" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.08))"/>
  <!-- Coloured inner circle -->
  <circle cx="${width / 2}" cy="${ICON_CY}" r="${ICON_IR}" fill="${ICON_COLOR}"/>
  ${iconMark}

  <!-- Payment Successful / Failed -->
  <text x="${width / 2}" y="${s(95)}"
        font-family="${FF}" font-size="${sf(18)}" font-weight="700"
        fill="${PRIMARY_TEXT}" text-anchor="middle">Payment ${isSuccess ? 'Successful' : 'Failed'}</text>

  <!-- Large rupee amount -->
  <text x="${width / 2}" y="${s(138)}"
        font-family="${FF}" font-size="${sf(32)}" font-weight="800"
        fill="${BOLD_TEXT}" text-anchor="middle">&#8377; ${esc(amount)}</text>

  <!-- Amount in words -->
  <text font-family="${FF}" font-size="${sf(12)}" font-weight="500"
        fill="${BOLD_TEXT}" text-anchor="middle">
    <tspan x="${width / 2}" y="${s(165)}">${wordTspans}</tspan>
  </text>

  <!-- Separator: header → body (aligned with table) -->
  <line x1="${PAD_X}" y1="${ROWS_START}" x2="${width - PAD_X}" y2="${ROWS_START}" stroke="${DIVIDER}" stroke-width="1"/>

  <!-- Detail rows -->
  ${gridSVG}

  <!-- Footer separator (aligned with table) -->
  <line x1="${PAD_X}" y1="${FOOTER_SEP_Y}" x2="${width - PAD_X}" y2="${FOOTER_SEP_Y}" stroke="${DIVIDER}" stroke-width="1"/>

  <!-- "CONNECTED BANKING – POWERED BY" label -->
  <text x="${width / 2}" y="${FOOTER_LBL_Y}"
        font-family="${FF}" font-size="${sf(9)}" font-weight="500"
        fill="${LIGHT_TEXT}" text-anchor="middle" letter-spacing="0.8">CONNECTED BANKING - POWERED BY</text>

  <!-- Inline compact RSD logo -->
  ${logoSVG}

  <!-- PAYMENT SOLUTION text aligned to logo baseline -->
  <text x="${PS_X}" y="${BASELINE_Y}"
        font-family="${FF}" font-size="${PS_FS}" font-weight="700"
        fill="#1a3a6b" text-anchor="start" letter-spacing="0.6">PAYMENT SOLUTION</text>

</svg>`);

  return { svg };
}

module.exports = { createSlipSVG };
