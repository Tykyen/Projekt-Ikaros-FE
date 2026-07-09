/**
 * 16.2b-2 — nabídka herních systémů pro tvorbu community bytosti / návrh statů.
 * Klíč = systemId (klíč ve `statblocks`); normalizuje se přes resolveSystemId.
 */
export const BESTIE_SYSTEMS: { id: string; label: string }[] = [
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

export function systemLabel(id: string): string {
  return BESTIE_SYSTEMS.find((sys) => sys.id === id)?.label ?? id;
}
