import { describe, it, expect } from 'vitest';
import { faeBestieSchema, faeTokenSchema } from '../fae';

describe('faeBestieSchema (Fate Accelerated)', () => {
  it('má správnou meta', () => {
    expect(faeBestieSchema.systemId).toBe('fae');
    expect(faeBestieSchema.entityType).toBe('bestie');
  });

  it('má 6 fixních přístupů (Pečlivě…Lstivě)', () => {
    const appr = faeBestieSchema.sections.find((s) => s.key === 'approaches');
    expect(appr).toBeDefined();
    const keys = appr!.fields.map((f) => f.key);
    expect(keys).toEqual([
      'appr_careful',
      'appr_clever',
      'appr_flashy',
      'appr_forceful',
      'appr_quick',
      'appr_sneaky',
    ]);
  });

  it('Stres (health.max) je damageable + required', () => {
    const main = faeBestieSchema.sections.find((s) => s.key === 'main-stats');
    const stress = main!.fields.find((f) => f.key === 'health.max');
    expect(stress?.combatBehavior).toBe('damageable');
    expect(stress?.required).toBe(true);
  });

  it('má Hlavní koncept + následky sloty (ne conflict_state enum)', () => {
    const allKeys = faeBestieSchema.sections.flatMap((s) => s.fields.map((f) => f.key));
    expect(allKeys).toContain('highConcept');
    expect(allKeys).toContain('cons_mild');
    expect(allKeys).toContain('cons_severe');
    expect(allKeys).not.toContain('conflict_state');
    expect(allKeys).not.toContain('fate_points');
  });

  it('token schéma má stress damageable + initiative', () => {
    const keys = faeTokenSchema.sections.flatMap((s) => s.fields);
    expect(keys.find((f) => f.key === 'health.current')?.combatBehavior).toBe('damageable');
    expect(keys.find((f) => f.key === 'initiative.current')?.combatBehavior).toBe('initiative');
  });
});
