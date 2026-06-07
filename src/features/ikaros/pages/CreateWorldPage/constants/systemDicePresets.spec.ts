import { describe, it, expect } from 'vitest';
import { DICE } from './dice';
import { RPG_SYSTEMS, SYSTEM_CUSTOM_ID } from './systems';
import {
  SYSTEM_DICE_PRESETS,
  getDicePreset,
  diceMatchesPreset,
  applySystemChange,
} from './systemDicePresets';

describe('systemDicePresets — integrita dat', () => {
  it('každá hodnota presetu je validní DICE label', () => {
    for (const [system, preset] of Object.entries(SYSTEM_DICE_PRESETS)) {
      for (const die of preset) {
        expect(DICE, `${system}: neznámý label "${die}"`).toContain(die);
      }
    }
  });

  it('preset klíče jsou známé systémy (kromě vlastni)', () => {
    const known = new Set(RPG_SYSTEMS.map((s) => s.id));
    for (const id of Object.keys(SYSTEM_DICE_PRESETS)) {
      expect(known.has(id), `neznámý systém "${id}"`).toBe(true);
    }
  });

  it('vlastni systém preset nemá', () => {
    expect(getDicePreset(SYSTEM_CUSTOM_ID)).toEqual([]);
  });

  it('getDicePreset vrací kopii (mutace neovlivní zdroj)', () => {
    const a = getDicePreset('matrix');
    a.push('d20');
    expect(getDicePreset('matrix')).toEqual(['Fate kostky']);
  });
});

describe('applySystemChange — smart-replace (B2)', () => {
  it('prázdný výběr → preset nového systému', () => {
    expect(applySystemChange('matrix', 'dnd5e', [])).toEqual(
      getDicePreset('dnd5e'),
    );
  });

  it('výběr = preset starého systému → preset nového', () => {
    const fromMatrix = getDicePreset('matrix');
    expect(applySystemChange('matrix', 'gurps', fromMatrix)).toEqual(
      getDicePreset('gurps'),
    );
  });

  it('výběr = preset bez ohledu na pořadí → stále se přepíše', () => {
    const reordered = ['d6', 'd4', 'd10', 'd8', 'd20', 'd12', 'd100 / procenta'];
    expect(applySystemChange('dnd5e', 'matrix', reordered)).toEqual(
      getDicePreset('matrix'),
    );
  });

  it('ruční výběr (≠ preset) → beze změny', () => {
    const manual = ['d20', 'Pool d10'];
    expect(applySystemChange('matrix', 'dnd5e', manual)).toBe(manual);
  });

  it('přepnutí na vlastni → beze změny', () => {
    const dice = getDicePreset('matrix');
    expect(applySystemChange('matrix', SYSTEM_CUSTOM_ID, dice)).toBe(dice);
  });

  it('přepnutí na neznámý systém → beze změny', () => {
    const dice = ['d6'];
    expect(applySystemChange('matrix', 'neznamy-xyz', dice)).toBe(dice);
  });
});

describe('diceMatchesPreset', () => {
  it('shoduje se nezávisle na pořadí', () => {
    expect(diceMatchesPreset('gurps', ['3d6', 'd6'])).toBe(true);
  });

  it('false při odlišném výběru', () => {
    expect(diceMatchesPreset('gurps', ['d6'])).toBe(false);
  });

  it('false pro systém bez presetu', () => {
    expect(diceMatchesPreset(SYSTEM_CUSTOM_ID, [])).toBe(false);
  });
});
