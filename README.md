# CronWatch

Lightweight cron job tracker, debugger, and monitor for Node.js applications.

Zero dependencies. Full TypeScript support. Plugin-ready.

## Install

```bash
npm install cronwatch
```

## Quick Start

```js
const { createCronWatch } = require('cronwatch');

const cron = createCronWatch();

await cron.trackJob('send-emails', async () => {
  // your job logic here
  await sendPendingEmails();
});
```

Every call to `trackJob` automatically captures start/end time, duration, success/failure status, error stacks, and retry counts.

## Configuration

```js
const cron = createCronWatch({
  retries: 3,                // max retry attempts (default: 0)
  retryDelay: 1000,          // base delay between retries in ms (default: 1000)
  retryBackoff: 'exponential', // 'fixed' | 'linear' | 'exponential'
  timeout: 30000,            // job timeout in ms, 0 = disabled (default: 0)
  logLevel: LOG_LEVELS.INFO, // DEBUG | INFO | WARN | ERROR | SILENT
  storeMaxEntries: 1000,     // max entries kept in memory (default: 1000)
  timestamps: true,          // ISO timestamps in log output (default: true)
  colorize: true,            // colorized console output (default: true)
});
```

Per-job overrides:

```js
await cron.trackJob('heavy-job', jobFn, {
  retries: 5,
  retryDelay: 2000,
  retryBackoff: 'linear',
  timeout: 60000,
});
```

## Structured Logs

Every tracked job produces a structured entry:

```json
{
  "jobName": "send-emails",
  "status": "success",
  "startTime": "2026-03-20T10:00:00.000Z",
  "endTime": "2026-03-20T10:00:00.234Z",
  "duration": 234,
  "error": null,
  "retries": 0
}
```

On failure:

```json
{
  "jobName": "sync-inventory",
  "status": "failure",
  "startTime": "2026-03-20T10:00:00.000Z",
  "endTime": "2026-03-20T10:00:03.512Z",
  "duration": 3512,
  "error": {
    "message": "Connection refused",
    "stack": "Error: Connection refused\n    at ...",
    "code": null
  },
  "retries": 3
}
```

## Querying Logs

```js
const emailLogs = await cron.getJobLogs('send-emails');
const allLogs   = await cron.getAllLogs();
await cron.clearLogs();
```

## Plugin System

Extend CronWatch by hooking into job lifecycle events.

```js
cron.use({
  name: 'slack-alerter',
  onFailure({ jobName, error }) {
    slack.send(`Job ${jobName} failed: ${error.message}`);
  },
  onTimeout({ jobName }) {
    slack.send(`Job ${jobName} timed out!`);
  },
});
```

### Available Hooks

| Hook | Trigger |
|------|---------|
| `onStart` | Before job executes |
| `onSuccess` | Job completed successfully |
| `onFailure` | Job failed after all retries |
| `onRetry` | Before each retry attempt |
| `onTimeout` | Job exceeded timeout |

## Custom Store Adapter

By default, logs are kept in memory. You can plug in any backend:

```js
const { createCronWatch, StoreAdapter } = require('cronwatch');

class MongoAdapter extends StoreAdapter {
  async save(entry)          { /* insert into MongoDB */ }
  async getByJob(jobName)    { /* query by jobName */ }
  async getAll()             { /* return all entries */ }
  async clear()              { /* drop collection */ }
}

const cron = createCronWatch({
  storeAdapter: new MongoAdapter(),
});
```

See `examples/custom-store-adapter.js` for a working file-based adapter.

## Use with node-cron

```js
const nodeCron = require('node-cron');
const { createCronWatch } = require('cronwatch');

const cron = createCronWatch({ retries: 2, timeout: 10000 });

nodeCron.schedule('*/5 * * * *', () => {
  cron.trackJob('cleanup-temp-files', async () => {
    await cleanupTempFiles();
  });
});
```

## TypeScript

Full type definitions are included. Import and use directly:

```ts
import { createCronWatch, CronWatchPlugin, JobEntry } from 'cronwatch';

const cron = createCronWatch({ retries: 2 });

const plugin: CronWatchPlugin = {
  name: 'my-plugin',
  onSuccess({ jobName }) {
    console.log(`${jobName} done`);
  },
};

cron.use(plugin);
```

## API Reference

### `createCronWatch(options?)`

Creates a new CronWatch instance.

### `instance.trackJob(jobName, jobFn, options?)`

Executes and tracks a job. Returns a `Promise<JobEntry>`.

### `instance.use(plugin)`

Registers a plugin. Returns `this` for chaining.

### `instance.getJobLogs(jobName)`

Returns all log entries for a specific job.

### `instance.getAllLogs()`

Returns all log entries.

### `instance.clearLogs()`

Clears the log store.

## Architecture

```
src/
  config.js    - Centralized config with defaults and merging
  logger.js    - Multi-level logger with pluggable outputs
  store.js     - In-memory store with adapter interface
  retry.js     - Retry engine with backoff strategies
  plugin.js    - Plugin lifecycle manager
  tracker.js   - Core trackJob orchestrator
  index.js     - Public API surface
types/
  index.d.ts   - Full TypeScript definitions
```

## Roadmap

- [ ] Database adapters (MongoDB, PostgreSQL, Redis)
- [ ] Dashboard API (Express/Fastify)
- [ ] Alert system (email, webhooks, Slack)
- [ ] Job scheduling (built-in cron parser)
- [ ] Metrics export (Prometheus, StatsD)

## License

MIT
