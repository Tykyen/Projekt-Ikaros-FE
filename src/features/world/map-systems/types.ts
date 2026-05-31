/**
 * 10.2-prep-3 — typy pro map-system plugin registry.
 *
 * Plugin = balíček mapových komponent + logiky vázaný na `world.system`.
 * Paralelní k `CharacterDetailPage/diary-systems/` (deníky postavy), ale
 * pro taktickou mapu (10.2d–l): NPC modaly, default kostky, roll skill.
 *
 * Spec: docs/takticka-mapa-matrix.md §23.2.
 */
import type { ComponentType } from "react";
import type { SystemId } from "../pages/CharacterDetailPage/diary-systems/types";
import type { DiceRollCategory } from "../tactical-map/types";

// Re-export pro kompaktnost importu v map kódu.
export type { SystemId } from "../pages/CharacterDetailPage/diary-systems/types";

/**
 * Typ kostky (sdílený s krokem 6.3 dice engine). Nepoužívá enum aby PJ
 * světa mohl deklarovat libovolný typ ve `world.dice`.
 */
export type DieTypeId =
  | "fate"
  | "d4"
  | "d6"
  | "d8"
  | "d10"
  | "d12"
  | "d20"
  | "d100"
  | "mixed"
  | string;

/**
 * Výsledek skill rollu — minimální tvar. V MVP 4 (10.2j) bude reusovat
 * `DiceResult` z chat 6.3 engine.
 */
export interface MapRollResult {
  faces: (number | string)[];
  total: number;
  type: DieTypeId;
  skillLabel?: string;
  skillModifier?: number;
}

/**
 * Props pro NPC edit modal v taktické mapě (10.2d). Plná implementace přijde
 * v MVP 1; nyní placeholder (komponenta může být undefined → fallback).
 */
export interface MapNpcEditModalProps {
  template: Record<string, unknown> | null; // MapSceneNpc nebo prázdný (nový)
  onClose: () => void;
  onSave: (updated: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
}

/**
 * Props pro read-only NPC stat block (NpcDiary na mapě, 10.2l).
 */
export interface MapNpcStatBlockProps {
  npc: Record<string, unknown>; // MapSceneNpc shape
}

/**
 * MapSystemPlugin — registry entry per herní systém.
 *
 * Většina polí je optional v této fázi (10.2-prep-3). Plnit postupně:
 * - `defaultDice` + `id` + `label` — hned, slouží jako system metadata
 * - `NpcEditModal` + `NpcStatBlock` — MVP 1 (10.2d/e)
 * - `rollSkill` — MVP 4 (10.2j)
 *
 * Pokud plugin nemá konkrétní komponentu, konzument (TacticalMapPage)
 * fallback-uje na generic chování.
 */
export interface MapSystemPlugin {
  /** Canonical SystemId (shared s diary-systems pro konzistenci). */
  id: SystemId;
  /** Lidský label do UI (např. „Dungeons & Dragons 5e"). */
  label: string;
  /**
   * Default dice picker pro tento systém. Filtrované přes `world.dice`
   * v UI dropdownu na mapě (chat 6.3a stejný pattern).
   */
  defaultDice: DieTypeId[];

  /**
   * 10.2j — povolené kategorie hodů na mapě. Vždy aspoň 'custom'.
   * FATE/Matrix: skill + initiative + custom.
   */
  rollCategories: DiceRollCategory[];

  /** NPC edit modal (10.2d). Placeholder v této prep fázi. */
  NpcEditModal?: ComponentType<MapNpcEditModalProps>;
  /** NPC stat block read-only (10.2l). Placeholder v této prep fázi. */
  NpcStatBlock?: ComponentType<MapNpcStatBlockProps>;
  /**
   * Roll skill (10.2j). Reuse chat 6.3 dice engine.
   * Default fallback: parse `value` jako modifier, hodit `defaultDice[0]`.
   */
  rollSkill?: (
    skillName: string,
    value: string,
    modifier?: number,
  ) => MapRollResult;
}
