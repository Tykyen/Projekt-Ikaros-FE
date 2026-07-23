/**
 * Cesta v2 — výcvik taktické mapy (05 §5b; mluvčí MĚĎÁK, úsečný rozkazový
 * formát, 02 §2). Předání Joe→Měďák = replika 10 v narratorLine kroku 1.
 * Odchylky od podkladu (zapsané): worldBinding 'none' — TM operace na FE
 * nenesou worldId (choke-point mapApi), práva na ně má stejně jen
 * PJ/Pomocný PJ, takže kroky matchují event bez worldId; podklad psal
 * 'joins', ale PJ žádný join.requested nikdy nevyšle.
 * TM je kolizní plocha (FAB skrytý) → doručení přes proužek a „?" panel.
 */
import type { Journey } from './pjStart';

export const TM_VYCVIK: Journey = {
  id: 'tm-vycvik',
  persona: 'pj',
  estimateMin: 12,
  worldBinding: 'none',
  phases: [
    {
      title: 'Postav bojiště',
      steps: [
        {
          id: 'tm.scena',
          title: 'Založ scénu',
          narratorLine:
            '„Tady velí Měďák," řekla Joe. Správně. Přebírám. První rozkaz: založ scénu — bez bojiště není výcvik.',
          cta: { label: 'Otevřít mapu', to: '/svet/:worldSlug/takticka-mapa' },
          done: { kind: 'fe-event', event: 'scene.created' },
          topicId: 'insitu.tm',
          skipAllowed: true,
          estMin: 2,
        },
        {
          id: 'tm.tokeny',
          title: 'Nasaď jednotky',
          narratorLine:
            'Prázdná mapa nikoho nezastaví. Přetáhni z palety postavu nebo bestii na pole.',
          cta: { label: 'Otevřít mapu', to: '/svet/:worldSlug/takticka-mapa' },
          done: { kind: 'fe-event', event: 'token.spawned' },
          topicId: 'insitu.tm',
          skipAllowed: true,
          estMin: 3,
        },
      ],
    },
    {
      title: 'Ovládni ji',
      steps: [
        {
          id: 'tm.mlha',
          title: 'Mlha války',
          narratorLine:
            'Co hráči nevidí, to je tvá zbraň. Vyzkoušej štětec mlhy — zakryj a odkryj kus mapy.',
          cta: { label: 'Otevřít mapu', to: '/svet/:worldSlug/takticka-mapa' },
          done: { kind: 'fe-event', event: 'fog.used' },
          topicId: 'insitu.tm',
          skipAllowed: true,
          estMin: 2,
        },
        {
          id: 'tm.iniciativa',
          title: 'Zaveď pořádek boje',
          narratorLine:
            'Boj bez pořadí je vřava. Označ jednotky „V boji" (karta tokenu), pak spusť iniciativu — lišta nahoře ti seřadí tahy.',
          cta: { label: 'Otevřít mapu', to: '/svet/:worldSlug/takticka-mapa' },
          done: { kind: 'fe-event', event: 'initiative.started' },
          topicId: 'insitu.tm',
          skipAllowed: true,
          estMin: 2,
        },
        {
          id: 'tm.orchestrace',
          title: 'Rozděl jednotky',
          narratorLine:
            'Velitel určuje, kdo kde bojuje. V orchestraci přiřaď hráče na scénu, přepni se na jinou, nebo scénu odstav.',
          cta: { label: 'Otevřít mapu', to: '/svet/:worldSlug/takticka-mapa' },
          // Přiřazení JINÉHO člena (scene.assigned) ∨ deaktivace scény —
          // obojí je skutečný orchestrální tah; aktivace vzniká už založením
          // scény (krok 1), tou se velet nedá (verifikace 07/23).
          done: {
            kind: 'fe-event',
            event: 'scene.assigned',
            altEvents: [{ event: 'scene.deactivated' }],
          },
          topicId: 'insitu.orchestrace',
          skipAllowed: true,
          estMin: 3,
        },
      ],
    },
  ],
};
