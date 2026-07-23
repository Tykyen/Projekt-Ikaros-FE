/**
 * Cesta 26.2 — Hráč (05 §4, doslovně). Jen 2 odškrtávací kroky + čekací
 * stav (krok závislý na akci PJ NENÍ krok — progress „2/3 navždy" demotivuje).
 * Čekací stav řeší engine (zkontrolujStavCest): oslava „hotovo z tvé strany",
 * probe hasCharacter → bublina, timeout 7 dní → tip na nábory.
 */
import type { Journey } from './pjStart';

export const HRAC_START: Journey = {
  id: 'hrac-start',
  persona: 'hrac',
  estimateMin: 7,
  worldBinding: 'joins',
  phases: [
    {
      title: 'Najdi si stůl',
      steps: [
        {
          id: 'hrac.najdi-stul',
          title: 'Najdi stůl',
          narratorLine:
            'Světy mají čtyři režimy přístupu — někam vejdeš rovnou, jinde se klepe. Vyber si, kde chceš hrát.',
          cta: { label: 'Procházet světy', to: '/ikaros/vesmiry' },
          anchor: 'vesmiry-katalog',
          done: {
            kind: 'visit',
            route: '/ikaros/vesmiry',
            alt: ['/ikaros/nabory'],
          },
          topicId: 'svet.vstup',
          skipAllowed: true,
          estMin: 3,
        },
        {
          id: 'hrac.ozvi-se',
          title: 'Ozvi se',
          narratorLine:
            'Požádej o vstup do světa, který tě zaujal — nebo se zatím ohlas v Putyce. První slovo je nejtěžší.',
          cta: { label: 'Otevřít Putyku', to: '/chat' },
          done: {
            kind: 'fe-event',
            event: 'join.requested',
            altEvents: [
              { event: 'message.sent', match: { channelKind: 'putyka' } },
              { event: 'message.sent', match: { channelKind: 'camp' } },
            ],
          },
          topicId: 'svet.zadatel',
          skipAllowed: true,
          estMin: 3,
        },
      ],
    },
  ],
};
