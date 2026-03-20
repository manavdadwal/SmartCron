'use strict';

/**
 * Example: Writing a custom store adapter.
 *
 * This demonstrates how to build a file-based adapter,
 * which is the same pattern you'd use for MongoDB, Postgres, Redis, etc.
 */

const fs = require('fs');
const path = require('path');
const { createSmartCron, StoreAdapter } = require('../src');

class FileAdapter extends StoreAdapter {
  #filePath;

  constructor(filePath) {
    super();
    this.#filePath = filePath;
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf8');
    }
  }

  #read() {
    return JSON.parse(fs.readFileSync(this.#filePath, 'utf8'));
  }

  #write(data) {
    fs.writeFileSync(this.#filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async save(entry) {
    const data = this.#read();
    data.push(entry);
    this.#write(data);
  }

  async getByJob(jobName) {
    return this.#read().filter((e) => e.jobName === jobName);
  }

  async getAll() {
    return this.#read();
  }

  async clear() {
    this.#write([]);
  }
}

async function main() {
  const logFile = path.join(__dirname, 'job-logs.json');

  const cron = createSmartCron({
    storeAdapter: new FileAdapter(logFile),
  });

  await cron.trackJob('file-backed-job', async () => {
    await new Promise((r) => setTimeout(r, 100));
    return { ok: true };
  });

  console.log(`\nLogs written to ${logFile}`);
  console.log(fs.readFileSync(logFile, 'utf8'));
}

main().catch(console.error);
