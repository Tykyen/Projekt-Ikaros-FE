/**
 * Platformový registr RPG systémů — nabídka pro **platformové katalogy**
 * (komunitní bestiář 16.2b, nábory 19.3b), kde je entita sdílená napříč světy.
 *
 * ⚠️ **Tři registry, každý jinou osu — neplést:**
 * | Registr | Id | Kdo |
 * |---|---|---|
 * | `PLATFORM_SYSTEMS` (zde) | **canonical** (`drdplus`, `coc`) | platformové katalogy |
 * | `RPG_SYSTEMS` (CreateWorldPage/constants/systems.ts) | **dlouhá** (`drd-plus`, `call-of-cthulhu`) | wizard + nastavení světa; kontrakt s BE `SystemPresetsService` |
 * | `SYSTEM_ALIASES` / `resolveSystemId` (features/world/systemId.ts) | most mezi nimi | diary/map/combat registry |
 *
 * `world.system` drží **dlouhé** id → před uložením do platformové entity ho
 * VŽDY přežeň přes `resolveSystemId` (jinak vznikne `drd-plus` vedle `drdplus`
 * a filtr je rozdělí na dva systémy).
 *
 * Historie: 19.3b — přesunuto z `features/ikaros/bestiar/components/systems.ts`
 * (kde vzniklo jako `BESTIE_SYSTEMS`), aby nábory nevyrobily třetí kopii
 * nabídky. Bestiář re-exportuje beze změny chování.
 */
export interface PlatformSystem {
  /** Canonical engine id (klíč ve `statblocks`, hodnota `Nabor.system`). */
  id: string;
  label: string;
}

export const PLATFORM_SYSTEMS: PlatformSystem[] = [
  { id: 'generic', label: 'Obecný / vlastní' },
  { id: 'dnd5e', label: 'D&D 5e' },
  { id: 'drd16', label: 'Dračí doupě 1.6' },
  { id: 'drd2', label: 'Dračí doupě II' },
  { id: 'drdplus', label: 'Dračí doupě+' },
  { id: 'jad', label: 'Jeskyně a draci' },
  { id: 'drdh', label: 'Dračí hlídka' },
  { id: 'pi', label: 'Příběhy impéria' },
  { id: 'matrix', label: 'Matrix' },
  { id: 'coc', label: 'Volání Cthulhu' },
  { id: 'gurps', label: 'GURPS' },
  { id: 'shadowrun', label: 'Shadowrun' },
  { id: 'fae', label: 'Fate Accelerated' },
  { id: 'fate', label: 'Fate Core' },
];

/** Canonical id → lidský název. Neznámé id se vrací beze změny. */
export function systemLabel(id: string): string {
  return PLATFORM_SYSTEMS.find((sys) => sys.id === id)?.label ?? id;
}

/** Validace hodnoty do platformové entity (parita s BE `@IsIn`). */
export const PLATFORM_SYSTEM_IDS: readonly string[] = PLATFORM_SYSTEMS.map(
  (s) => s.id,
);
