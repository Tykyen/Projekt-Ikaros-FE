/**
 * Spec 26.7 — 26.5 „Krátké návody": 10 návodů, každý řeší JEDEN úkol do
 * 5 minut (šablona NÁVOD 06 §4: 3–7 kroků, imperativ, deep-link, done-signál).
 * Stejný tvar jako HelpTopic → TopicView je renderuje beze změny; žijí ale
 * ve vlastním seznamu (menu „Návody"), ne v kontextových kartách.
 */
import type { HelpTopic } from './types';

export const NAVODY: readonly HelpTopic[] = [
  {
    id: 'navod.zaloz-a-otevri-svet',
    title: 'Založ a otevři svět',
    tags: ['navod', 'svet', 'zalozeni', 'pristup'],
    routes: [],
    body: {
      odstavce: ['Od prázdna k otevřené bráně za pár minut.'],
      kroky: [
        'Otevři Vytvořit svět a vyplň název, žánr a systém — zbytek nech na defaultech.',
        'Rozmysli technologii, magii a náboženství — tohle se volí jen teď.',
        'Projdi seedované stránky v Encyklopedii a uprav, co nesedí.',
        'V Nastavení → Přístup přepni svět ze Soukromého na Otevřený nebo Veřejný.',
        'Hotovo poznáš tak, že se svět objeví v katalogu Vesmírů.',
      ],
    },
    akce: [{ label: 'Vytvořit svět', to: '/ikaros/vytvorit-svet' }],
    source: { kapitola: '03' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'navod.prvni-postava',
    title: 'První postava (pro PJ)',
    tags: ['navod', 'postava', 'pc', 'prideleni'],
    routes: [],
    body: {
      odstavce: ['Postavy hráčů zakládá PJ — takhle na to.'],
      kroky: [
        'Otevři Postavy svého světa a dej Nová postava.',
        'Vyber typ Postava hráče a vyplň základ dle systému.',
        'V detailu postavy ji přiřaď hráči (vlastníkovi).',
        'Hráč ji od té chvíle vidí pod Moje postava — done.',
      ],
    },
    akce: [{ label: 'Postavy', to: '/svet/:worldSlug/postavy' }],
    source: { kapitola: '12' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'navod.prvni-hod',
    title: 'První hod kostkou',
    tags: ['navod', 'kostky', 'hod', 'dice'],
    routes: [],
    body: {
      odstavce: ['Hází se v chatu světa a na taktické mapě.'],
      kroky: [
        'PJ: v Nastavení světa povol kostky (whitelist) — bez toho ikona nic nenabídne.',
        'Otevři chat světa a klikni na 🎲 v poli zprávy.',
        'Vyber kostku a hoď — výsledek padne do konverzace všem.',
        'Na taktické mapě najdeš tentýž 🎲 u výřezu scény.',
      ],
    },
    akce: [{ label: 'Chat světa', to: '/svet/:worldSlug/chat' }],
    source: { kapitola: '13' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'navod.pozvi-hrace',
    title: 'Pozvi hráče',
    tags: ['navod', 'pozvanka', 'invite', 'odkaz'],
    routes: [],
    body: {
      odstavce: ['Tři cesty, jak dostat lidi dovnitř.'],
      kroky: [
        'Otevři Hráče svého světa.',
        'Pozvi konkrétního uživatele jménem, NEBO vygeneruj pozvací odkaz a pošli ho kamkoli.',
        'Alternativně vyvěs inzerát na Náborech — hlásí se ti zájemci sami.',
        'Příchozí přes pozvánku je Čtenář; na Hráče ho povýšíš v Nastavení → Členové.',
      ],
    },
    akce: [
      { label: 'Hráči', to: '/svet/:worldSlug/hraci' },
      { label: 'Nábory', to: '/ikaros/nabory' },
    ],
    source: { kapitola: '09' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'navod.mapa-k-boji',
    title: 'Od prázdné mapy k boji',
    tags: ['navod', 'takticka mapa', 'tokeny', 'scena', 'boj'],
    routes: [],
    body: {
      odstavce: ['Nejrychlejší cesta k první bojové scéně.'],
      kroky: [
        'Otevři Taktickou mapu a založ novou scénu (podklad = obrázek nebo export ze Stavitele).',
        'Přetáhni na mapu tokeny postav z panelu.',
        'Přidej protivníky spawnem z Bestiáře (token = kopie šablony).',
        'Spusť iniciativu — pořadí se řadí samo.',
        'Boj běží: posouváš tokeny, hážeš 🎲, upravuješ HP na tokenu.',
      ],
    },
    akce: [{ label: 'Taktická mapa', to: '/svet/:worldSlug/takticka-mapa' }],
    source: { kapitola: '14' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'navod.mlha-valky',
    title: 'Mlha války a viditelnost',
    tags: ['navod', 'mlha', 'fog', 'los', 'viditelnost'],
    routes: [],
    body: {
      odstavce: ['Hráči mají vidět jen to, co jejich postavy.'],
      kroky: [
        'Na Taktické mapě zapni mlhu války v nastavení scény.',
        'Odkrývej ručně štětcem, NEBO zapni LoS — výhled se počítá od tokenů podle zdí.',
        'Zdi a překážky má scéna z exportu Stavitele, nebo je dokreslíš.',
        'Zkontroluj si náhled pohledu hráče, ať nevidí za roh.',
      ],
    },
    akce: [{ label: 'Taktická mapa', to: '/svet/:worldSlug/takticka-mapa' }],
    source: { kapitola: '14' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'navod.prvni-wiki',
    title: 'První wiki stránka + wikilink',
    tags: ['navod', 'wiki', 'stranka', 'wikilink'],
    routes: [],
    body: {
      odstavce: ['Encyklopedie roste psaním, ne plánováním.'],
      kroky: [
        'Otevři Novou stránku a vyber typ (lokace je dobrý start).',
        'Piš text a jména dalších míst zabal do [[dvojitých závorek]].',
        'Ulož — každý wikilink je teď odkaz; neexistující cíle založíš klikem.',
        'Stránku najdeš v Encyklopedii; hvězdičkou si ji připneš na dashboard.',
      ],
    },
    akce: [{ label: 'Nová stránka', to: '/svet/:worldSlug/nova-stranka' }],
    source: { kapitola: '11' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'navod.kalendar-cas',
    title: 'Kalendář a herní čas',
    tags: ['navod', 'kalendar', 'cas', 'udalosti'],
    routes: [],
    audience: ['pomocnyPJ', 'pj', 'admin'],
    minAudienceNote: 'Kalendář světa je pohled PJ — hráčům čas oznamuje vypravěč hry.',
    body: {
      odstavce: ['Herní čas drží kalendář světa.'],
      kroky: [
        'Otevři Kalendář světa (vidí Pomocný PJ a výš).',
        'Zvol preset kalendáře, nebo si nastav vlastní měsíce a svátky v Nastavení → Kalendáře.',
        'Posouvej aktuální datum podle děje — události se k němu vážou.',
        'Časovou osu příběhu vedle toho kreslí Timeline.',
      ],
    },
    akce: [{ label: 'Kalendář', to: '/svet/:worldSlug/kalendar' }],
    source: { kapitola: '15' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'navod.obchod-penize',
    title: 'Obchod a peníze',
    tags: ['navod', 'obchod', 'penize', 'meny', 'nakup'],
    routes: [],
    body: {
      odstavce: ['Ekonomika světa od měn po první nákup.'],
      kroky: [
        'PJ: zkontroluj měny světa v Převodníku měn (seedují se se světem).',
        'PJ: naskladni Obchod — položky ber z katalogů Společné tvorby, nebo vlastní.',
        'Hráč: nakupuje v Obchodě za peníze SVÉ postavy (stav vidíš ve Financích postavy).',
        'Nestačí-li zůstatek, obchod nákup odmítne — doplnění je na PJ.',
      ],
    },
    akce: [{ label: 'Obchod', to: '/svet/:worldSlug/obchod' }],
    source: { kapitola: '12' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'navod.najdi-spoluhrace',
    title: 'Najdi spoluhráče',
    tags: ['navod', 'nabory', 'lfg', 'spoluhraci'],
    routes: [],
    body: {
      odstavce: ['Hráče i stůl najdeš na jednom místě.'],
      kroky: [
        'Otevři Nábory — nástěnku „hledám hru / hledám hráče".',
        'Filtruj podle systému a žánru, ať čteš jen relevantní inzeráty.',
        'PJ: založ vlastní inzerát tlačítkem Nový nábor a popiš svůj stůl.',
        'Hráč: odpověz na inzerát, nebo se zatím ohlas v Putyce — první slovo je nejtěžší.',
      ],
    },
    akce: [
      { label: 'Nábory', to: '/ikaros/nabory' },
      { label: 'Putyka', to: '/chat' },
    ],
    source: { kapitola: '04' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
] as const;
