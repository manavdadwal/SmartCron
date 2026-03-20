export interface CronWatchOptions {
  /** Max retry attempts (default: 0) */
  retries?: number;
  /** Base delay between retries in ms (default: 1000) */
  retryDelay?: number;
  /** Backoff strategy: 'fixed' | 'linear' | 'exponential' (default: 'fixed') */
  retryBackoff?: 'fixed' | 'linear' | 'exponential';
  /** Job timeout in ms, 0 = no timeout (default: 0) */
  timeout?: number;
  /** Minimum log level (default: LOG_LEVELS.INFO) */
  logLevel?: number;
  /** Max entries retained in memory store (default: 1000) */
  storeMaxEntries?: number;
  /** Include ISO timestamps in logs (default: true) */
  timestamps?: boolean;
  /** Colorize console output (default: true) */
  colorize?: boolean;
  /** Custom store adapter instance */
  storeAdapter?: StoreAdapter;
}

export interface JobTrackOptions {
  retries?: number;
  retryDelay?: number;
  retryBackoff?: 'fixed' | 'linear' | 'exponential';
  timeout?: number;
}

export interface JobEntry {
  jobName: string;
  status: 'success' | 'failure' | 'timeout';
  startTime: string;
  endTime: string;
  duration: number;
  error: JobError | null;
  retries: number;
}

export interface JobError {
  message: string;
  stack: string;
  code: string | null;
}

export interface PluginContext {
  jobName: string;
  [key: string]: unknown;
}

export interface CronWatchPlugin {
  name: string;
  onStart?(ctx: PluginContext): void | Promise<void>;
  onSuccess?(ctx: PluginContext): void | Promise<void>;
  onFailure?(ctx: PluginContext): void | Promise<void>;
  onRetry?(ctx: PluginContext): void | Promise<void>;
  onTimeout?(ctx: PluginContext): void | Promise<void>;
}

export declare class Config {
  constructor(overrides?: Partial<CronWatchOptions>);
  get<K extends keyof CronWatchOptions>(key: K): CronWatchOptions[K];
  set<K extends keyof CronWatchOptions>(key: K, value: CronWatchOptions[K]): this;
  merge(overrides?: Partial<CronWatchOptions>): Config;
  toJSON(): CronWatchOptions;
}

export declare class Logger {
  constructor(config: Config);
  addOutput(fn: (entry: object, formatted: string) => void): this;
  debug(msg: string, meta?: unknown): void;
  info(msg: string, meta?: unknown): void;
  warn(msg: string, meta?: unknown): void;
  error(msg: string, meta?: unknown): void;
}

export declare class StoreAdapter {
  save(entry: JobEntry): Promise<void>;
  getByJob(jobName: string): Promise<JobEntry[]>;
  getAll(): Promise<JobEntry[]>;
  clear(): Promise<void>;
}

export declare class MemoryAdapter extends StoreAdapter {
  constructor(maxEntries?: number);
  readonly size: number;
}

export declare class Store {
  constructor(adapter?: StoreAdapter);
  save(entry: JobEntry): Promise<void>;
  getByJob(jobName: string): Promise<JobEntry[]>;
  getAll(): Promise<JobEntry[]>;
  clear(): Promise<void>;
  readonly adapter: StoreAdapter;
}

export declare class PluginManager {
  register(plugin: CronWatchPlugin): this;
  emit(hookName: string, context: PluginContext): Promise<void>;
  readonly plugins: string[];
}

export declare class TimeoutError extends Error {
  readonly code: string;
  constructor(jobName: string, ms: number);
}

export declare class CronWatch {
  constructor(options?: CronWatchOptions);
  trackJob(
    jobName: string,
    jobFn: () => unknown | Promise<unknown>,
    options?: JobTrackOptions
  ): Promise<JobEntry>;
  use(plugin: CronWatchPlugin): this;
  getJobLogs(jobName: string): Promise<JobEntry[]>;
  getAllLogs(): Promise<JobEntry[]>;
  clearLogs(): Promise<void>;
  readonly config: Config;
  readonly logger: Logger;
  readonly plugins: string[];
}

export declare function createCronWatch(options?: CronWatchOptions): CronWatch;

export declare const LOG_LEVELS: {
  readonly DEBUG: 0;
  readonly INFO: 1;
  readonly WARN: 2;
  readonly ERROR: 3;
  readonly SILENT: 4;
};

export declare const DEFAULTS: Readonly<CronWatchOptions>;

export declare const HOOK_NAMES: readonly string[];

export declare const BACKOFF_STRATEGIES: {
  readonly fixed: (delay: number, attempt: number) => number;
  readonly linear: (delay: number, attempt: number) => number;
  readonly exponential: (delay: number, attempt: number) => number;
};
