/**
 * 16.2a — testy diary-system preset registry.
 *
 * Hlavní účel: parita s nabídkou RPG_SYSTEMS. Drift mezi „dlouhým" id
 * z nabídky (call-of-cthulhu, draci-hlidka, drd-plus) a krátkým engine id
 * (coc, drdh, drdplus) způsobil, že svět spadl na generic sheet bez vizuálu
 * (D-NEW-SYS-DIARY-DRIFT). Tenhle test ten drift chytí.
 */
import { describe, it, expect } from 'vitest';
import {
  getDiaryPreset,
  hasDedicatedSheet,
  listKnownSystems,
} from '../registry';
import {
  RPG_SYSTEMS,
  SYSTEM_CUSTOM_ID,
} from '@/features/ikaros/pages/CreateWorldPage/constants/systems';

describe('getDiaryPreset', () => {
  it('resolvuje canonical system ID', () => {
    expect(getDiaryPreset('matrix').id).toBe('matrix');
    expect(getDiaryPreset('coc').id).toBe('coc');
    expect(getDiaryPreset('dnd5e').id).toBe('dnd5e');
  });

  it('resolvuje legacy aliasy', () => {
    expect(getDiaryPreset('dnd').id).toBe('dnd5e');
    expect(getDiaryPreset('pribehy_imperia').id).toBe('pi');
    expect(getDiaryPreset('pribehy-imperia').id).toBe('pi');
    expect(getDiaryPreset('pribehy').id).toBe('pi');
  });

  it('16.2a — aliasy „dlouhých" id z nabídky', () => {
    expect(getDiaryPreset('draci-hlidka').id).toBe('drdh');
    expect(getDiaryPreset('drd-plus').id).toBe('drdplus');
    expect(getDiaryPreset('call-of-cthulhu').id).toBe('coc');
  });

  it('case-insensitive', () => {
    expect(getDiaryPreset('FATE').id).toBe('fate');
    expect(getDiaryPreset('DnD').id).toBe('dnd5e');
  });

  it('null / undefined / prázdný string → generic', () => {
    expect(getDiaryPreset(null).id).toBe('generic');
    expect(getDiaryPreset(undefined).id).toBe('generic');
    expect(getDiaryPreset('').id).toBe('generic');
  });

  it('neznámý systém → generic (žádný crash)', () => {
    expect(getDiaryPreset('mysterygame').id).toBe('generic');
  });
});

describe('parita s nabídkou RPG_SYSTEMS', () => {
  // 16.2a guard — každý systém z nabídky tvorby světa musí mít dedikovaný
  // sheet (přímo nebo aliasem). `vlastni` = generic záměrně (engine, ne obsah).
  for (const sys of RPG_SYSTEMS) {
    if (sys.id === SYSTEM_CUSTOM_ID) continue;
    it(`„${sys.label}" (${sys.id}) → dedikovaný sheet, ne generic`, () => {
      expect(getDiaryPreset(sys.id).id).not.toBe('generic');
      expect(hasDedicatedSheet(sys.id)).toBe(true);
    });
  }
});

describe('listKnownSystems', () => {
  it('vrací registrované presety včetně generic', () => {
    const list = listKnownSystems();
    expect(list).toContain('generic');
    expect(list).toContain('matrix');
  });
});
