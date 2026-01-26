# @rustpress/sdk - TypeScript SDK

Official TypeScript SDK for RustPress - Build hooks, plugins, themes, and apps.

## Installation

```bash
npm install @rustpress/sdk
# or
yarn add @rustpress/sdk
# or
pnpm add @rustpress/sdk
```

## Quick Start

### Creating a Hook Function

```typescript
import { defineHook, TriggerArgs, RustPressContext } from '@rustpress/sdk';

export default defineHook(
  {
    name: 'orderValidation',
    displayName: 'Order Validation',
    description: 'Validates orders before creation',
    trigger: '@@rustpress.ecommerce.Order.create@@',
    timing: 'before',
  },
  async (args: TriggerArgs, context: RustPressContext) => {
    const orderData = args.originalArgs as { items: unknown[]; total: number };

    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    if (orderData.total < 0) {
      throw new Error('Order total cannot be negative');
    }

    context.logger.info('Order validation passed', { orderId: args.triggerId });
  }
);
```

### Creating a Plugin

```typescript
import { Plugin, PluginContext, PluginMetadata } from '@rustpress/sdk';

export const metadata: PluginMetadata = {
  name: 'My Awesome Plugin',
  version: '1.0.0',
  description: 'Adds awesome features to RustPress',
  author: 'Your Name',
  permissions: ['database:read', 'api:create'],
};

export default class MyPlugin implements Plugin {
  id = 'my-awesome-plugin';
  metadata = metadata;

  async activate(context: PluginContext): Promise<void> {
    // Register hooks
    context.hooks.register('content:before_save', async (content) => {
      content.metadata.processedBy = this.id;
      return content;
    });

    // Register API routes
    context.api.get('/status', async (req, res) => {
      res.json({ status: 'active', version: this.metadata.version });
    });

    context.logger.info('Plugin activated');
  }

  async deactivate(): Promise<void> {
    // Cleanup
  }
}
```

## Core Types

### TriggerArgs

```typescript
interface TriggerArgs<TInput = unknown, TResult = unknown> {
  originalArgs: TInput;      // Arguments passed to the plugin function
  result: TResult | null;    // Result (only in AFTER hooks)
  trigger: string;           // The trigger pattern
  timing: 'before' | 'after';
  timestamp: Date;
  triggerId: string;
}
```

### RustPressContext

```typescript
interface RustPressContext {
  executionId: string;
  user: User | null;
  db: Database;
  cache: Cache;
  http: HttpClient;
  notifications: NotificationService;
  queue: QueueService;
  templates: TemplateService;
  storage: StorageService;
  logger: Logger;
  config: ConfigService;
  events: EventEmitter;
  services: ServiceContainer;
}
```

## API Reference

### Database

```typescript
// Get a collection
const users = context.db.collection<User>('users');

// Find documents
const activeUsers = await users.find({ status: 'active' }).exec();

// Find one
const user = await users.findById('user-123');

// Insert
const newUser = await users.insert({ name: 'John', email: 'john@example.com' });

// Update
await users.updateById('user-123', { name: 'John Doe' });

// Delete
await users.deleteById('user-123');

// Transactions
await context.db.transaction(async (trx) => {
  await trx.collection('orders').insert(order);
  await trx.collection('inventory').update({ productId }, { $dec: { quantity: 1 } });
});
```

### Cache

```typescript
// Get/Set
await context.cache.set('key', value, 3600); // TTL in seconds
const value = await context.cache.get('key');

// Remember pattern
const users = await context.cache.remember('all-users', 3600, async () => {
  return await context.db.collection('users').find().exec();
});

// Tagged cache
const cache = context.cache.tags(['users', 'api']);
await cache.set('user:123', user);
await cache.flush(); // Flush all tagged entries
```

### Queue

```typescript
// Enqueue a message
await context.queue.enqueue('email-queue', {
  to: 'user@example.com',
  subject: 'Welcome!',
  template: 'welcome',
});

// Subscribe to a queue
await context.queue.subscribe('email-queue', async (message) => {
  await sendEmail(message.payload);
});
```

### Notifications

```typescript
// Send notification
await context.notifications.send({
  title: 'Order Shipped',
  message: 'Your order has been shipped!',
  type: 'success',
  channel: 'email',
});

// Send to specific user
await context.notifications.sendToUser(userId, notification);

// Broadcast to all
await context.notifications.broadcast(notification);
```

## Utility Functions

```typescript
import { parseTrigger, buildTrigger, isValidTrigger, retry, sleep } from '@rustpress/sdk';

// Parse trigger
const parts = parseTrigger('@@rustpress.ecommerce.Order.create@@');
// { plugin: 'ecommerce', class: 'Order', method: 'create' }

// Build trigger
const trigger = buildTrigger('ecommerce', 'Order', 'create');
// '@@rustpress.ecommerce.Order.create@@'

// Validate trigger
isValidTrigger('@@rustpress.ecommerce.Order.create@@'); // true

// Retry with backoff
const result = await retry(
  () => fetchData(),
  { attempts: 3, delay: 1000 }
);

// Sleep
await sleep(1000);
```

## License

MIT
