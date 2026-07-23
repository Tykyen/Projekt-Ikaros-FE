/**
 * Rozšíření revize 07/23 (mluvčí Joe) — pokračování cesty hráče PO přijetí
 * do světa. hrac-start končí u brány; tohle je „první dny uvnitř": dnes
 * hráče opouštíme přesně v momentě nejvyšší motivace. Startuje se CTA
 * z bubliny „Postava je na světě" (zkontrolujCekaniHrace) — pull-first,
 * žádný auto-start. Svět se fixuje při startu (startCesty svet param).
 */
import type { Journey } from './pjStart';

export const HRAC_VE_SVETE: Journey = {
  id: 'hrac-ve-svete',
  persona: 'hrac',
  estimateMin: 8,
  worldBinding: 'none',
  phases: [
    {
      title: 'První dny ve světě',
      steps: [
        {
          id: 'hv.postava',
          title: 'Poznej svou postavu',
          narratorLine:
            'PJ ti připravil postavu. Projdi si ji — deník, výbavu i finance najdeš na jednom místě.',
          cta: { label: 'Moje postava', to: '/svet/:worldSlug/moje-postava' },
          done: {
            kind: 'visit',
            route: '/svet/:worldSlug/moje-postava',
            scoped: true,
          },
          topicId: 'postava.3-tier',
          skipAllowed: true,
          estMin: 3,
        },
        {
          id: 'hv.pozdrav',
          title: 'Pozdrav u stolu',
          narratorLine:
            'Stůl ožívá prvním slovem. Napiš do chatu světa — klidně jen, že jsi dorazil.',
          cta: { label: 'Otevřít chat', to: '/svet/:worldSlug/chat' },
          done: {
            kind: 'fe-event',
            event: 'message.sent',
            match: { worldId: 'contextWorldId', channelKind: 'world' },
          },
          topicId: 'insitu.chat',
          skipAllowed: true,
          estMin: 2,
        },
        {
          id: 'hv.rozhledni',
          title: 'Projdi si svět',
          narratorLine:
            'Encyklopedie je paměť světa — lokace, postavy, pravidla. Rozhlédni se, ať víš, kde hraješ.',
          cta: { label: 'Encyklopedie', to: '/svet/:worldSlug/stranky' },
          done: {
            kind: 'visit',
            route: '/svet/:worldSlug/stranky',
            scoped: true,
          },
          skipAllowed: true,
          estMin: 3,
        },
      ],
    },
  ],
};
