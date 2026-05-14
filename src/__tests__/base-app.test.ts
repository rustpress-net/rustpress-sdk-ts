/**
 * Tests for the App contract.
 *
 * The SDK exposes an `App` interface (not a `BaseApp` class). The `render()`
 * method returns `React.ReactNode`, so we stub the React namespace and verify
 * that an implementing class satisfies the contract.
 */
import { describe, it, expect, vi } from 'vitest';
import type {
  App,
  AppContext,
  AppMetadata,
  AppMenuConfig,
  AppRoute,
  DialogOptions,
  DialogResult,
  Notification,
} from '../index';

// React.ReactNode is referenced in the SDK type signature for App.render.
// Provide a global ambient declaration so the implementing class compiles
// without a React dependency.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace React {
    type ReactNode = unknown;
  }
}

class TestApp implements App {
  id: string;
  metadata: AppMetadata;
  rendered: unknown = null;

  constructor(id: string, metadata: Partial<AppMetadata> = {}) {
    this.id = id;
    this.metadata = {
      name: metadata.name ?? id,
      version: metadata.version ?? '1.0.0',
      ...metadata,
    };
  }

  render(): React.ReactNode {
    this.rendered = { type: 'div', props: { children: this.metadata.name } };
    return this.rendered;
  }
}

describe('App contract', () => {
  it('exposes id and metadata', () => {
    const app = new TestApp('my-app', { name: 'My App', version: '1.2.3' });
    expect(app.id).toBe('my-app');
    expect(app.metadata.name).toBe('My App');
    expect(app.metadata.version).toBe('1.2.3');
  });

  it('render() produces a node and updates internal state', () => {
    const app = new TestApp('a');
    expect(app.rendered).toBeNull();
    const node = app.render();
    expect(node).not.toBeNull();
    expect(app.rendered).toBe(node);
  });

  it('is assignable to the App interface', () => {
    const a: App = new TestApp('a');
    expect(typeof a.render).toBe('function');
  });
});

describe('AppMetadata shape', () => {
  it('accepts a menu config', () => {
    const menu: AppMenuConfig = {
      title: 'Tools',
      icon: 'wrench',
      position: 'sidebar',
      order: 5,
    };
    const app = new TestApp('a', { menu });
    expect(app.metadata.menu?.position).toBe('sidebar');
    expect(app.metadata.menu?.order).toBe(5);
  });

  it('accepts route definitions', () => {
    const routes: AppRoute[] = [
      { path: '/', component: 'Home', exact: true },
      { path: '/admin', component: 'Admin', permissions: ['admin'] },
    ];
    const app = new TestApp('a', { routes });
    expect(app.metadata.routes).toHaveLength(2);
    expect(app.metadata.routes?.[1]?.permissions).toEqual(['admin']);
  });

  it('accepts a permissions array', () => {
    const app = new TestApp('a', { permissions: ['read', 'write'] });
    expect(app.metadata.permissions).toEqual(['read', 'write']);
  });

  it('accepts icon and author fields', () => {
    const app = new TestApp('a', {
      icon: 'star',
      author: 'Test Author',
      description: 'Test desc',
    });
    expect(app.metadata.icon).toBe('star');
    expect(app.metadata.author).toBe('Test Author');
    expect(app.metadata.description).toBe('Test desc');
  });
});

describe('AppContext interactions (structural)', () => {
  it('navigate / showToast / showNotification are callable hooks', () => {
    const navigate = vi.fn<(path: string) => void>();
    const showNotification = vi.fn<(n: Notification) => void>();
    const showToast = vi.fn<(m: string) => void>();

    const ctx = {
      navigate,
      showNotification,
      showToast,
    } as unknown as AppContext;

    ctx.navigate('/dashboard');
    ctx.showNotification({ title: 't', message: 'm' });
    ctx.showToast('hi');

    expect(navigate).toHaveBeenCalledWith('/dashboard');
    expect(showNotification).toHaveBeenCalledWith({ title: 't', message: 'm' });
    expect(showToast).toHaveBeenCalledWith('hi');
  });

  it('showDialog() returns a DialogResult', async () => {
    const showDialog = vi.fn<(o: DialogOptions) => Promise<DialogResult>>(
      async () => ({ confirmed: true, value: 'yes' })
    );
    const ctx = { showDialog } as unknown as AppContext;
    const result = await ctx.showDialog({
      title: 'Confirm',
      message: 'Are you sure?',
      type: 'confirm',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    expect(result.confirmed).toBe(true);
    expect(result.value).toBe('yes');
    expect(showDialog).toHaveBeenCalledOnce();
  });

  it('showDialog() supports a cancelled result', async () => {
    const ctx = {
      showDialog: async () => ({ confirmed: false }) as DialogResult,
    } as unknown as AppContext;
    const r = await ctx.showDialog({ title: 't', message: 'm' });
    expect(r.confirmed).toBe(false);
    expect(r.value).toBeUndefined();
  });
});
