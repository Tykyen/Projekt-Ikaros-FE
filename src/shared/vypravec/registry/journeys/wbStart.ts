/**
 * Cesta 26.3 — Worldbuilder (05 §5, doslovně). Odchylka zapsaná ve spec-26.7:
 * krok „První vztah v Pavučině" jede přes event `subject.created` (probe
 * hasPavucinaSubject by chtěl pavučinová data, která FE mimo Pavučinu nemá).
 */
import type { Journey } from './pjStart';

export const WB_START: Journey = {
  id: 'wb-start',
  persona: 'worldbuilder',
  estimateMin: 15,
  worldBinding: 'creates',
  phases: [
    {
      title: 'Postav si ateliér',
      steps: [
        {
          id: 'wb.zaloz-atelier',
          title: 'Založ svět',
          narratorLine:
            'Tvůj ateliér. Doporučuji ho zatím nechat soukromý — ukázat ho světu můžeš, až bude co ukazovat.',
          cta: { label: 'Založit svět', to: '/ikaros/vytvorit-svet' },
          done: { kind: 'fe-event', event: 'world.created' },
          topicId: 'svet.zalozeni',
          skipAllowed: true,
          estMin: 5,
        },
        {
          id: 'wb.prvni-stranka',
          title: 'První vlastní stránka',
          narratorLine:
            'Založ lokaci a zkus v textu [[wikilink]] — stránky se ti začnou samy propojovat.',
          cta: { label: 'Nová stránka', to: '/svet/:worldSlug/nova-stranka?typ=lokace' },
          done: {
            kind: 'fe-event',
            event: 'page.created',
            match: { worldId: 'contextWorldId' },
          },
          topicId: 'svet.wiki.wikilinky',
          skipAllowed: true,
          estMin: 4,
        },
      ],
    },
    {
      title: 'Ukaž ho',
      steps: [
        {
          id: 'wb.pavucina',
          title: 'První vztah v Pavučině',
          narratorLine:
            'Pavučina drží vztahy tvého světa pohromadě. Přidej první subjekt a propoj ho s tím, co už máš.',
          cta: { label: 'Otevřít Pavučinu', to: '/svet/:worldSlug/pavucina' },
          anchor: 'pavucina-novy-subjekt',
          done: {
            kind: 'fe-event',
            event: 'subject.created',
            match: { worldId: 'contextWorldId' },
          },
          topicId: 'svet.pavucina',
          skipAllowed: true,
          estMin: 4,
        },
        {
          id: 'wb.ukaz-to',
          title: 'Ukaž to světu',
          narratorLine:
            'Výkladní skříň pustí čtenáře k vybraným stránkám, aniž bys otevíral celý svět. Vystav, na co jsi hrdý.',
          cta: {
            label: 'Nastavení přístupu',
            to: '/svet/:worldSlug/nastaveni#pristup',
          },
          anchor: 'nastaveni-tab-pristup',
          done: { kind: 'probe', key: 'publicShowcaseOn' },
          topicId: 'svet.vykladni-skrin',
          skipAllowed: true,
          estMin: 2,
        },
      ],
    },
  ],
};
