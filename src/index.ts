/**
 * RustPress TypeScript SDK
 * Official SDK for building hooks, plugins, themes, and apps for RustPress
 *
 * @packageDocumentation
 */

// =============================================================================
// Core Types
// =============================================================================

export type TriggerTiming = 'before' | 'after';

export interface TriggerArgs<TInput = unknown, TResult = unknown> {
  /** Original arguments passed to the plugin function */
  originalArgs: TInput;
  /** Result from the plugin function (only available in AFTER hooks) */
  result: TResult | null;
  /** Trigger pattern that activated this hook */
  trigger: string;
  /** Timing of the hook execution */
  timing: TriggerTiming;
  /** Timestamp when the trigger was activated */
  timestamp: Date;
  /** Unique ID for this trigger execution */
  triggerId: string;
}

export interface RustPressContext {
  /** Unique execution ID for tracing */
  executionId: string;
  /** Current authenticated user */
  user: User | null;
  /** Database access */
  db: Database;
  /** Cache access */
  cache: Cache;
  /** HTTP client for external requests */
  http: HttpClient;
  /** Notification service */
  notifications: NotificationService;
  /** Queue service */
  queue: QueueService;
  /** Template rendering service */
  templates: TemplateService;
  /** File storage service */
  storage: StorageService;
  /** Logging service */
  logger: Logger;
  /** Configuration access */
  config: ConfigService;
  /** Event emitter */
  events: EventEmitter;
  /** Service container for dependency injection */
  services: ServiceContainer;
}

// =============================================================================
// User & Authentication
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export interface AuthService {
  getCurrentUser(): Promise<User | null>;
  getSession(): Promise<Session | null>;
  hasPermission(permission: string): Promise<boolean>;
  hasRole(role: string): Promise<boolean>;
  hasAnyRole(roles: string[]): Promise<boolean>;
  hasAllRoles(roles: string[]): Promise<boolean>;
  validateToken(token: string): Promise<User | null>;
  createToken(user: User, expiresIn?: number): Promise<string>;
  revokeToken(token: string): Promise<void>;
}

// =============================================================================
// Database
// =============================================================================

export interface Database {
  /** Get a collection/table */
  collection<T = unknown>(name: string): Collection<T>;
  /** Execute a raw query */
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Execute a raw command */
  execute(sql: string, params?: unknown[]): Promise<ExecuteResult>;
  /** Start a transaction */
  transaction<T>(fn: (trx: Transaction) => Promise<T>): Promise<T>;
  /** Run migrations */
  migrate(migrations: Migration[]): Promise<void>;
}

export interface Collection<T = unknown> {
  find(query?: QueryFilter<T>): QueryBuilder<T>;
  findOne(query: QueryFilter<T>): Promise<T | null>;
  findById(id: string): Promise<T | null>;
  insert(doc: Partial<T>): Promise<T>;
  insertMany(docs: Partial<T>[]): Promise<T[]>;
  update(query: QueryFilter<T>, update: Partial<T>): Promise<UpdateResult>;
  updateById(id: string, update: Partial<T>): Promise<T | null>;
  delete(query: QueryFilter<T>): Promise<DeleteResult>;
  deleteById(id: string): Promise<boolean>;
  count(query?: QueryFilter<T>): Promise<number>;
  exists(query: QueryFilter<T>): Promise<boolean>;
  aggregate<R = unknown>(pipeline: AggregationStage[]): Promise<R[]>;
}

export interface QueryBuilder<T> {
  where(field: keyof T | string, operator: QueryOperator, value: unknown): this;
  whereIn(field: keyof T | string, values: unknown[]): this;
  whereNotIn(field: keyof T | string, values: unknown[]): this;
  whereNull(field: keyof T | string): this;
  whereNotNull(field: keyof T | string): this;
  whereBetween(field: keyof T | string, min: unknown, max: unknown): this;
  orWhere(field: keyof T | string, operator: QueryOperator, value: unknown): this;
  orderBy(field: keyof T | string, direction?: 'asc' | 'desc'): this;
  limit(count: number): this;
  offset(count: number): this;
  select(...fields: (keyof T | string)[]): this;
  include(relation: string): this;
  exec(): Promise<T[]>;
  first(): Promise<T | null>;
  paginate(page: number, perPage: number): Promise<PaginatedResult<T>>;
}

export type QueryOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'like' | 'ilike' | 'in' | 'not in';
export type QueryFilter<T> = Partial<Record<keyof T | string, unknown>>;
export type AggregationStage = Record<string, unknown>;

export interface ExecuteResult {
  rowsAffected: number;
  lastInsertId?: string;
}

export interface UpdateResult {
  matchedCount: number;
  modifiedCount: number;
}

