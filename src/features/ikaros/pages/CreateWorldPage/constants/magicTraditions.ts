/**
 * 2.3e — Tradice (typy) magie pro multi-select v create formu. Zatržené tradice
 * se při založení vypíšou na stránku Magický systém.
 *
 * ⚠️ Názvy duplikované s BE (`magic-template.ts`) — cross-repo import nelze.
 * Při změně uprav obě místa. Škála MÚ (úrovně) drží jen BE.
 *
 * Viz spec: docs/arch/phase-2/spec-2.3e-magic-seed.md
 */
export const MAGIC_TRADITIONS = [
  'Vílí',
  'Božská',
  'Šamanská',
  'Runová',
  'Akademická',
  'Krevní',
  'Démonická',
  'Nekromantická',
  'Psionická',
  'Přírodní',
  'Kosmická',
  'Snová',
  'Alchymická',
] as const;

/** Krátké popisky tradic (native tooltip přes `title` na chipech). */
export const MAGIC_TRADITION_DESCRIPTIONS: Record<string, string> = {
  Vílí: 'Smlouvy, jména, sliby, krása, iluze.',
  Božská: 'Modlitba, víra, zázraky, kněží a církev.',
  Šamanská: 'Duchové, předci, rituály, tabu, posvátná místa.',
  Runová: 'Znaky, symboly a vyrytá moc.',
  Akademická: 'Školy, knihy, studium — kouzlo jako disciplína.',
  Krevní: 'Oběť, krev a rodová pouta.',
  Démonická: 'Pakty, vyvolávání a cena duše.',
  Nekromantická: 'Smrt, nemrtví a duše.',
  Psionická: 'Síla mysli, telepatie, vůle.',
  Přírodní: 'Živly, zvířata, rostliny a krajina.',
  Kosmická: 'Hvězdy, sféry a pradávné entity.',
  Snová: 'Sny, iluze, podvědomí a jiné roviny.',
  Alchymická: 'Lektvary, transmutace a receptury.',
};
