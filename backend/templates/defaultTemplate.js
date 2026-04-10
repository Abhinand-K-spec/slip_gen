/**
 * defaultTemplate.js
 * Redesigned to match GPay Green & White theme layout
 * (No bank pill at the top, tick instead of avatar, RSD logo footer)
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
  const BG_COLOR = '#ffffff';
  const CARD_BG = '#ffffff';
  const CARD_BORDER = '#e5e7eb'; // gray-200
  const BOLD_TEXT = '#111827'; // gray-900
  const NORMAL_TEXT = '#374151'; // gray-700
  const LIGHT_TEXT = '#6b7280'; // gray-500

  const SUCCESS_COLOR = '#22c55e'; // green-500
  const FAIL_COLOR = '#ef4444'; // red-500
  const PRIMARY = isSuccess ? SUCCESS_COLOR : FAIL_COLOR;

  /* ── Scale ─────────────────────────────────────────────── */
  const sx = width / 400;
  const s = (px) => Math.round(px * sx);
  const sf = (px) => Math.round(px * sx);
  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const FF = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  /* ── Elements Setup ──────────────────────────────────────── */
  const centerX = width / 2;
  let currentY = s(30); // Top padding

  // 1. Top Icon (Tick or Cross inside circle)
  const ICON_R = s(26);
  const ICON_CY = currentY + ICON_R;
  const iconMark = isSuccess
    ? `<circle cx="${centerX}" cy="${ICON_CY}" r="${ICON_R}" fill="${PRIMARY}" />
       <path d="M ${centerX - s(9)} ${ICON_CY + s(2)} L ${centerX - s(3)} ${ICON_CY + s(8)} L ${centerX + s(11)} ${ICON_CY - s(6)}"
             fill="none" stroke="#ffffff" stroke-width="${s(4.5)}" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<circle cx="${centerX}" cy="${ICON_CY}" r="${ICON_R}" fill="${PRIMARY}" />
       <path d="M ${centerX - s(8)} ${ICON_CY - s(8)} L ${centerX + s(8)} ${ICON_CY + s(8)}
                M ${centerX + s(8)} ${ICON_CY - s(8)} L ${centerX - s(8)} ${ICON_CY + s(8)}"
             fill="none" stroke="#ffffff" stroke-width="${s(4.5)}" stroke-linecap="round" stroke-linejoin="round"/>`;

  currentY = ICON_CY + ICON_R; // Bottom edge of the circle

  // 2. Name & Account
  currentY += s(32); // Gap to Name baseline
  const nameSvg = `<text x="${centerX}" y="${currentY}" font-family="${FF}" font-size="${sf(18)}" font-weight="500" fill="${BOLD_TEXT}" text-anchor="middle">${esc(name)}</text>`;
  
  currentY += s(24); // Gap to Account baseline
  const accSvg = `<text x="${centerX}" y="${currentY}" font-family="${FF}" font-size="${sf(14)}" font-weight="400" fill="${NORMAL_TEXT}" text-anchor="middle">${esc(account) ? esc(account) : 'Bank Transfer'}</text>`;

  // 3. Amount
  currentY += s(54); // Large gap for huge text ascenders
  const amountSvg = `<text x="${centerX}" y="${currentY}" font-family="${FF}" font-size="${sf(56)}" font-weight="300" fill="${BOLD_TEXT}" text-anchor="middle">&#8377;${esc(amount)}</text>`;

  // 4. Status Indicator (small icon + "Success" text)
  currentY += s(24); // Gap to Status baseline
  const STATUS_TEXT = isSuccess ? 'Success' : 'Failed';
  const smallIconR = s(9);

  // Center alignment for status group
  const textWidthEst = STATUS_TEXT.length * sf(8);
  const groupWidth = (smallIconR * 2) + s(8) + textWidthEst;
  const startX = centerX - (groupWidth / 2);
  const SM_ICON_CX = startX + smallIconR;
  const SM_ICON_CY = currentY - s(5); // Center icon relative to text baseline

  const smallIconSVG = isSuccess
    ? `<circle cx="${SM_ICON_CX}" cy="${SM_ICON_CY}" r="${smallIconR}" fill="${PRIMARY}" />
       <path d="M ${SM_ICON_CX - s(3)} ${SM_ICON_CY} L ${SM_ICON_CX - s(1)} ${SM_ICON_CY + s(3)} L ${SM_ICON_CX + s(4)} ${SM_ICON_CY - s(2)}" fill="none" stroke="#ffffff" stroke-width="${s(2)}" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<circle cx="${SM_ICON_CX}" cy="${SM_ICON_CY}" r="${smallIconR}" fill="${PRIMARY}" />
       <path d="M ${SM_ICON_CX - s(3)} ${SM_ICON_CY - s(3)} L ${SM_ICON_CX + s(3)} ${SM_ICON_CY + s(3)} M ${SM_ICON_CX + s(3)} ${SM_ICON_CY - s(3)} L ${SM_ICON_CX - s(3)} ${SM_ICON_CY + s(3)}" fill="none" stroke="#ffffff" stroke-width="${s(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;

  const statusSvg = `
    ${smallIconSVG}
    <text x="${SM_ICON_CX + s(16)}" y="${currentY}" font-family="${FF}" font-size="${sf(15)}" font-weight="500" fill="${PRIMARY}" text-anchor="start">${STATUS_TEXT}</text>
  `;

  // 5. Date & Time
  currentY += s(18);
  const timeSvg = `<text x="${centerX}" y="${currentY}" font-family="${FF}" font-size="${sf(13)}" font-weight="400" fill="${LIGHT_TEXT}" text-anchor="middle">${esc(timestamp)}</text>`;

  // 6. Detailed Card
  currentY += s(18); // Gap before card Top Edge
  const startCardY = currentY;

  const CARD_M = s(16);
  const CARD_W = width - (CARD_M * 2);
  const CARD_R = s(16);

  let cardInnerY = startCardY + s(20); // Top padding inside card

  const accountInfo = [];
  if (account) accountInfo.push(`A/C: ${esc(account)}`);
  if (ifsc) accountInfo.push(`IFSC: ${esc(ifsc)}`);

  const cardDetails = [
    { label: 'Transaction ID', value: esc(refNo) },
    { label: `To: ${esc(name)}`, value: accountInfo.length > 0 ? accountInfo.join(' • ') : 'Bank Transfer' },
    { label: 'Payment Mode', value: esc(txnMode) },
    { label: 'Amount in Words', value: convertToIndianWords(amount) },
  ];

  let cardContentSvg = '';
  for (let i = 0; i < cardDetails.length; i++) {
    const d = cardDetails[i];
    cardContentSvg += `<text x="${CARD_M + s(24)}" y="${cardInnerY}" font-family="${FF}" font-size="${sf(14)}" font-weight="600" fill="${BOLD_TEXT}">${d.label}</text>\n`;
    cardInnerY += s(18);

    const lines = wrapText(d.value, 46);
    for (const line of lines) {
      cardContentSvg += `<text x="${CARD_M + s(24)}" y="${cardInnerY}" font-family="${FF}" font-size="${sf(14)}" font-weight="400" fill="${NORMAL_TEXT}">${line}</text>\n`;
      cardInnerY += s(18);
    }
    cardInnerY += s(8); // block spacing
  }

  cardInnerY += s(12); // Bottom padding inside card
  const CARD_H = cardInnerY - startCardY;

  const cardBoxSvg = `<rect x="${CARD_M}" y="${startCardY}" width="${CARD_W}" height="${CARD_H}" rx="${CARD_R}" ry="${CARD_R}" fill="${CARD_BG}" stroke="${CARD_BORDER}" stroke-width="${s(1.2)}"/>`;

  currentY = startCardY + CARD_H; // Set currentY to bottom edge of card

  // 7. Disclaimer
  currentY += s(24); // Gap below card for disclaimer
  const disclaimerSvg = `<text x="${centerX}" y="${currentY}" font-family="${FF}" font-size="${sf(10)}" font-weight="600" fill="${LIGHT_TEXT}" text-anchor="middle" letter-spacing="0.8">CONNECTED BANKING - POWERED BY</text>`;

  // 8. Footer (RSD Logo at bottom)
  currentY += s(24); // Gap before footer
  const LOGO_FS = sf(24);
  const PS_FS = sf(18);
  const GAP = sf(8);
  const LOGO_W = sf(48);
  const PS_W = sf(160);
  const BLOCK_W = LOGO_W + GAP + PS_W;
  const BLOCK_X = Math.round((width - BLOCK_W) / 2) + s(4);

  const footerSvg = `
  <g transform="translate(${BLOCK_X}, ${currentY})">
    <text x="0" y="0" font-family="${FF}" font-size="${LOGO_FS}" font-weight="900" fill="#1f2937">R</text>
    <text x="${sf(16)}" y="0" font-family="${FF}" font-size="${LOGO_FS}" font-weight="900" fill="${PRIMARY}">S</text>
    <text x="${sf(32)}" y="0" font-family="${FF}" font-size="${LOGO_FS}" font-weight="900" fill="#1f2937">D</text>
    <path d="M ${sf(12)} ${sf(-4)} Q ${sf(24)} ${sf(-16)} ${sf(38)} ${sf(-18)}" fill="none" stroke="${PRIMARY}" stroke-width="${sf(2.5)}" stroke-linecap="round"/>
    <polygon points="${sf(38)},${sf(-23)} ${sf(44)},${sf(-16)} ${sf(36)},${sf(-13)}" fill="${PRIMARY}"/>
    <text x="${LOGO_W + GAP}" y="${sf(-1)}" font-family="${FF}" font-size="${PS_FS}" font-weight="600" fill="#1f2937" text-anchor="start" letter-spacing="0.5">Payment Solution</text>
  </g>`;

  // Final padding at the bottom of the image
  currentY += s(24);

  // Set final height to dynamically wrap content if it overflows bounds
  const finalSvgHeight = Math.max(height, currentY);

  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${finalSvgHeight}" viewBox="0 0 ${width} ${finalSvgHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${finalSvgHeight}" rx="${s(24)}" ry="${s(24)}" fill="${BG_COLOR}"/>
  ${iconMark}
  ${nameSvg}
  ${accSvg}
  ${amountSvg}
  ${statusSvg}
  ${timeSvg}
  ${cardBoxSvg}
  ${cardContentSvg}
  ${disclaimerSvg}
  ${footerSvg}
</svg>`);

  return { svg };
}

module.exports = { createSlipSVG };
