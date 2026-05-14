import { describe, it, expect, vi } from 'vitest';
import {
  defineHook,
  Hook,
  type HookDefinition,
  type HookFunction,
  type HookMetadata,
  type RustPressContext,
  type TriggerArgs,
} from '../index';

describe('defineHook', () => {
  const metadata: HookMetadata = {
    name: 'my-hook',
    trigger: '@@rustpress.blog.PostService.create@@',
    timing: 'before',
  };

  it('returns an object with metadata and handler properties', () => {
    const handler: HookFunction = async () => {};
    const def = defineHook(metadata, handler);
    expect(def).toHaveProperty('metadata');
    expect(def).toHaveProperty('handler');
  });

  it('preserves the metadata object reference', () => {
    const handler: HookFunction = async () => {};
    const def = defineHook(metadata, handler);
    expect(def.metadata).toBe(metadata);
  });

  it('preserves the handler function reference', () => {
    const handler: HookFunction = async () => {};
    const def = defineHook(metadata, handler);
    expect(def.handler).toBe(handler);
  });

  it('produces a definition whose handler can be invoked', async () => {
    const handler = vi.fn(async () => 'ok' as const);
    const def = defineHook<unknown, string>(metadata, handler);
    const args = {
      originalArgs: {},
      result: null,
      trigger: metadata.trigger,
      timing: 'before' as const,
      timestamp: new Date(),
      triggerId: 'abc',
    } as TriggerArgs;
    const ctx = {} as RustPressContext;
    const out = await def.handler(args, ctx);
    expect(out).toBe('ok');
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(args, ctx);
  });

  it('supports after-timing metadata', () => {
    const afterMeta: HookMetadata = { ...metadata, timing: 'after' };
    const def = defineHook(afterMeta, async () => {});
    expect(def.metadata.timing).toBe('after');
  });

  it('accepts optional metadata fields', () => {
    const full: HookMetadata = {
      ...metadata,
      displayName: 'My Hook',
      description: 'Does something',
      version: '1.0.0',
      author: 'Test',
      tags: ['blog', 'post'],
      priority: 10,
      enabled: true,
    };
    const def = defineHook(full, async () => {});
    expect(def.metadata.displayName).toBe('My Hook');
    expect(def.metadata.tags).toEqual(['blog', 'post']);
    expect(def.metadata.priority).toBe(10);
    expect(def.metadata.enabled).toBe(true);
  });

  it('keeps separate definitions independent', () => {
    const a = defineHook(
      { ...metadata, name: 'a' },
      async () => 'a'
    );
    const b = defineHook(
      { ...metadata, name: 'b' },
      async () => 'b'
    );
    expect(a.metadata.name).toBe('a');
    expect(b.metadata.name).toBe('b');
    expect(a.handler).not.toBe(b.handler);
  });

  it('produces a definition assignable to HookDefinition', () => {
    const def: HookDefinition = defineHook(metadata, async () => {});
    expect(def.metadata.trigger).toBe(metadata.trigger);
  });
});

describe('Hook decorator', () => {
  const metadata: HookMetadata = {
    name: 'decorated-hook',
    trigger: '@@rustpress.blog.PostService.create@@',
    timing: 'before',
  };

  it('attaches metadata as a static property on the decorated class', () => {
    class Original {
      run(): string {
        return 'ran';
      }
    }
    const Decorated = Hook(metadata)(Original);
    // @ts-expect-error - static metadata is added at runtime
    expect(Decorated.metadata).toBe(metadata);
  });

  it('preserves instance behavior on the decorated class', () => {
    class Original {
      run(): string {
        return 'ran';
      }
    }
    const Decorated = Hook(metadata)(Original);
    const instance = new Decorated();
    expect(instance.run()).toBe('ran');
  });

  it('allows different decorated classes to have independent metadata', () => {
    class A {}
    class B {}
    const DA = Hook({ ...metadata, name: 'A' })(A);
    const DB = Hook({ ...metadata, name: 'B' })(B);
    // @ts-expect-error - static metadata is added at runtime
    expect(DA.metadata.name).toBe('A');
    // @ts-expect-error - static metadata is added at runtime
    expect(DB.metadata.name).toBe('B');
  });
});

describe('Hook handler invocation semantics', () => {
  it('passes originalArgs through unchanged for before-hooks', async () => {
    const seen: unknown[] = [];
    const handler: HookFunction<{ x: number }> = async (args) => {
      seen.push(args.originalArgs);
    };
    const def = defineHook<{ x: number }>(
      {
        name: 'before-x',
        trigger: '@@rustpress.t.C.m@@',
        timing: 'before',
      },
      handler
    );
    await def.handler(
      {
        originalArgs: { x: 1 },
        result: null,
        trigger: '@@rustpress.t.C.m@@',
        timing: 'before',
        timestamp: new Date(),
        triggerId: 't1',
      },
      {} as RustPressContext
    );
    expect(seen).toEqual([{ x: 1 }]);
  });

  it('after-hooks receive a non-null result', async () => {
    const captured: { result: unknown } = { result: undefined };
    const handler: HookFunction<unknown, string> = async (args) => {
      captured.result = args.result;
    };
    const def = defineHook<unknown, string>(
      {
        name: 'after-x',
        trigger: '@@rustpress.t.C.m@@',
        timing: 'after',
      },
      handler
    );
    await def.handler(
      {
        originalArgs: {},
        result: 'computed',
        trigger: '@@rustpress.t.C.m@@',
        timing: 'after',
        timestamp: new Date(),
        triggerId: 't2',
      },
      {} as RustPressContext
    );
    expect(captured.result).toBe('computed');
  });

  it('propagates errors thrown inside a hook handler', async () => {
    const def = defineHook(
      {
        name: 'boom',
        trigger: '@@rustpress.t.C.m@@',
        timing: 'before',
      },
      async () => {
        throw new Error('boom');
      }
    );
    await expect(
      def.handler(
        {
          originalArgs: {},
          result: null,
          trigger: '@@rustpress.t.C.m@@',
          timing: 'before',
          timestamp: new Date(),
          triggerId: 't3',
        },
        {} as RustPressContext
      )
    ).rejects.toThrow('boom');
  });
});
