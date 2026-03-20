'use strict';

const BACKOFF_STRATEGIES = {
  fixed: (delay, _attempt) => delay,
  linear: (delay, attempt) => delay * attempt,
  exponential: (delay, attempt) => delay * Math.pow(2, attempt - 1),
};

function getDelay(strategy, baseDelay, attempt) {
  const calc = BACKOFF_STRATEGIES[strategy] || BACKOFF_STRATEGIES.fixed;
  return calc(baseDelay, attempt);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, options = {}, hooks = {}) {
  const maxRetries = options.retries ?? 0;
  const baseDelay = options.retryDelay ?? 1000;
  const strategy = options.retryBackoff ?? 'fixed';

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt < maxRetries) {
        const delay = getDelay(strategy, baseDelay, attempt + 1);
        if (hooks.onRetry) {
          await hooks.onRetry({ attempt: attempt + 1, maxRetries, delay, error: err });
        }
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

module.exports = { withRetry, BACKOFF_STRATEGIES };
