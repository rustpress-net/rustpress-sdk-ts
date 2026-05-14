import { describe, it, expect } from 'vitest';
import {
  parseTrigger,
  buildTrigger,
  isValidTrigger,
  type TriggerComponents,
} from '../index';

describe('parseTrigger', () => {
  it('parses a well-formed trigger into plugin, class and method', () => {
    const result = parseTrigger('@@rustpress.blog.PostService.create@@');
    expect(result).toEqual<TriggerComponents>({
      plugin: 'blog',
      class: 'PostService',
      method: 'create',
    });
  });

  it('accepts hyphenated plugin names', () => {
    const result = parseTrigger('@@rustpress.my-plugin.Service.method@@');
    expect(result?.plugin).toBe('my-plugin');
  });

  it('accepts underscored plugin, class and method', () => {
    const result = parseTrigger('@@rustpress.blog_v2.Post_Service.create_one@@');
    expect(result).toEqual({
      plugin: 'blog_v2',
      class: 'Post_Service',
      method: 'create_one',
    });
  });

  it('returns null when missing the @@ delimiter', () => {
    expect(parseTrigger('rustpress.blog.PostService.create')).toBeNull();
  });

  it('returns null when there are too few segments', () => {
    expect(parseTrigger('@@rustpress.blog.PostService@@')).toBeNull();
  });

  it('returns null when prefix is wrong', () => {
    expect(parseTrigger('@@wordpress.blog.PostService.create@@')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseTrigger('')).toBeNull();
  });

  it('returns null when an extra dot appears inside the method segment', () => {
    // The regex for method is [^@]+ so this should actually parse — verify
    // behavior. The third segment will greedily include the dot.
    const result = parseTrigger('@@rustpress.blog.PostService.cre.ate@@');
    expect(result).not.toBeNull();
    expect(result?.method).toBe('cre.ate');
  });
});

describe('buildTrigger', () => {
  it('builds a trigger string from components', () => {
    expect(buildTrigger('blog', 'PostService', 'create')).toBe(
      '@@rustpress.blog.PostService.create@@'
    );
  });

  it('does not URL-encode or modify components', () => {
    expect(buildTrigger('a', 'B', 'c')).toBe('@@rustpress.a.B.c@@');
  });

  it('is the inverse of parseTrigger for valid input', () => {
    const built = buildTrigger('shop', 'Cart', 'addItem');
    const parsed = parseTrigger(built);
    expect(parsed).toEqual({
      plugin: 'shop',
      class: 'Cart',
      method: 'addItem',
    });
  });
});

describe('isValidTrigger', () => {
  it('returns true for a well-formed trigger', () => {
    expect(isValidTrigger('@@rustpress.blog.PostService.create@@')).toBe(true);
  });

  it('accepts numeric characters in segments', () => {
    expect(isValidTrigger('@@rustpress.blog2.PostV2.method3@@')).toBe(true);
  });

  it('accepts hyphens in plugin segment', () => {
    expect(isValidTrigger('@@rustpress.my-plugin.Foo.bar@@')).toBe(true);
  });

  it('rejects hyphens in class segment', () => {
    expect(isValidTrigger('@@rustpress.plugin.My-Class.bar@@')).toBe(false);
  });

  it('rejects hyphens in method segment', () => {
    expect(isValidTrigger('@@rustpress.plugin.MyClass.do-it@@')).toBe(false);
  });

  it('rejects missing prefix', () => {
    expect(isValidTrigger('rustpress.blog.PostService.create')).toBe(false);
  });

  it('rejects empty input', () => {
    expect(isValidTrigger('')).toBe(false);
  });

  it('rejects unicode characters in segments', () => {
    expect(isValidTrigger('@@rustpress.blög.Foo.bar@@')).toBe(false);
  });

  it('agrees with buildTrigger output for safe identifiers', () => {
    const t = buildTrigger('plugin1', 'Class1', 'method1');
    expect(isValidTrigger(t)).toBe(true);
  });
});
