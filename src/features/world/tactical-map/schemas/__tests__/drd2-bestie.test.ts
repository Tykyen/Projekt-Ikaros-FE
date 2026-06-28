import { describe, it, expect } from 'vitest';
import { drd2BestieSchema } from '../drd2/bestie';

// 16.2e — DrD2 bestie schéma přepsáno (Sudba = HP, sekce „stav"); test sladěn
// s aktuální realitou (dřív testoval Matrix-legacy „main-stats" strukturu).
describe('drd2BestieSchema', () => {
  it('has correct meta', () => {
    expect(drd2BestieSchema.systemId).toBe('drd2');
    expect(drd2BestieSchema.entityType).toBe('bestie');
    expect(drd2BestieSchema.version).toBe(2);
  });

  it('sudba má combatBehavior=damageable (HP bestie)', () => {
    const stav = drd2BestieSchema.sections.find((s) => s.key === 'stav');
    expect(stav).toBeDefined();
    const sudba = stav!.fields.find((f) => f.key === 'sudba');
    expect(sudba?.combatBehavior).toBe('damageable');
    expect(sudba?.required).toBe(true);
    expect(sudba?.default).toBe(14);
  });

  it('movement má combatBehavior=movement', () => {
    const stav = drd2BestieSchema.sections.find((s) => s.key === 'stav');
    const move = stav!.fields.find((f) => f.key === 'movement');
    expect(move?.combatBehavior).toBe('movement');
  });

  it('initiative.base má combatBehavior=initiative', () => {
    const stav = drd2BestieSchema.sections.find((s) => s.key === 'stav');
    const init = stav!.fields.find((f) => f.key === 'initiative.base');
    expect(init?.combatBehavior).toBe('initiative');
  });
});
