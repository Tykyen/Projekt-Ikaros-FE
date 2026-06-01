import { describe, it, expect } from 'vitest';
import {
  STATUS_EDGE_STYLE,
  TYPE_TOKEN,
  resolveToken,
  typeCssVar,
  valenceIntensity,
  valenceToken,
} from './campaignColors';

describe('valence → barva hrany', () => {
  it('záporná → val-neg, nula → val-zero, kladná → val-pos', () => {
    expect(valenceToken(-2)).toBe('--cmp-val-neg');
    expect(valenceToken(0)).toBe('--cmp-val-zero');
    expect(valenceToken(3)).toBe('--cmp-val-pos');
  });

  it('intenzita roste s |valence| (0.4 … 1)', () => {
    expect(valenceIntensity(0)).toBe(0.4);
    expect(valenceIntensity(3)).toBe(1);
    expect(valenceIntensity(-3)).toBe(1);
  });
});

describe('typ → token', () => {
  it('mapuje všech 7 typů', () => {
    expect(TYPE_TOKEN.STATE).toBe('--cmp-state');
    expect(TYPE_TOKEN.OTHER).toBe('--cmp-other');
    expect(typeCssVar('PC')).toBe('var(--cmp-pc)');
  });
});

describe('status → styl hrany', () => {
  it('crisis pulzuje, closed je bledý a tečkovaný', () => {
    expect(STATUS_EDGE_STYLE.crisis.pulse).toBe(true);
    expect(STATUS_EDGE_STYLE.closed.opacity).toBe(0.35);
    expect(STATUS_EDGE_STYLE.dormant.dash).toEqual([4, 4]);
    expect(STATUS_EDGE_STYLE.active.dash).toEqual([]);
  });
});

describe('resolveToken', () => {
  it('bez elementu vrátí fallback', () => {
    expect(resolveToken(null, '--cmp-pc')).toBe('gray');
    expect(resolveToken(undefined, '--cmp-pc', 'black')).toBe('black');
  });

  it('v jsdom (token nedefinován) vrátí fallback', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(resolveToken(el, '--cmp-undefined-token')).toBe('gray');
    el.remove();
  });
});
