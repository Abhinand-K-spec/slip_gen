/**
 * workerPool.js
 * A fixed-size Worker Thread pool for CPU-bound slip generation.
 *
 * Pattern: Queue-based dispatcher.
 *  - Tasks are submitted via runTask(rowData) which returns a Promise.
 *  - A pool of `size` Workers is kept alive.
 *  - When a worker becomes free, the next queued task is dispatched immediately.
 *  - This prevents the main event loop from blocking during image baking
 *    and avoids spawning one thread per row (which would cause OS-level thrashing).
 */
const { Worker } = require('worker_threads');
const os = require('os');
const path = require('path');

const WORKER_SCRIPT = path.join(__dirname, '../workers/generateWorker.js');
const POOL_SIZE = parseInt(process.env.WORKER_POOL_SIZE || String(Math.max(1, os.cpus().length - 1)), 10);

class WorkerPool {
  constructor(size = POOL_SIZE) {
    this.size = size;
    this.queue = [];
    this.workers = [];        // Array of { worker, busy }
    this._init();
  }

  _init() {
    for (let i = 0; i < this.size; i++) {
      this._createWorker();
    }
  }

  _createWorker() {
    const worker = new Worker(WORKER_SCRIPT);
    const workerObj = { worker, busy: false };

    worker.on('message', (result) => {
      // Find the task that was assigned to this specific worker
      const taskIndex = this.queue.findIndex(t => t.activeWorker === workerObj);
      if (taskIndex === -1) return; // Should not happen in normal flow

      const task = this.queue.splice(taskIndex, 1)[0];
      workerObj.busy = false;

      if (result.success) {
        task.resolve({ buffer: Buffer.from(result.buffer), filename: result.filename });
      } else {
        task.reject(new Error(result.error));
      }
      this._dispatch();
    });

    worker.on('error', (err) => {
      const taskIndex = this.queue.findIndex(t => t.activeWorker === workerObj);
      if (taskIndex !== -1) {
        const task = this.queue.splice(taskIndex, 1)[0];
        task.reject(err);
      }
      
      workerObj.busy = false;
      worker.terminate();
      this.workers = this.workers.filter(w => w !== workerObj);
      this._createWorker();
      this._dispatch();
    });

    this.workers.push(workerObj);
  }

  runTask(rowData) {
    return new Promise((resolve, reject) => {
      this.queue.push({ rowData, resolve, reject, activeWorker: null });
      this._dispatch();
    });
  }

  _dispatch() {
    const pendingTask = this.queue.find(t => !t.activeWorker);
    if (!pendingTask) return;

    const idleWorker = this.workers.find(w => !w.busy);
    if (!idleWorker) return;

    idleWorker.busy = true;
    pendingTask.activeWorker = idleWorker;
    idleWorker.worker.postMessage({ rowData: pendingTask.rowData });
  }
}

// Singleton pool — shared across all requests
const pool = new WorkerPool(POOL_SIZE);

module.exports = { pool };
