/**
 * Tests for the Plugin contract.
 *
 * The SDK currently exposes a `Plugin` interface (not a `BasePlugin` class).
 * These tests exercise the lifecycle contract by implementing the interface
 * with a minimal in-memory class and verifying activate/deactivate semantics.
 */
import { describe, it, expect, vi } from 'vitest';
import type {
  Plugin,
  PluginContext,
  PluginMetadata,
} from '../index';

class TestPlugin implements Plugin {
  public id: string;
  public metadata: PluginMetadata;
  public active = false;
  public activateCount = 0;
  public deactivateCount = 0;
  public lastContext: PluginContext | null = null;

  constructor(
    id: string,
    metadata: Partial<PluginMetadata> = {},
    private hooks: {
      onActivate?: () => Promise<void> | void;
      onDeactivate?: () => Promise<void> | void;
    } = {}
  ) {
    this.id = id;
    this.metadata = {
      name: metadata.name ?? id,
      version: metadata.version ?? '1.0.0',
      ...metadata,
    };
  }

  async activate(context: PluginContext): Promise<void> {
    if (this.active) throw new Error('already active');
    this.activateCount++;
    this.lastContext = context;
    await this.hooks.onActivate?.();
    this.active = true;
  }

  async deactivate(): Promise<void> {
    if (!this.active) throw new Error('not active');
    this.deactivateCount++;
    await this.hooks.onDeactivate?.();
    this.active = false;
  }
}

const fakeContext = {} as PluginContext;

describe('Plugin contract', () => {
  it('exposes id and metadata as public properties', () => {
    const p = new TestPlugin('test', { name: 'Test', version: '2.0.0' });
    expect(p.id).toBe('test');
    expect(p.metadata.name).toBe('Test');
    expect(p.metadata.version).toBe('2.0.0');
  });

  it('starts in an inactive state', () => {
    const p = new TestPlugin('x');
    expect(p.active).toBe(false);
  });

  it('transitions to active after activate()', async () => {
    const p = new TestPlugin('x');
    await p.activate(fakeContext);
    expect(p.active).toBe(true);
    expect(p.activateCount).toBe(1);
  });

  it('receives the plugin context on activate', async () => {
    const p = new TestPlugin('x');
    await p.activate(fakeContext);
    expect(p.lastContext).toBe(fakeContext);
  });

  it('runs the onActivate hook before becoming active', async () => {
    const onActivate = vi.fn(async () => {});
    const p = new TestPlugin('x', {}, { onActivate });
    await p.activate(fakeContext);
    expect(onActivate).toHaveBeenCalledOnce();
  });

  it('transitions to inactive after deactivate()', async () => {
    const p = new TestPlugin('x');
    await p.activate(fakeContext);
    await p.deactivate();
    expect(p.active).toBe(false);
    expect(p.deactivateCount).toBe(1);
  });

  it('runs the onDeactivate hook on deactivate', async () => {
    const onDeactivate = vi.fn(async () => {});
    const p = new TestPlugin('x', {}, { onDeactivate });
    await p.activate(fakeContext);
    await p.deactivate();
    expect(onDeactivate).toHaveBeenCalledOnce();
  });

  it('throws when activating an already-active plugin', async () => {
    const p = new TestPlugin('x');
    await p.activate(fakeContext);
    await expect(p.activate(fakeContext)).rejects.toThrow('already active');
  });

  it('throws when deactivating an inactive plugin', async () => {
    const p = new TestPlugin('x');
    await expect(p.deactivate()).rejects.toThrow('not active');
  });

  it('propagates errors from onActivate without flipping active=true', async () => {
    const p = new TestPlugin('x', {}, {
      onActivate: () => {
        throw new Error('boom');
      },
    });
    await expect(p.activate(fakeContext)).rejects.toThrow('boom');
    expect(p.active).toBe(false);
  });

  it('propagates errors from onDeactivate', async () => {
    const p = new TestPlugin('x', {}, {
      onDeactivate: () => {
        throw new Error('boom');
      },
    });
    await p.activate(fakeContext);
    await expect(p.deactivate()).rejects.toThrow('boom');
  });

  it('supports activate/deactivate cycles', async () => {
    const p = new TestPlugin('x');
    await p.activate(fakeContext);
    await p.deactivate();
    await p.activate(fakeContext);
    await p.deactivate();
    expect(p.activateCount).toBe(2);
    expect(p.deactivateCount).toBe(2);
    expect(p.active).toBe(false);
  });

  it('accepts a full metadata payload', () => {
    const meta: PluginMetadata = {
      name: 'full',
      version: '1.2.3',
      description: 'desc',
      author: 'me',
      homepage: 'https://example.com',
      repository: 'https://github.com/me/p',
      license: 'MIT',
      keywords: ['k1', 'k2'],
      dependencies: { foo: '^1.0.0' },
      permissions: ['read', 'write'],
    };
    const p = new TestPlugin('full', meta);
    expect(p.metadata.dependencies).toEqual({ foo: '^1.0.0' });
    expect(p.metadata.permissions).toEqual(['read', 'write']);
    expect(p.metadata.keywords).toEqual(['k1', 'k2']);
  });

  it('is assignable to the Plugin interface', () => {
    const p: Plugin = new TestPlugin('x');
    expect(typeof p.activate).toBe('function');
    expect(typeof p.deactivate).toBe('function');
  });
});
