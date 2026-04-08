/**
 * slipRoutes.js
 * POST /api/slips/preview  — parse file, return first-row preview image (base64)
 * POST /api/slips/generate — full batch generation, streams zip to client
 */
const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const { parseExcelBuffer } = require('../services/excelParser');
const { generateSlip, SLIP_EXT } = require('../services/imageGenerator');
const { pool } = require('../services/workerPool');

const router = express.Router();

// Multer: memory storage, accept xlsx/xls/csv only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10) * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel',                                           // xls
      'text/csv',
      'application/csv',
    ];
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowed.includes(file.mimetype) || ['xlsx', 'xls', 'csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Only .xlsx, .xls, or .csv files are accepted.'), { status: 400 }));
    }
  },
});

// ─── POST /api/slips/preview ─────────────────────────────────────────────────
router.post('/preview', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { rows, errors } = parseExcelBuffer(req.file.buffer);

    if (rows.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'No valid rows found in the file.',
        errors,
      });
    }

    const { mode, status } = req.body;

    // Generate preview for first valid row
    const previewBuffer = await generateSlip({
      ...rows[0],
      txnMode: mode || 'IMPS',
      txnStatus: status || 'Success'
    });
    const base64 = previewBuffer.toString('base64');
    const mimeType = SLIP_EXT === 'png' ? 'image/png' : 'image/jpeg';

    return res.json({
      success: true,
      totalRows: rows.length,
      skippedRows: errors.length,
      errors,
      firstRow: rows[0],
      preview: `data:${mimeType};base64,${base64}`,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/slips/generate ─────────────────────────────────────────────────
// Streams a zip of all generated slips directly to client.
router.post('/generate', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { rows, errors } = parseExcelBuffer(req.file.buffer);

    if (rows.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'No valid rows found.',
        errors,
      });
    }

    const archive = archiver('zip', { zlib: { level: 6 } });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="receipts_${Date.now()}.zip"`);
    
    archive.pipe(res);
    archive.on('error', (err) => { throw err; });

    const { mode, status } = req.body;

    // Process in batches to prevent memory spikes
    const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '20', 10);
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const batchTasks = batch.map(async (row) => {
        try {
          const buffer = await generateSlip({
            ...row,
            txnMode: mode || 'IMPS',
            txnStatus: status || 'Success'
          });
          const identifier = row.refNo || row.account || Date.now();
          const filename = `receipt_${String(identifier).replace(/[^a-zA-Z0-9_-]/g, '_')}_${String(row.name || 'unnamed').replace(/\\s+/g, '_')}.${SLIP_EXT}`;
          return { buffer, filename };
        } catch (err) {
          console.error('[GEN ERROR] Row failed:', err.message);
          return null; // Return null on failure instead of throwing
        }
      });
      
      const results = await Promise.all(batchTasks);
      
      for (const result of results) {
        if (result) {
          const { buffer, filename } = result;
          archive.append(buffer, { name: filename });
        }
      }
    }

    await archive.finalize();

  } catch (err) {
    if (!res.headersSent) next(err);
    else {
      console.error('[STREAM ERROR]', err.message);
      res.end();
    }
  }
});

module.exports = router;
