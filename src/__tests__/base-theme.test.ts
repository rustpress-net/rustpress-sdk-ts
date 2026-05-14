/**
 * Tests for the Theme contract.
 *
 * The SDK exposes a `Theme` interface (not a `BaseTheme` class). These tests
 * verify the structural contract by implementing the interface with a minimal
 * concrete class and checking metadata shape, color/font handling, and
 * partial/asset interactions.
 */
import { describe, it, expect, vi } from 'vitest';
import type {
  Theme,
  ThemeMetadata,
  ThemeColors,
  ThemeFonts,
  ThemeAssets,
  ThemePartials,
} from '../index';

class TestTheme implements Theme {
  id: string;
  metadata: ThemeMetadata;

  constructor(id: string, metadata: Partial<ThemeMetadata> = {}) {
    this.id = id;
    this.metadata = {
      name: metadata.name ?? id,
      version: metadata.version ?? '1.0.0',
      ...metadata,
    };
  }
}

describe('Theme metadata', () => {
  it('exposes id and required metadata fields', () => {
    const t = new TestTheme('my-theme', { name: 'My Theme', version: '0.9.0' });
    expect(t.id).toBe('my-theme');
    expect(t.metadata.name).toBe('My Theme');
    expect(t.metadata.version).toBe('0.9.0');
  });

  it('accepts optional description and author', () => {
    const t = new TestTheme('x', {
      description: 'A theme',
      author: 'Test',
    });
    expect(t.metadata.description).toBe('A theme');
    expect(t.metadata.author).toBe('Test');
  });

  it('accepts a screenshot URL', () => {
    const t = new TestTheme('x', { screenshot: '/img/theme.png' });
    expect(t.metadata.screenshot).toBe('/img/theme.png');
  });

  it('accepts a features list', () => {
    const t = new TestTheme('x', { features: ['dark-mode', 'rtl'] });
    expect(t.metadata.features).toEqual(['dark-mode', 'rtl']);
  });

  it('accepts a templates list', () => {
    const t = new TestTheme('x', { templates: ['home', 'post', '404'] });
    expect(t.metadata.templates).toEqual(['home', 'post', '404']);
  });

  it('is assignable to the Theme interface', () => {
    const t: Theme = new TestTheme('x');
    expect(t.metadata.name).toBe('x');
  });
});

describe('ThemeColors', () => {
  it('accepts the well-known color slots', () => {
    const colors: ThemeColors = {
      primary: '#000',
      secondary: '#111',
      accent: '#222',
      background: '#333',
      foreground: '#444',
      muted: '#555',
      border: '#666',
      error: '#f00',
      warning: '#ff0',
      success: '#0f0',
      info: '#00f',
    };
    expect(colors.primary).toBe('#000');
    expect(colors.success).toBe('#0f0');
  });

  it('allows arbitrary string keys via the index signature', () => {
    const colors: ThemeColors = {
      primary: '#000',
      brandPurple: '#a020f0',
    };
    expect(colors.brandPurple).toBe('#a020f0');
  });
});

describe('ThemeFonts', () => {
  it('accepts heading/body/mono', () => {
    const fonts: ThemeFonts = {
      heading: 'Inter',
      body: 'Source Sans',
      mono: 'JetBrains Mono',
    };
    expect(fonts.heading).toBe('Inter');
  });

  it('allows arbitrary string keys', () => {
    const fonts: ThemeFonts = { display: 'Bebas' };
    expect(fonts.display).toBe('Bebas');
  });
});

describe('ThemeAssets contract', () => {
  it('url() returns a string for any input path', () => {
    const assets: ThemeAssets = {
      url: (p) => `/assets/${p}`,
      inline: async (p) => `inline:${p}`,
    };
    expect(assets.url('style.css')).toBe('/assets/style.css');
  });

  it('inline() resolves to a string', async () => {
    const assets: ThemeAssets = {
      url: () => '',
      inline: async (p) => `<!-- ${p} -->`,
    };
    await expect(assets.inline('foo.svg')).resolves.toBe('<!-- foo.svg -->');
  });
});

describe('ThemePartials contract', () => {
  it('register() and render() can be wired together', async () => {
    const store = new Map<string, string>();
    const partials: ThemePartials = {
      register(name, template) {
        store.set(name, template);
      },
      async render(name, data) {
        const tpl = store.get(name) ?? '';
        return tpl.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
          String((data ?? {})[k] ?? '')
        );
      },
    };
    partials.register('greeting', 'Hello {{name}}');
    await expect(partials.render('greeting', { name: 'World' })).resolves.toBe(
      'Hello World'
    );
  });

  it('render() called on an unknown partial resolves to empty string', async () => {
    const partials: ThemePartials = {
      register: vi.fn(),
      async render() {
        return '';
      },
    };
    await expect(partials.render('missing')).resolves.toBe('');
  });
});
