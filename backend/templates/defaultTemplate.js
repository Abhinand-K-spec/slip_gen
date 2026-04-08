/**
 * defaultTemplate.js — Vertical slip, 1:2 aspect (400 × 800 default)
 *
 * Fields (top → bottom):
 *  1. Date & Time        5. Amount
 *  2. Beneficiary Name   6. Reference Number
 *  3. Account Number     7. Transaction Mode
 *  4. IFSC Code          8. Transaction Status
 */

function createSlipSVG(
  { name, account, ifsc, amount, refNo, timestamp, txnMode, txnStatus },
  width  = 400,
  height = 800
) {
  /* ── Theme ──────────────────────────────────────────────── */
  const isSuccess = String(txnStatus || '').trim().toLowerCase() === 'success';

  const HEADER_COLOR = isSuccess ? '#1b5e20' : '#b71c1c';
  const ACCENT_COLOR = isSuccess ? '#43a047' : '#e53935';
  const STATUS_BG    = isSuccess ? '#e8f5e9' : '#ffebee';
  const STATUS_FG    = isSuccess ? '#2e7d32' : '#c62828';

  /* ── XML-safe helper ────────────────────────────────────── */
  const x = (v) =>
    String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const MODE   = x(String(txnMode  || 'IMPS').toUpperCase());
  const STATUS = isSuccess ? 'Success' : 'Failed';

  /* ── Scale factors (base design is 400 × 800) ───────────── */
  const sx = width  / 400;   // horizontal scale
  const sy = height / 800;   // vertical scale

  function s(px)  { return Math.round(px * sx); }   // scale x
  function sv(px) { return Math.round(px * sy); }   // scale y
  function sf(px) { return Math.round(px * Math.min(sx, sy)); } // scale font

  /* ── Layout (base coords — 400 × 800) ──────────────────── */
  // Header
  const HDR_H   = sv(190);   // header band height
  const CORNER  = s(14);     // card corner radius
  const ICON_CY = sv(82);    // icon circle centre-y
  const ICON_R1 = s(30);     // outer (glow) radius
  const ICON_R2 = s(22);     // inner (white) radius
  const ICON_FZ = sf(24);    // tick/cross font size
  const TITLE_Y = sv(155);   // "Payment Successful" baseline-y
  const TITLE_FZ= sf(19);
  const ACC_Y   = HDR_H;     // accent bar top
  const ACC_H   = sv(4);     // accent bar height

  // Body rows — 8 rows start after header + small gap
  const BODY_TOP = HDR_H + ACC_H + sv(8);
  const FTR_H    = sv(42);              // footer height
  const BODY_BOT = height - FTR_H;
  const BODY_H   = BODY_BOT - BODY_TOP;
  const ROW_H    = Math.floor(BODY_H / 8);  // ≈ 70px at 800h

  // Inside each row
  const PAD_X    = s(24);
  const LBL_FZ   = sf(10);
  const VAL_FZ   = sf(15);
  const LBL_OFF  = Math.round(ROW_H * 0.32);  // label baseline from row top
  const VAL_OFF  = Math.round(ROW_H * 0.72);  // value baseline from row top
  const DIV_OFF  = ROW_H - 1;                  // divider y from row top

  // Status pill
  const PILL_H   = Math.round(VAL_FZ * 1.9);
  const PILL_Y_O = Math.round(VAL_FZ * 1.45);  // pill top = value_baseline - this

  // Footer text
  const FTR_FZ   = sf(10);
  const FTR_TY   = height - Math.round(FTR_H * 0.28);

  /* ── Row data ───────────────────────────────────────────── */
  const rows = [
    { lbl: 'DATE &amp; TIME',    val: x(timestamp),          mono: false },
    { lbl: 'BENEFICIARY NAME',   val: x(name),               mono: false },
    { lbl: 'ACCOUNT NUMBER',     val: x(account),            mono: true  },
    { lbl: 'IFSC CODE',          val: x(ifsc),               mono: true  },
    { lbl: 'AMOUNT',             val: `\u20B9 ${x(amount)}`, mono: false },
    { lbl: 'REFERENCE NUMBER',   val: x(refNo),              mono: true  },
    { lbl: 'TRANSACTION MODE',   val: MODE,                  mono: false },
    { lbl: 'TRANSACTION STATUS', val: STATUS,                mono: false, status: true },
  ];

  /* ── Render rows ────────────────────────────────────────── */
  const NAME_FF  = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  const MONO_FF  = "Menlo, Monaco, Consolas, 'Courier New', monospace";
  const SANS_FF  = "Arial, Helvetica, sans-serif";

  const rowsSVG = rows.map((r, i) => {
    const ry     = BODY_TOP + i * ROW_H;
    const isLast = i === rows.length - 1;

    // Use name font only for the Name row; all others get the character-distinct font
    const isNameField = r.lbl === 'BENEFICIARY NAME';
    const ff       = isNameField ? NAME_FF : MONO_FF;
    const valColor = r.status ? STATUS_FG : '#1a202c';
    const valWgt   = r.status ? '700' : '600';

    const pill = r.status
      ? `<rect x="${PAD_X}" y="${ry + VAL_OFF - PILL_Y_O}"
               width="${width - PAD_X * 2}" height="${PILL_H}"
               rx="${Math.round(PILL_H * 0.3)}" fill="${STATUS_BG}"/>`
      : '';

    const div = isLast ? '' :
      `<line x1="${PAD_X}" y1="${ry + DIV_OFF}"
             x2="${width - PAD_X}" y2="${ry + DIV_OFF}"
             stroke="#e2e8f0" stroke-width="1"/>`;

    return `
  ${pill}
  <text x="${PAD_X}" y="${ry + LBL_OFF}"
        font-family="${SANS_FF}" font-size="${LBL_FZ}"
        font-weight="700" fill="#94a3b8" letter-spacing="0.5">${r.lbl}</text>
  <text x="${PAD_X}" y="${ry + VAL_OFF}"
        font-family="${ff}" font-size="${VAL_FZ}"
        font-weight="${valWgt}" fill="${valColor}">${r.val}</text>
  ${div}`;
  }).join('\n');

  /* ── SVG output ─────────────────────────────────────────── */
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
     xmlns="http://www.w3.org/2000/svg">

  <!-- White card -->
  <rect width="${width}" height="${height}" rx="${CORNER}" ry="${CORNER}" fill="#fff"/>

  <!-- Header band (rounded top, square bottom) -->
  <rect width="${width}" height="${HDR_H}" rx="${CORNER}" ry="${CORNER}" fill="${HEADER_COLOR}"/>
  <rect y="${HDR_H - CORNER}" width="${width}" height="${CORNER}" fill="${HEADER_COLOR}"/>

  <!-- Icon: glow ring + white disc -->
  <circle cx="${s(200)}" cy="${ICON_CY}" r="${ICON_R1}" fill="rgba(255,255,255,0.18)"/>
  <circle cx="${s(200)}" cy="${ICON_CY}" r="${ICON_R2}" fill="rgba(255,255,255,0.93)"/>
  ${isSuccess ? `
  <path d="M ${s(200) - s(9)} ${ICON_CY} L ${s(200) - s(2)} ${ICON_CY + s(7)} L ${s(200) + s(11)} ${ICON_CY - s(9)}"
        fill="none" stroke="${HEADER_COLOR}" stroke-width="${s(5)}" stroke-linecap="round" stroke-linejoin="round"/>
  ` : `
  <path d="M ${s(200) - s(9)} ${ICON_CY - s(9)} L ${s(200) + s(9)} ${ICON_CY + s(9)} M ${s(200) + s(9)} ${ICON_CY - s(9)} L ${s(200) - s(9)} ${ICON_CY + s(9)}"
        fill="none" stroke="${HEADER_COLOR}" stroke-width="${s(5)}" stroke-linecap="round" stroke-linejoin="round"/>
  `}

  <!-- Header title -->
  <text x="${s(200)}" y="${TITLE_Y}"
        font-family="${SANS_FF}" font-size="${TITLE_FZ}" font-weight="700"
        fill="#fff" text-anchor="middle">Payment ${isSuccess ? 'Successful' : 'Failed'}</text>

  <!-- Accent stripe -->
  <rect y="${ACC_Y}" width="${width}" height="${ACC_H}" fill="${ACCENT_COLOR}"/>

  <!-- Detail rows -->
  ${rowsSVG}

  <!-- Footer band (rounded bottom, square top) -->
  <rect y="${BODY_BOT}" width="${width}" height="${FTR_H}" fill="${HEADER_COLOR}"/>
  <rect y="${height - CORNER}" width="${width}" height="${CORNER}"
        rx="${CORNER}" ry="${CORNER}" fill="${HEADER_COLOR}"/>

  <text x="${s(200)}" y="${FTR_TY}"
        font-family="${SANS_FF}" font-size="${FTR_FZ}" font-weight="400"
        fill="rgba(255,255,255,0.65)" text-anchor="middle">This is a system-generated receipt</text>

</svg>`);
}

module.exports = { createSlipSVG };
