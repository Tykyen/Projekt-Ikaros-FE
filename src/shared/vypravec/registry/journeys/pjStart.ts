/**
 * Cesta 26.1 — PJ Start (05 §3, doslovně dle podkladu).
 * Kroky 1 mluví Ishida (platformní routa), 2–5 Joe (svět).
 * `:worldSlug` v CTA doplní engine z contextWorldId cesty.
 */
import type { RoutePattern } from '@/app/routeRegistry';
import type { VypravecEventName, VypravecEventPayload } from '../../engine/events';

export interface EventMatch {
  worldId?: 'contextWorldId';
  channelKind?: VypravecEventPayload['channelKind'];
  pageType?: string;
}

export type DoneCondition =
  | {
      kind: 'fe-event';
      event: VypravecEventName;
      match?: EventMatch;
      /** Alternativní eventy (05 §4: „žádost NEBO zpráva v Putyce"). */
      altEvents?: { event: VypravecEventName; match?: EventMatch }[];
    }
  | { kind: 'probe'; key: 'gateOpened' | 'publicShowcaseOn' }
  | {
      kind: 'visit';
      route: RoutePattern;
      /** Alternativní routy (05 §4: vesmiry ∨ nábory). */
      alt?: RoutePattern[];
      scoped?: boolean;
    };

export interface JourneyStep {
  id: string;
  title: string;
  narratorLine: string;
  cta: { label: string; to: string };
  /** Kotva data-vypravec — po navigaci se prvek zvýrazní (03 §8.2). */
  anchor?: import('../anchors').AnchorId;
  done: DoneCondition;
  topicId?: string;
  skipAllowed: true;
  estMin: number;
}

export interface Journey {
  id: string;
  persona: 'pj' | 'hrac' | 'worldbuilder';
  estimateMin: number;
  /** 04 §2.1 — jak cesta získává contextWorldId. */
  worldBinding: 'creates' | 'joins' | 'none';
  phases: { title: string; steps: JourneyStep[] }[];
}

export const PJ_START: Journey = {
  id: 'pj-start',
  persona: 'pj',
  estimateMin: 15,
  worldBinding: 'creates',
  phases: [
    {
      title: 'Postav svět',
      steps: [
        {
          id: 'pj.zaloz-svet',
          title: 'Založ svět',
          narratorLine:
            'Stačí název, žánr a systém — zbytek za tebe rozumně přednastavím. Jen pozor: technologie, magie a náboženství se volí jen teď.',
          cta: { label: 'Založit svět', to: '/ikaros/vytvorit-svet' },
          done: { kind: 'fe-event', event: 'world.created' },
          topicId: 'svet.zalozeni',
          skipAllowed: true,
          estMin: 5,
        },
        {
          id: 'pj.rozhledni-se',
          title: 'Rozhlédni se',
          narratorLine:
            'Svět není prázdný. Ishida ti předchystal pravidla, měny i kalendář — projdi si, co už stojí.',
          cta: { label: 'Ukaž mi můj svět', to: '/svet/:worldSlug' },
          done: { kind: 'visit', route: '/svet/:worldSlug', scoped: true },
          topicId: 'svet.neni-prazdny',
          skipAllowed: true,
          estMin: 2,
        },
      ],
    },
    {
      title: 'Oživ ho',
      steps: [
        {
          id: 'pj.prvni-npc',
          title: 'První NPC',
          narratorLine:
            'Svět ožije postavami. Založ první NPC — stačí jméno a pár vět, zbytek dopíšeš, až bude potřeba.',
          cta: {
            label: 'Založit NPC',
            to: '/svet/:worldSlug/nova-stranka?type=NPC',
          },
          done: {
            kind: 'fe-event',
            event: 'page.created',
            // `Page.type` nese české display hodnoty (pages.types.ts) — 'NPC'
            match: { worldId: 'contextWorldId', pageType: 'NPC' },
          },
          topicId: 'postava.3-tier',
          skipAllowed: true,
          estMin: 4,
        },
        {
          id: 'pj.otevri-branu',
          title: 'Otevři bránu a pozvi lidi',
          narratorLine:
            'Tvůj svět je zatím soukromý — nikdo cizí se dovnitř nedostane. Otevři přístup, pošli pozvánku, nebo vyvěs nábor.',
          cta: {
            label: 'Nastavení přístupu',
            to: '/svet/:worldSlug/nastaveni#pristup',
          },
          anchor: 'nastaveni-tab-pristup',
          done: { kind: 'probe', key: 'gateOpened' },
          topicId: 'svet.vstup',
          skipAllowed: true,
          estMin: 3,
        },
        {
          id: 'pj.napis-do-sveta',
          title: 'Napiš do svého světa',
          narratorLine:
            'Otevřu ti Globální konverzaci tvého světa. Napiš cokoli — třeba pozdrav pro budoucí hráče.',
          cta: { label: 'Otevřít chat světa', to: '/svet/:worldSlug/chat' },
          done: {
            kind: 'fe-event',
            event: 'message.sent',
            match: { worldId: 'contextWorldId', channelKind: 'world' },
          },
          topicId: 'svet.chat.kanal-vs-konverzace',
          skipAllowed: true,
          estMin: 1,
        },
      ],
    },
  ],
};
