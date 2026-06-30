/**
 * 16b — performSheetRoll: propsání volitelného `breakdown` + `damage` z
 * requestu do `dicePayload` (DrdH rozpis hodu zbraně). Ostatní pole hodu
 * jsou náhodná (rollEngine) — testujeme jen, že nová pole protečou beze změny
 * a že request bez nich payload nemění (BC pro ostatní systémy).
 */
import { describe, it, expect } from 'vitest';
import { performSheetRoll } from './rollFromSheet';

describe('performSheetRoll — breakdown/damage propsání (16b)', () => {
  it('útok zbraně: breakdown(útoč+vlastnost) + damage protečou do payloadu', () => {
    const res = performSheetRoll({
      label: 'Útok: Květinový meč',
      modifier: 5,
      kind: 'd6+',
      breakdown: [
        { label: 'útoč', value: 6 },
        { label: 'Sil', value: -1 },
      ],
      damage: '+1',
    });
    expect(res).not.toBeNull();
    expect(res!.dicePayload.breakdown).toEqual([
      { label: 'útoč', value: 6 },
      { label: 'Sil', value: -1 },
    ]);
    expect(res!.dicePayload.damage).toBe('+1');
    // total = součet kostek + modifier (modifier zůstává zdrojem pravdy).
    expect(res!.dicePayload.total).toBe(res!.dicePayload.sum + 5);
  });

  it('obrana: breakdown bez damage → payload má breakdown, damage undefined', () => {
    const res = performSheetRoll({
      label: 'Obrana: Štít',
      modifier: 3,
      kind: 'd6+',
      breakdown: [
        { label: 'obr', value: 2 },
        { label: 'Obr', value: 1 },
      ],
    });
    expect(res).not.toBeNull();
    expect(res!.dicePayload.breakdown).toEqual([
      { label: 'obr', value: 2 },
      { label: 'Obr', value: 1 },
    ]);
    expect(res!.dicePayload.damage).toBeUndefined();
  });

  it('regrese: hod bez breakdown/damage nemá tato pole (ostatní systémy beze změny)', () => {
    const res = performSheetRoll({
      label: 'Vnímání',
      modifier: 2,
      kind: 'd10',
    });
    expect(res).not.toBeNull();
    expect(res!.dicePayload.breakdown).toBeUndefined();
    expect(res!.dicePayload.damage).toBeUndefined();
  });

  it('prázdný breakdown ([]) se nepřipne (nepřebije nic)', () => {
    const res = performSheetRoll({
      label: 'Test',
      modifier: 0,
      kind: 'd6',
      breakdown: [],
    });
    expect(res).not.toBeNull();
    expect(res!.dicePayload.breakdown).toBeUndefined();
  });
});
