import { describe, it, expect } from 'vitest';
import { rollDiaryRequest } from './rollFromDiary';

describe('rollDiaryRequest', () => {
  it('fate: vrací fate payload (4 kostky) + total = sum + modifier', () => {
    const r = rollDiaryRequest({ label: 'Ledový dotek', modifier: 4 });
    expect(r).not.toBeNull();
    const p = r!.dicePayload;
    expect(p.type).toBe('fate');
    expect(p.faces).toHaveLength(4);
    expect(p.label).toBe('Ledový dotek');
    expect(p.modifier).toBe(4);
    // klíčový invariant readoutu: total = hod kostek + velikost schopnosti
    expect(p.total).toBe(p.sum + 4);
  });

  it('fate bez modifieru: total === sum (default modifier 0)', () => {
    const r = rollDiaryRequest({ label: 'Iniciativa' });
    expect(r!.dicePayload.total).toBe(r!.dicePayload.sum);
    expect(r!.dicePayload.modifier).toBe(0);
  });

  it('generic d20: jedna kostka, total = sum + modifier', () => {
    const r = rollDiaryRequest({ label: 'Útok', modifier: 2, kind: 'd20' });
    const p = r!.dicePayload;
    expect(p.type).toBe('d20');
    expect(p.faces).toHaveLength(1);
    expect(p.total).toBe(p.sum + 2);
  });

  it('content nese popisek a začíná rozpoznatelným prefixem', () => {
    const r = rollDiaryRequest({ label: 'Vnímání', modifier: 1, kind: 'd6' });
    expect(r!.content).toContain('Vnímání');
    expect(r!.content.startsWith('Hod Kostkou')).toBe(true);
  });

  it('d100: payload typu d100', () => {
    const r = rollDiaryRequest({ label: 'Štěstí', kind: 'd100' });
    expect(r!.dicePayload.type).toBe('d100');
  });
});
