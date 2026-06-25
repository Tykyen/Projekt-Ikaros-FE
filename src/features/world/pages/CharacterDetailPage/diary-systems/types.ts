/**
 * 8.7a — Diary System Presets: typy.
 *
 * Preset = balíček (data + vizuál) pro deník postavy, vázaný na `world.system`.
 * Skin (data-theme) je nezávislý — preset ovlivňuje JEN obsah deníku.
 */
import type { ComponentType } from 'react';
import type { CharacterDiary } from '../../api/characters.types';

/**
 * Známé herní systémy. `generic` = fallback bez dedikovaného sheetu
 * (renderuje se přes `DiaryBlockView` z PJ-definovaného schématu 8.5).
 *
 * Při přidání nového systému: doplň ID sem, vytvoř `presets/<id>.ts`,
 * `styles/<id>.css`, `sheets/<id>/...`, a zaregistruj v `registry.ts`.
 */
export const SYSTEM_IDS = [
  'generic',
  'matrix',
  'coc',
  'dnd5e',
  'drd2',
  'drdh',
  'drdplus',
  'drd16',
  'fate',
  'pi',
  'gurps',
  'jad',
  'shadowrun',
] as const;

export type SystemId = (typeof SYSTEM_IDS)[number];

/**
 * Props, které dostane dedikovaný `SystemSheet`. Drží surový `CharacterDiary`,
 * mód (view/edit) a `onChange` pro propagaci změn customData zpět do parent
 * (`DiaryTab`), který se postará o uložení přes mutation.
 */
export interface SystemSheetProps {
  diary: CharacterDiary;
  mode: 'view' | 'edit';
  worldId: string;
  worldSlug: string;
  characterSlug: string;
  /**
   * Volá se při změně customData v edit módu. View ho nevolá.
   *
   * 2026-05-24 (D-040-followup) — preferovaný tvar je
   * `{ customDataPatch: { onlyChangedKey: value }}` (delta merge na BE).
   * Tvar `{ customData: {...} }` zůstává podporován pro BC, ale **vyvolává
   * data loss** při switchi systemu (přepíše DB; ostatní system_* keys
   * zmizí). Nový kód musí používat customDataPatch.
   */
  onChange?: (
    next:
      | { customDataPatch: Record<string, unknown> }
      | { customData: Record<string, unknown> },
  ) => void;
  /**
   * 10.2c-edit-9g (Fáze C) — optional roll handler. Pokud sheet je
   * embeddovaný v tactical-map TokenInfoPanel, konzument (TacticalMapView)
   * provrahuje tento callback. Klik na dovednost / iniciativu volá
   * `onRoll({ label, modifier, kind })`. Sheet bez tohoto propu (např.
   * CharacterDetailPage) klikatelnost nepouští.
   */
  onRoll?: (req: { label: string; modifier?: number; kind?: 'fate' | 'd4' | 'd6' | 'd6+' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100' }) => void;
}

/**
 * Preset = registry entry. Pokud má `SystemSheet`, použije se místo generic
 * DiaryBlockView renderingu. `loadStyles` je dynamic import CSS modulu se
 * scope `[data-diary-system="<id>"]` — lazy load při mount providera.
 */
export interface DiarySystemPreset {
  id: SystemId;
  /** Lidský název pro UI (např. „Call of Cthulhu 7e"). */
  name: string;
  /** Krátký popis pro tooltip / info panel. */
  description?: string;
  /** Dedikovaný React sheet. Pokud chybí, fallback na generic blockový view. */
  SystemSheet?: ComponentType<SystemSheetProps>;
  /** Dynamic import CSS souboru se scoped pravidly. */
  loadStyles?: () => Promise<unknown>;
}
