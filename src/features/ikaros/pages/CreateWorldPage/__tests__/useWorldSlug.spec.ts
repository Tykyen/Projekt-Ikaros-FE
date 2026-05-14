import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { slugify, useWorldSlug } from '../hooks/useWorldSlug';

describe('slugify', () => {
  it('transliteruje české znaky a sníží na lowercase', () => {
    expect(slugify('Šedý Hrad')).toBe('sedy-hrad');
  });

  it('mezery a speciální znaky převede na jednu pomlčku', () => {
    expect(slugify('Příběh & hra!')).toBe('pribeh-hra');
  });

  it('vícenásobné mezery sloučí do jedné pomlčky', () => {
    expect(slugify('aaa   bbb')).toBe('aaa-bbb');
  });

  it('ořízne na 40 znaků', () => {
    const long = 'a'.repeat(60);
    expect(slugify(long)).toHaveLength(40);
  });
});

describe('useWorldSlug', () => {
  it('auto-derivuje slug z názvu, dokud uživatel nezasáhne', () => {
    const { result, rerender } = renderHook(({ n }) => useWorldSlug(n), {
      initialProps: { n: '' },
    });
    rerender({ n: 'Šedý hrad' });
    expect(result.current.slug).toBe('sedy-hrad');
  });

  it('po manuálním editu zastaví auto-derive', () => {
    const { result, rerender } = renderHook(({ n }) => useWorldSlug(n), {
      initialProps: { n: 'Foo' },
    });
    expect(result.current.slug).toBe('foo');

    act(() => result.current.onSlugChange('my-slug'));
    expect(result.current.slug).toBe('my-slug');

    rerender({ n: 'Foo bar baz' });
    // Slug zůstává — auto-derive neaktivní.
    expect(result.current.slug).toBe('my-slug');
  });
});
