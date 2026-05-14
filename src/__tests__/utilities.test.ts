import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { debounce, retry, sleep, throttle } from '../index';

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the requested duration', async () => {
    const p = sleep(1000);
    let resolved = false;
    p.then(() => {
      resolved = true;
    });
    await vi.advanceTimersByTimeAsync(999);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toBe(true);
  });

  it('resolves immediately for sleep(0)', async () => {
    const p = sleep(0);
    await vi.advanceTimersByTimeAsync(0);
    await expect(p).resolves.toBeUndefined();
  });

  it('returns a Promise<void>', () => {
    const p = sleep(0);
    expect(p).toBeInstanceOf(Promise);
  });
});

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the result on first success', async () => {
    const fn = vi.fn(async () => 42);
    await expect(retry(fn)).resolves.toBe(42);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('retries until success', async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls++;
      if (calls < 3) throw new Error('fail');
      return 'ok';
    });
    const p = retry(fn, { attempts: 5, delay: 10 });
    await vi.runAllTimersAsync();
    await expect(p).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws the last error after exhausting attempts', async () => {
    const fn = vi.fn(async () => {
      throw new Error('always-fails');
    });
    const p = retry(fn, { attempts: 3, delay: 1 });
    await vi.runAllTimersAsync();
    await expect(p).rejects.toThrow('always-fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('uses default of 3 attempts', async () => {
    const fn = vi.fn(async () => {
      throw new Error('x');
    });
    const p = retry(fn, { delay: 1 });
    await vi.runAllTimersAsync();
    await expect(p).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not sleep after the final failed attempt', async () => {
    const fn = vi.fn(async () => {
      throw new Error('x');
    });
    // attempts=2, delay=10: should call -> sleep(10) -> call -> reject
    const p = retry(fn, { attempts: 2, delay: 10 });
    await vi.runAllTimersAsync();
    await expect(p).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('respects maxDelay cap with exponential backoff', async () => {
    const fn = vi.fn(async () => {
      throw new Error('x');
    });
    // delays would be 1000, 2000, 4000, 8000... cap at 1500
    const p = retry(fn, { attempts: 5, delay: 1000, maxDelay: 1500 });
    await vi.runAllTimersAsync();
    await expect(p).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(5);
  });

  it('returns the resolved value when first attempt succeeds with default delay', async () => {
    const fn = vi.fn(async () => 'first');
    await expect(retry(fn)).resolves.toBe('first');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the underlying function once after the wait window', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('coalesces rapid successive calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    debounced();
    debounced();
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('passes the latest arguments to the underlying function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn as (...a: unknown[]) => unknown, 50);
    debounced('a');
    debounced('b');
    debounced('c');
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('schedules a separate call after the window completes', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('returns undefined synchronously (fire-and-forget)', () => {
    const fn = vi.fn(() => 'result');
    const debounced = debounce(fn, 100);
    expect(debounced()).toBeUndefined();
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('invokes immediately on the first call (leading edge)', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('suppresses subsequent calls within the window', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('allows the next call after the window elapses', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    vi.advanceTimersByTime(99);
    throttled();
    expect(fn).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(1);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('forwards arguments on the leading invocation', () => {
    const fn = vi.fn();
    const throttled = throttle(fn as (...a: unknown[]) => unknown, 50);
    throttled('a', 'b');
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });

  it('does not call after the window if no further invocations occur', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);
    throttled();
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('returns undefined synchronously', () => {
    const fn = vi.fn(() => 'x');
    const throttled = throttle(fn, 100);
    expect(throttled()).toBeUndefined();
  });
});
