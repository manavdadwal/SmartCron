'use strict';

const LOG_LEVELS = Object.freeze({
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4,
});

const DEFAULTS = Object.freeze({
  retries: 0,
  retryDelay: 1000,
  retryBackoff: 'fixed',
  timeout: 0,
  logLevel: LOG_LEVELS.INFO,
  storeMaxEntries: 1000,
  timestamps: true,
  colorize: true,
});

class Config {
  #settings;

  constructor(overrides = {}) {
    this.#settings = { ...DEFAULTS, ...stripUndefined(overrides) };
  }

  get(key) {
    return this.#settings[key];
  }

  set(key, value) {
    this.#settings[key] = value;
    return this;
  }

  merge(overrides = {}) {
    return new Config({ ...this.#settings, ...stripUndefined(overrides) });
  }

  toJSON() {
    return { ...this.#settings };
  }
}

function stripUndefined(obj) {
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) clean[k] = v;
  }
  return clean;
}

module.exports = { Config, LOG_LEVELS, DEFAULTS };
