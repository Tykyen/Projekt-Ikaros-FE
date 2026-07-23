/**
 * D-080a (07-migrace-napovedy §4) — texty anonymního rozcestníku „Začni tady"
 * (pravý panel + mobilní drawer v IkarosLayout). Texty žijí tady, chování
 * (registrace modal · Link na vesmíry · otevření Vypravěče) zůstává
 * v `AnonStartPanel` — panel je render-slot registru (07 §4).
 */

export interface AnonStartKrok {
  /** Stabilní klíč kroku — AnonStartPanel na něj váže akci (ne na pořadí). */
  id: 'registrace' | 'vesmiry' | 'vypravec';
  titulek: string;
  popis: string;
}

export const ANON_START_KROKY: AnonStartKrok[] = [
  {
    id: 'registrace',
    titulek: 'Zaregistruj se',
    popis: 'Zdarma, během chvilky',
  },
  {
    id: 'vesmiry',
    titulek: 'Vytvoř svůj svět',
    popis: 'Nebo se rozhlédni po vesmírech — jde to i bez účtu',
  },
  {
    id: 'vypravec',
    titulek: 'Pozvi přátele',
    popis: 'Nevíš kudy? Vypravěč tě provede — klepni sem',
  },
];
