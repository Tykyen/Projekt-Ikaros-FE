import { describe, it, expect } from 'vitest';
import { worldStubMap } from './worldStubMap';

describe('worldStubMap', () => {
  it('každá sekce má neprázdný title a step', () => {
    for (const [area, meta] of Object.entries(worldStubMap)) {
      expect(meta.title, `${area}.title`).toBeTruthy();
      expect(meta.step, `${area}.step`).toBeTruthy();
    }
  });

  it('pokrývá všechny nehotové world sekce (19)', () => {
    // 8.2e — `characters` odstraněn (plná stránka).
    // 9.3-I + nav reorg — `timeline` + admin items odstraněny (plné stránky).
    expect(Object.keys(worldStubMap)).toHaveLength(19);
  });
});
