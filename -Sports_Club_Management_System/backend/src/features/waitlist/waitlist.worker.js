const waitlistService = require('./waitlist.service');

class WaitlistWorker {
  constructor(intervalMs = 30000) { // default: check every 30 seconds
    this.intervalMs = intervalMs;
    this.timer = null;
    this.isRunning = false;
  }

  start() {
    if (this.timer) return;
    this.isRunning = true;
    console.log(`[WaitlistWorker] Expiry sweeper started (interval: ${this.intervalMs}ms)`);
    this.timer = setInterval(async () => {
      try {
        const res = await waitlistService.processExpiredOffers();
        if (res.processedCount > 0) {
          console.log(`[WaitlistWorker] Swept and cascaded ${res.processedCount} expired offers.`);
        }
      } catch (err) {
        console.error('[WaitlistWorker] Sweeper loop error:', err.message);
      }
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.isRunning = false;
      console.log('[WaitlistWorker] Expiry sweeper stopped.');
    }
  }

  async runOnce() {
    return waitlistService.processExpiredOffers();
  }
}

module.exports = new WaitlistWorker();
