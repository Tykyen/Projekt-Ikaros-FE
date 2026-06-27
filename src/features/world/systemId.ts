/**
 * Sjednocená normalizace `world.system` napříč FE.
 *
 * Proč: nabídka tvorby světa (`RPG_SYSTEMS`) ukládá do `world.system` „dlouhá"
 * id (`drd-plus`, `call-of-cthulhu`, `draci-hlidka`), engine je zná „krátce"
 * (`drdplus`, `coc`, `drdh`) + legacy hodnoty (`dnd`, `pribehy_imperia`).
 * Dřív měl alias mapu KAŽDÝ resolver zvlášť (diary registry, map registry) a
 * `COMBAT_PANELS` ji neměl vůbec → DrD+/CoC svět spadl na legacy `DiaryTab`
 * místo dedikovaného combat panelu (vizuálně „deník na mapě se nepropisuje").
 *
 * Tohle je jediná zdrojová pravda aliasů — všichni konzumenti normalizují přes
 * `resolveSystemId`, takže nový systém s dlouhým id stačí přidat sem.
 *
 * Vrací `string` (ne svázaný `SystemId` typ) schválně — diary i map registry
 * mají vlastní `SystemId` union (dosud nesjednocené), oba dělají
 * `canonical in REGISTRY` gate, takže `string` jim sedí bez cyklu typů.
 */

/** Legacy / „dlouhá" id z nabídky → canonical engine id. */
export const SYSTEM_ALIASES: Record<string, string> = {
  // legacy DnD id
  dnd: 'dnd5e',
  // legacy Příběhy Impéria hodnoty z `world.system`
  pribehy: 'pi',
  pribehy_imperia: 'pi',
  'pribehy-imperia': 'pi',
  // 16.2a — nabídka (RPG_SYSTEMS) ukládá „dlouhá" id, engine zná krátká.
  'draci-hlidka': 'drdh',
  'drd-plus': 'drdplus',
  'call-of-cthulhu': 'coc',
};

/**
 * Normalizuje `world.system` na canonical engine id (lowercase + alias).
 * Prázdné / null / undefined → `''` (volající fallbackuje na generic).
 * Neznámé id se vrací beze změny (jen lowercased) — volající rozhodne.
 */
export function resolveSystemId(
  systemId: string | null | undefined,
): string {
  if (!systemId) return '';
  const normalized = systemId.toLowerCase();
  return SYSTEM_ALIASES[normalized] ?? normalized;
}
