'use strict';

/**
 * Example: SmartCron + node-cron integration.
 *
 * Install node-cron first:
 *   npm install node-cron
 *
 * Then run:
 *   node examples/with-node-cron.js
 */

const { createSmartCron } = require('../src');

let cron;
try {
  cron = require('node-cron');
} catch {
  console.log('This example requires node-cron. Install it with: npm install node-cron');
  process.exit(0);
}

const smartcron = createSmartCron({
  retries: 1,
  retryDelay: 2000,
  timeout: 10000,
});

smartcron.use({
  name: 'alert-on-failure',
  onFailure({ jobName, error }) {
    console.log(`[ALERT] Job "${jobName}" failed: ${error.message}`);
    // In production: send to Slack, PagerDuty, email, etc.
  },
});

// Runs every 10 seconds
cron.schedule('*/10 * * * * *', () => {
  smartcron.trackJob('health-check', async () => {
    const start = Date.now();
    // Simulate an HTTP health check
    await new Promise((r) => setTimeout(r, 50 + Math.random() * 200));
    if (Math.random() < 0.2) throw new Error('Service unavailable');
    return { latency: Date.now() - start };
  });
});

console.log('SmartCron + node-cron running. Health check every 10s. Press Ctrl+C to stop.');