export interface DeleteResult {
  deletedCount: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Transaction extends Database {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface Migration {
  name: string;
  up(db: Database): Promise<void>;
  down(db: Database): Promise<void>;
}

// =============================================================================
// Cache
// =============================================================================

export interface Cache {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  deleteMany(pattern: string): Promise<number>;
  clear(): Promise<void>;
  increment(key: string, amount?: number): Promise<number>;
  decrement(key: string, amount?: number): Promise<number>;
  remember<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T>;
  tags(tags: string[]): TaggedCache;
}

export interface TaggedCache extends Cache {
  flush(): Promise<void>;
}

// =============================================================================
// HTTP Client
// =============================================================================

export interface HttpClient {
  get<T = unknown>(url: string, options?: HttpOptions): Promise<HttpResponse<T>>;
  post<T = unknown>(url: string, body?: unknown, options?: HttpOptions): Promise<HttpResponse<T>>;
  put<T = unknown>(url: string, body?: unknown, options?: HttpOptions): Promise<HttpResponse<T>>;
  patch<T = unknown>(url: string, body?: unknown, options?: HttpOptions): Promise<HttpResponse<T>>;
  delete<T = unknown>(url: string, options?: HttpOptions): Promise<HttpResponse<T>>;
  request<T = unknown>(options: HttpRequestOptions): Promise<HttpResponse<T>>;
}

export interface HttpOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
}

export interface HttpRequestOptions extends HttpOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  ok: boolean;
}

// =============================================================================
// Notifications
// =============================================================================

export interface NotificationService {
  send(notification: Notification): Promise<void>;
  sendToUser(userId: string, notification: Notification): Promise<void>;
  sendToUsers(userIds: string[], notification: Notification): Promise<void>;
  sendToRole(role: string, notification: Notification): Promise<void>;
  broadcast(notification: Notification): Promise<void>;
  schedule(notification: Notification, sendAt: Date): Promise<string>;
  cancel(notificationId: string): Promise<void>;
}

export interface Notification {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  channel?: 'in-app' | 'email' | 'sms' | 'push' | 'slack' | 'webhook';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  url?: string;
  action?: string;
  primary?: boolean;
}

// =============================================================================
// Queue
// =============================================================================

export interface QueueService {
  enqueue<T = unknown>(queue: string, message: T, options?: EnqueueOptions): Promise<string>;
  dequeue<T = unknown>(queue: string): Promise<QueueMessage<T> | null>;
  peek<T = unknown>(queue: string): Promise<QueueMessage<T> | null>;
  ack(queue: string, messageId: string): Promise<void>;
  nack(queue: string, messageId: string, requeue?: boolean): Promise<void>;
  getLength(queue: string): Promise<number>;
  purge(queue: string): Promise<number>;
  subscribe<T = unknown>(queue: string, handler: QueueHandler<T>): Promise<Subscription>;
}

export interface EnqueueOptions {
  delay?: number;
  priority?: number;
  expiration?: number;
  headers?: Record<string, string>;
}

export interface QueueMessage<T = unknown> {
  id: string;
  queue: string;
  payload: T;
  headers: Record<string, string>;
  timestamp: Date;
  attempts: number;
}

export type QueueHandler<T = unknown> = (message: QueueMessage<T>) => Promise<void>;

export interface Subscription {
  unsubscribe(): Promise<void>;
}

// =============================================================================
// Templates
// =============================================================================

export interface TemplateService {
  render(template: string, data: Record<string, unknown>): Promise<string>;
  renderFile(path: string, data: Record<string, unknown>): Promise<string>;
  compile(template: string): CompiledTemplate;
  registerHelper(name: string, fn: TemplateHelper): void;
  registerPartial(name: string, template: string): void;
}

export interface CompiledTemplate {
  render(data: Record<string, unknown>): string;
}

export type TemplateHelper = (...args: unknown[]) => string;

// =============================================================================
// Storage
// =============================================================================

export interface StorageService {
  disk(name?: string): StorageDisk;
}

export interface StorageDisk {
  read(path: string): Promise<Buffer>;
  readString(path: string, encoding?: BufferEncoding): Promise<string>;
  readStream(path: string): Promise<NodeJS.ReadableStream>;
  write(path: string, content: Buffer | string): Promise<void>;
  writeStream(path: string): Promise<NodeJS.WritableStream>;
  delete(path: string): Promise<boolean>;
  deleteDirectory(path: string): Promise<boolean>;
  copy(from: string, to: string): Promise<void>;
  move(from: string, to: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  size(path: string): Promise<number>;
  lastModified(path: string): Promise<Date>;
  mimeType(path: string): Promise<string>;
  url(path: string): string;
  temporaryUrl(path: string, expiresAt: Date): Promise<string>;
  list(path?: string): Promise<StorageFile[]>;
  directories(path?: string): Promise<string[]>;
  makeDirectory(path: string): Promise<void>;
}

export interface StorageFile {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  lastModified: Date;
  isDirectory: boolean;
}

// =============================================================================
// Logger
// =============================================================================

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  fatal(message: string, error?: Error, context?: Record<string, unknown>): void;
  child(context: Record<string, unknown>): Logger;
}

