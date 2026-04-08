/**
 * zipStreamer.js
 * Streams generated image buffers directly into a zip response.
 *
 * Pattern: archiver pipes to Express res — NO temp files ever touch disk.
 * Memory profile: Only the current batch in-flight via workerPool is in heap.
 * Each image buffer is appended then released once archiver flushes the chunk.
 */
const archiver = require('archiver');

/**
 * @param {object} res - Express response object
 * @param {Array<{ buffer: Buffer, filename: string }>} items
 * @param {string} [zipName]
 * @returns {Promise<void>}
 */
function streamZip(res, items, zipName = 'slips.zip') {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 6 }, // balanced speed/compression
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    archive.on('error', (err) => reject(err));
    archive.on('finish', () => resolve());

    archive.pipe(res);

    items.forEach(({ buffer, filename }) => {
      archive.append(buffer, { name: filename });
    });

    archive.finalize();
  });
}

module.exports = { streamZip };
