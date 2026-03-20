'use strict';

const { Config, LOG_LEVELS, DEFAULTS } = require('./config');
const { Logger } = require('./logger');
const { Store, StoreAdapter, MemoryAdapter } = require('./store');
const { PluginManager, HOOK_NAMES } = require('./plugin');
const { trackJob: _trackJob, TimeoutError } = require('./tracker');
const { BACKOFF_STRATEGIES } = require('./retry');

class CronWatch {
  #config;
  #logger;
  #store;
  #plugins;

  constructor(options = {}) {
    this.#config = new Config(options);
    this.#logger = new Logger(this.#config);
    this.#store = new Store(
      options.storeAdapter || new MemoryAdapter(this.#config.get('storeMaxEntries'))
    );
    this.#plugins = new PluginManager();
  }

  async trackJob(jobName, jobFn, options = {}) {
    return _trackJob(jobName, jobFn, options, {
      logger: this.#logger,
      store: this.#store,
      pluginManager: this.#plugins,
      config: this.#config,
    });
  }

  use(plugin) {
    this.#plugins.register(plugin);
    this.#logger.debug(`Plugin registered: ${plugin.name}`);
    return this;
  }

  async getJobLogs(jobName) {
    return this.#store.getByJob(jobName);
  }

  async getAllLogs() {
    return this.#store.getAll();
  }

  async clearLogs() {
    await this.#store.clear();
    this.#logger.debug('All logs cleared');
  }

  get config() {
    return this.#config;
  }

  get logger() {
    return this.#logger;
  }

  get plugins() {
    return this.#plugins.plugins;
  }
}

function createCronWatch(options = {}) {
  return new CronWatch(options);
}

module.exports = {
  CronWatch,
  createCronWatch,
  Config,
  Logger,
  Store,
  StoreAdapter,
  MemoryAdapter,
  PluginManager,
  TimeoutError,
  LOG_LEVELS,
  DEFAULTS,
  HOOK_NAMES,
  BACKOFF_STRATEGIES,
};