// =============================================================================
// Config
// =============================================================================

export interface ConfigService {
  get<T = unknown>(key: string, defaultValue?: T): T;
  set(key: string, value: unknown): void;
  has(key: string): boolean;
  all(): Record<string, unknown>;
}

// =============================================================================
// Events
// =============================================================================

export interface EventEmitter {
  on<T = unknown>(event: string, handler: EventHandler<T>): void;
  once<T = unknown>(event: string, handler: EventHandler<T>): void;
  off<T = unknown>(event: string, handler: EventHandler<T>): void;
  emit<T = unknown>(event: string, data: T): Promise<void>;
  listeners(event: string): EventHandler[];
}

export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

// =============================================================================
// Service Container
// =============================================================================

export interface ServiceContainer {
  get<T>(key: string): T;
  has(key: string): boolean;
  register<T>(key: string, factory: () => T): void;
  singleton<T>(key: string, factory: () => T): void;
}

// =============================================================================
// Hook Registration
// =============================================================================

export interface HookFunction<TInput = unknown, TResult = unknown> {
  (args: TriggerArgs<TInput, TResult>, context: RustPressContext): Promise<TResult | void>;
}

export interface HookMetadata {
  name: string;
  displayName?: string;
  description?: string;
  trigger: string;
  timing: TriggerTiming;
  version?: string;
  author?: string;
  tags?: string[];
  priority?: number;
  enabled?: boolean;
}

export interface HookDefinition<TInput = unknown, TResult = unknown> {
  metadata: HookMetadata;
  handler: HookFunction<TInput, TResult>;
}

export interface HookRegistry {
  register<TInput = unknown, TResult = unknown>(hook: HookDefinition<TInput, TResult>): void;
  unregister(name: string): void;
  get(name: string): HookDefinition | undefined;
  getByTrigger(trigger: string, timing?: TriggerTiming): HookDefinition[];
  list(): HookDefinition[];
  enable(name: string): void;
  disable(name: string): void;
  isEnabled(name: string): boolean;
}

/**
 * Decorator for defining hook metadata
 */
export function Hook(metadata: HookMetadata) {
  return function <T extends { new (...args: unknown[]): object }>(constructor: T) {
    return class extends constructor {
      static metadata = metadata;
    };
  };
}

/**
 * Create a hook definition
 */
export function defineHook<TInput = unknown, TResult = unknown>(
  metadata: HookMetadata,
  handler: HookFunction<TInput, TResult>
): HookDefinition<TInput, TResult> {
  return { metadata, handler };
}

// =============================================================================
// Plugin System
// =============================================================================

export interface Plugin {
  /** Plugin ID */
  id: string;
  /** Plugin metadata */
  metadata: PluginMetadata;
  /** Called when plugin is activated */
  activate(context: PluginContext): Promise<void>;
  /** Called when plugin is deactivated */
  deactivate(): Promise<void>;
}

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  permissions?: string[];
}

export interface PluginContext extends RustPressContext {
  /** Plugin-specific hooks registry */
  hooks: PluginHookRegistry;
  /** Plugin-specific API router */
  api: PluginApiRouter;
  /** Plugin settings */
  settings: PluginSettings;
  /** Plugin assets */
  assets: PluginAssets;
}

export interface PluginHookRegistry {
  register(event: string, handler: EventHandler): void;
  unregister(event: string, handler: EventHandler): void;
  trigger<T = unknown>(event: string, data: T): Promise<void>;
}

export interface PluginApiRouter {
  get(path: string, handler: ApiHandler): void;
  post(path: string, handler: ApiHandler): void;
  put(path: string, handler: ApiHandler): void;
  patch(path: string, handler: ApiHandler): void;
  delete(path: string, handler: ApiHandler): void;
  use(middleware: ApiMiddleware): void;
}

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<void>;
export type ApiMiddleware = (req: ApiRequest, res: ApiResponse, next: () => Promise<void>) => Promise<void>;

export interface ApiRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  headers: Record<string, string>;
  user: User | null;
}

export interface ApiResponse {
  status(code: number): this;
  json(data: unknown): void;
  send(data: string | Buffer): void;
  header(name: string, value: string): this;
  redirect(url: string, status?: number): void;
}

