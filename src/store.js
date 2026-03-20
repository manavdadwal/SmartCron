'use strict';

/**
 * Pluggable storage adapter interface.
 *
 * Any custom adapter must implement:
 *   save(entry)          -> Promise<void>
 *   getByJob(jobName)    -> Promise<Array>
 *   getAll()             -> Promise<Array>
 *   clear()              -> Promise<void>
 */
class StoreAdapter {
  async save(_entry) { throw new Error('save() not implemented'); }
  async getByJob(_jobName) { throw new Error('getByJob() not implemented'); }
  async getAll() { throw new Error('getAll() not implemented'); }
  async clear() { throw new Error('clear() not implemented'); }
}

class MemoryAdapter extends StoreAdapter {
  #entries;
  #maxEntries;

  constructor(maxEntries = 1000) {
    super();
    this.#entries = [];
    this.#maxEntries = maxEntries;
  }

  async save(entry) {
    this.#entries.push(Object.freeze({ ...entry }));
    if (this.#entries.length > this.#maxEntries) {
      this.#entries = this.#entries.slice(-this.#maxEntries);
    }
  }

  async getByJob(jobName) {
    return this.#entries.filter((e) => e.jobName === jobName);
  }

  async getAll() {
    return [...this.#entries];
  }

  async clear() {
    this.#entries = [];
  }

  get size() {
    return this.#entries.length;
  }
}

class Store {
  #adapter;

  constructor(adapter) {
    if (adapter && !(adapter instanceof StoreAdapter)) {
      throw new TypeError('Store adapter must extend StoreAdapter');
    }
    this.#adapter = adapter || new MemoryAdapter();
  }

  save(entry) { return this.#adapter.save(entry); }
  getByJob(jobName) { return this.#adapter.getByJob(jobName); }
  getAll() { return this.#adapter.getAll(); }
  clear() { return this.#adapter.clear(); }

  get adapter() { return this.#adapter; }
}

module.exports = { Store, StoreAdapter, MemoryAdapter };
