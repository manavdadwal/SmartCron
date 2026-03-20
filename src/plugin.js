'use strict';

const HOOK_NAMES = ['onStart', 'onSuccess', 'onFailure', 'onRetry', 'onTimeout'];

class PluginManager {
  #plugins;

  constructor() {
    this.#plugins = [];
  }

  register(plugin) {
    if (!plugin || typeof plugin !== 'object') {
      throw new TypeError('Plugin must be an object');
    }
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new TypeError('Plugin must have a string "name" property');
    }

    const hasHook = HOOK_NAMES.some((h) => typeof plugin[h] === 'function');
    if (!hasHook) {
      throw new TypeError(
        `Plugin "${plugin.name}" must implement at least one hook: ${HOOK_NAMES.join(', ')}`
      );
    }

    this.#plugins.push(plugin);
    return this;
  }

  async emit(hookName, context) {
    if (!HOOK_NAMES.includes(hookName)) return;

    for (const plugin of this.#plugins) {
      if (typeof plugin[hookName] === 'function') {
        try {
          await plugin[hookName](context);
        } catch (err) {
          console.error(`[SmartCron] Plugin "${plugin.name}" threw in ${hookName}:`, err);
        }
      }
    }
  }

  get plugins() {
    return this.#plugins.map((p) => p.name);
  }
}

module.exports = { PluginManager, HOOK_NAMES };
