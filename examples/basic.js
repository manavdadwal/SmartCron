'use strict';

const { createCronWatch, LOG_LEVELS } = require('../src');

async function main() {
  const cron = createCronWatch({
    logLevel: LOG_LEVELS.DEBUG,
    retries: 2,
    retryDelay: 500,
    retryBackoff: 'exponential',
    timeout: 5000,
  });

  // --- Plugin: simple webhook-style notifier ---
  cron.use({
    name: 'console-notifier',
    onSuccess({ jobName, entry }) {
      console.log(`\n  [Notifier] "${jobName}" succeeded in ${entry.duration}ms\n`);
    },
    onFailure({ jobName, error }) {
      console.log(`\n  [Notifier] "${jobName}" FAILED: ${error.message}\n`);
    },
    onTimeout({ jobName }) {
      console.log(`\n  [Notifier] "${jobName}" TIMED OUT\n`);
    },
  });

  // --- 1. Successful job ---
  console.log('\n=== Successful Job ===');
  await cron.trackJob('send-welcome-email', async () => {
    await sleep(200);
    return { sent: true };
  });

  // --- 2. Failing job with retries ---
  console.log('\n=== Failing Job (with retries) ===');
  let callCount = 0;
  await cron.trackJob(
    'sync-inventory',
    async () => {
      callCount++;
      if (callCount < 3) throw new Error('Connection refused');
      return { synced: 42 };
    },
    { retries: 3, retryDelay: 300, retryBackoff: 'linear' }
  );

  // --- 3. Timeout job ---
  console.log('\n=== Timeout Job ===');
  await cron.trackJob(
    'generate-report',
    async () => {
      await sleep(3000);
    },
    { timeout: 500, retries: 0 }
  );

  // --- 4. Concurrent jobs ---
  console.log('\n=== Concurrent Jobs ===');
  await Promise.all([
    cron.trackJob('job-a', async () => { await sleep(100); }),
    cron.trackJob('job-b', async () => { await sleep(150); }),
    cron.trackJob('job-c', async () => { await sleep(50); }),
  ]);

  // --- View all logs ---
  console.log('\n=== All Stored Logs ===');
  const logs = await cron.getAllLogs();
  console.log(JSON.stringify(logs, null, 2));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch(console.error);
