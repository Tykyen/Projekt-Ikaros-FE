import { describe, it, expect } from 'vitest';
import { worldStubMap } from './worldStubMap';

describe('worldStubMap', () => {
  it('každá sekce má neprázdný title a step', () => {
    for (const [area, meta] of Object.entries(worldStubMap)) {
      expect(meta.title, `${area}.title`).toBeTruthy();
      expect(meta.step, `${area}.step`).toBeTruthy();
    }
  });

  it('pokrývá všechny nehotové world sekce (22)', () => {
    expect(Object.keys(worldStubMap)).toHaveLength(22);
  });
});
