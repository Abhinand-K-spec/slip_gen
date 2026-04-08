/**
 * imageGenerator.js
 * Generates a slip image Buffer using Sharp + SVG composite.
 *
 * Why Sharp over node-canvas for high concurrency:
 *  - Sharp wraps libvips which has its own C-level thread pool.
 *    Multiple Sharp operations run in parallel without blocking the JS event loop.
 *  - Canvas renders bitmaps into the JS heap — at scale this causes GC pressure
 *    and OOM errors. Sharp streams tile chunks, keeping memory constant.
 *  - Sharp produces JPEG at 5–10× the speed of canvas for typical slip sizes.
 */
const sharp = require('sharp');
const { createSlipSVG } = require('../templates/defaultTemplate');

const path = require('path');

const rawWidth = parseInt(process.env.SLIP_WIDTH || '400', 10);
const rawHeight = parseInt(process.env.SLIP_HEIGHT || '800', 10);
// Ensure portrait orientation: smaller dimension is width, larger is height
// Multiplying by 2 for "High DPI" clarity
const WIDTH = Math.min(rawWidth, rawHeight) * 2;
const HEIGHT = Math.max(rawWidth, rawHeight) * 2;
const FORMAT = (process.env.SLIP_OUTPUT_FORMAT || 'jpg').toLowerCase();

async function generateSlip(rowData) {
  if (!rowData) {
    throw new Error('generateSlip called with null or undefined rowData');
  }

  const { svg } = createSlipSVG(rowData, WIDTH, HEIGHT);

  if (!svg || !Buffer.isBuffer(svg)) {
    throw new Error('createSlipSVG failed to return a valid Buffer in the svg field');
  }

  // Load SVG into Sharp (SVG natively handles the logo)
  const pipeline = sharp(svg);

  if (FORMAT === 'png') {
    return pipeline.png({ compressionLevel: 7 }).toBuffer();
  }

  // Default: JPEG
  return pipeline.jpeg({ quality: 95, mozjpeg: true }).toBuffer();
}

/**
 * Extension for the output file based on env config.
 */
const SLIP_EXT = FORMAT === 'png' ? 'png' : 'jpg';

module.exports = { generateSlip, SLIP_EXT };
