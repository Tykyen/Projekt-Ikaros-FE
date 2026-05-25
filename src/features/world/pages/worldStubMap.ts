/**
 * Spec 5.1 — jediný zdroj pravdy pro placeholdery nehotových sekcí světa.
 * Klíč `WorldStubArea` → název sekce + krok roadmapy, kdy bude hotová.
 * `WorldStubPage` čte odtud; stub stránky předají jen klíč `area`.
 */
export interface WorldStubMeta {
  /** Název sekce zobrazený v nadpisu placeholderu. */
  title: string;
  /** Krok roadmapy, kdy bude sekce hotová (label, např. "9.4"). */
  step: string;
  /** Volitelná věta kontextu pod nadpisem. */
  note?: string;
}

export type WorldStubArea =
  | 'chat'
  | 'pages'
  | 'page-viewer'
  | 'page-editor'
  | 'pages-admin'
  | 'rules'
  | 'my-character'
  | 'npc-directory'
  | 'map'
  | 'tactical-map'
  | 'calendar'
  | 'weather'
  | 'events'
  | 'campaign'
  | 'storylines'
  | 'shop'
  | 'sounds'
  | 'currency'
  | 'settings';

export const worldStubMap: Record<WorldStubArea, WorldStubMeta> = {
  chat: {
    title: 'Chat světa',
    step: '6',
    note: 'Světový chat s kanály a rolemi.',
  },
  pages: {
    title: 'Stránky světa',
    step: '7',
    note: 'Wiki světa — lore, lokace, pravidla.',
  },
  'page-viewer': { title: 'Stránka světa', step: '7' },
  'page-editor': { title: 'Editor stránky', step: '7' },
  'pages-admin': { title: 'Správa stránek', step: '7' },
  rules: {
    title: 'Pravidla světa',
    step: '7',
    note: 'Pravidla jako wiki stránka světa.',
  },
  'my-character': { title: 'Moje postava', step: '8' },
  'npc-directory': { title: 'Adresář postav', step: '8' },
  map: { title: 'Mapa vesmíru', step: '10.1' },
  'tactical-map': { title: 'Taktická mapa', step: '10.2' },
  calendar: { title: 'Kalendář', step: '9' },
  weather: { title: 'Generátor počasí', step: '9.4' },
  events: { title: 'Akce', step: '9.1' },
  campaign: { title: 'Pavučina vztahů', step: '11.1' },
  storylines: { title: 'Scénáře a příběhy', step: '11.2' },
  shop: { title: 'Obchod světa', step: '11.3' },
  sounds: { title: 'Zvuková databáze', step: '13.3' },
  currency: { title: 'Převodník měn', step: '11.4' },
  settings: {
    title: 'Nastavení světa',
    step: '5.3',
    note: 'Základní info, přístup, členové, theme.',
  },
};
