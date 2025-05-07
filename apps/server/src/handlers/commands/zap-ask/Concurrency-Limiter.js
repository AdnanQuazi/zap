class ConcurrencyLimiter {
  constructor(limit) {
    this.limit = limit; // Maximum number of concurrent tasks
    this.active = 0; // Current number of running tasks
    this.queue = []; // Queue for pending tasks
  }

  async run(task) {
    if (this.active < this.limit) {
      // Run the task immediately if under the limit
      this.active++;
      try {
        return await task();
      } finally {
        this.active--;
        this._processQueue();
      }
    } else {
      // Queue the task if limit is reached
      return new Promise((resolve, reject) => {
        this.queue.push(async () => {
          try {
            resolve(await this.run(task));
          } catch (error) {
            reject(error);
          }
        });
      });
    }
  }

  _processQueue() {
    if (this.queue.length > 0 && this.active < this.limit) {
      const nextTask = this.queue.shift();
      nextTask();
    }
  }
}

module.exports = ConcurrencyLimiter;
