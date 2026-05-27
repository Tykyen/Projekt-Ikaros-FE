import { describe, it, expect } from 'vitest';
import { drd2BestieSchema } from '../drd2/bestie';

describe('drd2BestieSchema', () => {
  it('has correct meta', () => {
    expect(drd2BestieSchema.systemId).toBe('drd2');
    expect(drd2BestieSchema.entityType).toBe('bestie');
    expect(drd2BestieSchema.version).toBe(1);
  });

  it('has 5 main stats fields (mirror Matrix legacy)', () => {
    const main = drd2BestieSchema.sections.find((s) => s.key === 'main-stats');
    expect(main).toBeDefined();
    expect(main!.fields).toHaveLength(5);
    const labels = main!.fields.map((f) => f.label);
    expect(labels).toEqual(['MAX HP', 'Zbroj', 'Zranění', 'Pohyb', 'Iniciativa']);
  });

  it('health.max má combatBehavior=damageable', () => {
    const main = drd2BestieSchema.sections.find((s) => s.key === 'main-stats');
    const healthMax = main!.fields.find((f) => f.key === 'health.max');
    expect(healthMax?.combatBehavior).toBe('damageable');
    expect(healthMax?.required).toBe(true);
    expect(healthMax?.default).toBe(10);
  });

  it('armor má combatBehavior=armor-reducer', () => {
    const main = drd2BestieSchema.sections.find((s) => s.key === 'main-stats');
    const armor = main!.fields.find((f) => f.key === 'armor');
    expect(armor?.combatBehavior).toBe('armor-reducer');
  });

  it('initiative.base má combatBehavior=initiative', () => {
    const main = drd2BestieSchema.sections.find((s) => s.key === 'main-stats');
    const init = main!.fields.find((f) => f.key === 'initiative.base');
    expect(init?.combatBehavior).toBe('initiative');
  });
});
