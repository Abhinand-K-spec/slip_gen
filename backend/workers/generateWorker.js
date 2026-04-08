/**
 * generateWorker.js
 * Runs inside a Worker Thread.
 * Receives rowData via workerData and posts { buffer, filename } back.
 */
const { parentPort } = require('worker_threads');
const { generateSlip, SLIP_EXT } = require('../services/imageGenerator');

parentPort.on('message', async ({ rowData }) => {
  try {
    const buffer = await generateSlip(rowData);
    const identifier = rowData.refNo || rowData.account || Date.now();
    const filename = `receipt_${String(identifier).replace(/[^a-zA-Z0-9_-]/g, '_')}_${String(rowData.name || 'unnamed').replace(/\s+/g, '_')}.${SLIP_EXT}`;
    
    parentPort.postMessage({ success: true, buffer, filename });
  } catch (err) {
    parentPort.postMessage({ success: false, error: err.message });
  }
});
