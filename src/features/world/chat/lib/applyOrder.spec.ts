import { describe, it, expect } from 'vitest';
import { applyOrder } from './applyOrder';

interface Item {
  id: string;
}
const items = (...ids: string[]): Item[] => ids.map((id) => ({ id }));
const ids = (arr: Item[]): string[] => arr.map((i) => i.id);

describe('applyOrder', () => {
  it('prázdné pořadí → vrací vstup beze změny (stejná reference)', () => {
    const input = items('a', 'b', 'c');
    expect(applyOrder(input, [], (i) => i.id)).toBe(input);
  });

  it('seřadí dle osobního pořadí', () => {
    const out = applyOrder(items('a', 'b', 'c'), ['c', 'a', 'b'], (i) => i.id);
    expect(ids(out)).toEqual(['c', 'a', 'b']);
  });

  it('neznámé (nově vzniklé) ID jdou na konec a drží vstupní pořadí', () => {
    const out = applyOrder(items('a', 'b', 'c', 'd'), ['b', 'a'], (i) => i.id);
    expect(ids(out)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('nemutuje vstupní pole', () => {
    const input = items('a', 'b');
    const snapshot = ids(input);
    applyOrder(input, ['b', 'a'], (i) => i.id);
    expect(ids(input)).toEqual(snapshot);
  });
});
