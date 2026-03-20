'use strict';

const { LOG_LEVELS } = require('./config');

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

const LEVEL_TAGS = {
  [LOG_LEVELS.DEBUG]: { label: 'DEBUG', color: COLORS.gray },
  [LOG_LEVELS.INFO]: { label: 'INFO ', color: COLORS.cyan },
  [LOG_LEVELS.WARN]: { label: 'WARN ', color: COLORS.yellow },
  [LOG_LEVELS.ERROR]: { label: 'ERROR', color: COLORS.red },
};

class Logger {
  #level;
  #colorize;
  #timestamps;
  #outputs;

  constructor(config) {
    this.#level = config.get('logLevel');
    this.#colorize = config.get('colorize');
    this.#timestamps = config.get('timestamps');
    this.#outputs = [consoleOutput];
  }

  addOutput(fn) {
    if (typeof fn === 'function') this.#outputs.push(fn);
    return this;
  }

  debug(msg, meta) { this.#log(LOG_LEVELS.DEBUG, msg, meta); }
  info(msg, meta) { this.#log(LOG_LEVELS.INFO, msg, meta); }
  warn(msg, meta) { this.#log(LOG_LEVELS.WARN, msg, meta); }
  error(msg, meta) { this.#log(LOG_LEVELS.ERROR, msg, meta); }

  #log(level, msg, meta) {
    if (level < this.#level) return;

    const entry = {
      level,
      label: LEVEL_TAGS[level]?.label || 'LOG',
      timestamp: this.#timestamps ? new Date().toISOString() : null,
      message: msg,
      meta: meta || null,
    };

    const formatted = this.#format(entry);
    for (const output of this.#outputs) {
      output(entry, formatted);
    }
  }

  #format(entry) {
    const c = this.#colorize ? COLORS : noColors();
    const tag = LEVEL_TAGS[entry.level] || { label: 'LOG', color: '' };
    const color = this.#colorize ? tag.color : '';

    const parts = [];
    if (entry.timestamp) {
      parts.push(`${c.dim}${entry.timestamp}${c.reset}`);
    }
    parts.push(`${color}[${entry.label}]${c.reset}`);
    parts.push(`${c.magenta}[CronWatch]${c.reset}`);
    parts.push(entry.message);

    return parts.join(' ');
  }
}

function consoleOutput(entry, formatted) {
  const stream = entry.level >= LOG_LEVELS.ERROR ? console.error : console.log;
  stream(formatted);
  if (entry.meta) {
    stream(
      entry.level >= LOG_LEVELS.ERROR
        ? entry.meta
        : JSON.stringify(entry.meta, null, 2)
    );
  }
}

function noColors() {
  const empty = {};
  for (const key of Object.keys(COLORS)) empty[key] = '';
  return empty;
}

module.exports = { Logger, LOG_LEVELS };
