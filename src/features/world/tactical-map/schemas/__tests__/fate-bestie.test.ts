import { describe, it, expect } from 'vitest';
import { fateBestieSchema } from '../fate/bestie';

// Fate Core bestie schéma přepsáno (v2): Dovednosti + následky sloty,
// bez conflict_state enumu a fate_points. Sjednoceno s deníkem.
describe('fateBestieSchema (Fate Core)', () => {
  it('má správnou meta (v2)', () => {
    expect(fateBestieSchema.systemId).toBe('fate');
    expect(fateBestieSchema.entityType).toBe('bestie');
    expect(fateBestieSchema.version).toBe(2);
  });

  it('má volný seznam Dovedností (ne 6 fixních přístupů)', () => {
    const skills = fateBestieSchema.sections.find((s) => s.key === 'skills');
    expect(skills).toBeDefined();
    const field = skills!.fields.find((f) => f.key === 'skills');
    expect(field?.type).toBe('list');
    const allKeys = fateBestieSchema.sections.flatMap((s) => s.fields.map((f) => f.key));
    expect(allKeys).not.toContain('appr_careful');
  });

  it('má Hlavní koncept + následky sloty, ne conflict_state/fate_points', () => {
    const allKeys = fateBestieSchema.sections.flatMap((s) => s.fields.map((f) => f.key));
    expect(allKeys).toContain('highConcept');
    expect(allKeys).toContain('cons_mild');
    expect(allKeys).not.toContain('conflict_state');
    expect(allKeys).not.toContain('fate_points');
  });
});
