'use strict';

const { withRetry } = require('./retry');

class TimeoutError extends Error {
  constructor(jobName, ms) {
    super(`Job "${jobName}" timed out after ${ms}ms`);
    this.name = 'TimeoutError';
    this.code = 'ERR_JOB_TIMEOUT';
  }
}

function withTimeout(fn, ms, jobName) {
  if (!ms || ms <= 0) return fn();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(jobName, ms));
    }, ms);

    fn()
      .then((val) => { clearTimeout(timer); resolve(val); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

function buildEntry(jobName, status, startTime, endTime, error, retryCount) {
  return {
    jobName,
    status,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration: endTime - startTime,
    error: error
      ? { message: error.message, stack: error.stack, code: error.code || null }
      : null,
    retries: retryCount,
  };
}

async function trackJob(jobName, jobFn, opts = {}, deps) {
  const { logger, store, pluginManager, config } = deps;

  if (typeof jobName !== 'string' || !jobName.trim()) {
    throw new TypeError('jobName must be a non-empty string');
  }
  if (typeof jobFn !== 'function') {
    throw new TypeError('jobFn must be a function');
  }

  const merged = config.merge(opts);
  const timeout = merged.get('timeout');
  const maxRetries = merged.get('retries');

  let retryCount = 0;
  const startTime = new Date();

  logger.info(`Starting job "${jobName}"`, maxRetries > 0 ? { maxRetries } : undefined);
  await pluginManager.emit('onStart', { jobName, startTime, config: merged });

  try {
    const wrappedFn = () => {
      const result = jobFn();
      const promise = result && typeof result.then === 'function' ? result : Promise.resolve(result);
      return timeout > 0 ? withTimeout(() => promise, timeout, jobName) : promise;
    };

    const result = await withRetry(wrappedFn, merged.toJSON(), {
      onRetry: async ({ attempt, delay, error }) => {
        retryCount = attempt;
        logger.warn(`Retrying job "${jobName}" (${attempt}/${maxRetries}) after ${delay}ms`, {
          error: error.message,
        });
        await pluginManager.emit('onRetry', {
          jobName, attempt, maxRetries, delay, error,
        });
      },
    });

    const endTime = new Date();
    const entry = buildEntry(jobName, 'success', startTime, endTime, null, retryCount);

    logger.info(`Job "${jobName}" completed in ${entry.duration}ms`);
    await store.save(entry);
    await pluginManager.emit('onSuccess', { jobName, entry, result });

    return entry;
  } catch (error) {
    const endTime = new Date();
    const isTimeout = error.name === 'TimeoutError';
    const status = isTimeout ? 'timeout' : 'failure';
    const entry = buildEntry(jobName, status, startTime, endTime, error, retryCount);

    if (isTimeout) {
      logger.error(`Job "${jobName}" timed out after ${timeout}ms`);
      await pluginManager.emit('onTimeout', { jobName, entry, error });
    } else {
      logger.error(`Job "${jobName}" failed after ${retryCount} retries`, error);
      await pluginManager.emit('onFailure', { jobName, entry, error });
    }

    await store.save(entry);
    return entry;
  }
}

module.exports = { trackJob, TimeoutError };