export interface PluginSettings {
  get<T = unknown>(key: string, defaultValue?: T): T;
  set(key: string, value: unknown): Promise<void>;
  all(): Record<string, unknown>;
  define(schema: SettingsSchema): void;
}

export interface SettingsSchema {
  [key: string]: SettingDefinition;
}

export interface SettingDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default?: unknown;
  required?: boolean;
  secret?: boolean;
  label?: string;
  description?: string;
  options?: SettingOption[];
  validate?: (value: unknown) => boolean | string;
}

export interface SettingOption {
  label: string;
  value: unknown;
}

export interface PluginAssets {
  url(path: string): string;
  register(name: string, path: string, type: 'script' | 'style'): void;
  enqueue(name: string): void;
}

// =============================================================================
// App System
// =============================================================================

export interface App {
  id: string;
  metadata: AppMetadata;
  render(): React.ReactNode;
}

export interface AppMetadata {
  name: string;
  version: string;
  description?: string;
  icon?: string;
  author?: string;
  menu?: AppMenuConfig;
  routes?: AppRoute[];
  permissions?: string[];
}

export interface AppMenuConfig {
  title: string;
  icon: string;
  position: 'sidebar' | 'header' | 'settings';
  order?: number;
}

export interface AppRoute {
  path: string;
  component: string;
  exact?: boolean;
  permissions?: string[];
}

export interface AppContext extends RustPressContext {
  app: AppMetadata;
  navigate(path: string): void;
  showNotification(notification: Notification): void;
  showDialog(options: DialogOptions): Promise<DialogResult>;
  showToast(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
}

export interface DialogOptions {
  title: string;
  message: string;
  type?: 'info' | 'confirm' | 'prompt';
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
}

export interface DialogResult {
  confirmed: boolean;
  value?: string;
}

// =============================================================================
// Theme System
// =============================================================================

export interface Theme {
  id: string;
  metadata: ThemeMetadata;
}

export interface ThemeMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  screenshot?: string;
  colors?: ThemeColors;
  fonts?: ThemeFonts;
  features?: string[];
  templates?: string[];
}

export interface ThemeColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  muted?: string;
  border?: string;
  error?: string;
  warning?: string;
  success?: string;
  info?: string;
  [key: string]: string | undefined;
}

export interface ThemeFonts {
  heading?: string;
  body?: string;
  mono?: string;
  [key: string]: string | undefined;
}

export interface ThemeContext extends RustPressContext {
  theme: ThemeMetadata;
  assets: ThemeAssets;
  partials: ThemePartials;
}

export interface ThemeAssets {
  url(path: string): string;
  inline(path: string): Promise<string>;
}

export interface ThemePartials {
  render(name: string, data?: Record<string, unknown>): Promise<string>;
  register(name: string, template: string): void;
}

// =============================================================================
// Content Types
// =============================================================================

export interface Content {
  id: string;
  type: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: ContentStatus;
  author: User;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
  taxonomies: Taxonomy[];
}

export type ContentStatus = 'draft' | 'pending' | 'published' | 'scheduled' | 'archived';

export interface Taxonomy {
  id: string;
  type: string;
  name: string;
  slug: string;
  description?: string;
  parent?: Taxonomy;
  count: number;
}

export interface Media {
  id: string;
  name: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Utility Types
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Awaitable<T> = T | Promise<T>;

export type MaybePromise<T> = T | Promise<T>;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Parse a trigger pattern into its components
 */
export function parseTrigger(trigger: string): TriggerComponents | null {
  const match = trigger.match(/^@@rustpress\.([^.]+)\.([^.]+)\.([^@]+)@@$/);
  if (!match) return null;
  return {
    plugin: match[1],
    class: match[2],
    method: match[3],
  };
}

export interface TriggerComponents {
  plugin: string;
  class: string;
  method: string;
}

/**
 * Build a trigger pattern from components
 */
export function buildTrigger(plugin: string, className: string, method: string): string {
  return `@@rustpress.${plugin}.${className}.${method}@@`;
}

/**
 * Validate a trigger pattern
 */
export function isValidTrigger(trigger: string): boolean {
  return /^@@rustpress\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+@@$/.test(trigger);
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { attempts?: number; delay?: number; maxDelay?: number } = {}
): Promise<T> {
  const { attempts = 3, delay = 1000, maxDelay = 30000 } = options;
  let lastError: Error | undefined;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < attempts - 1) {
        const waitTime = Math.min(delay * Math.pow(2, i), maxDelay);
        await sleep(waitTime);
      }
    }
  }

  throw lastError;
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Create a throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// =============================================================================
// Version Info
// =============================================================================

export const VERSION = '1.0.0';
export const SDK_NAME = '@rustpress/sdk';
