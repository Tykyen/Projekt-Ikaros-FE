/**
 * Spec 26.2 — RouteHeaders Tier 0 (25 rout + varianty; 01-mapa-prostoru §1).
 * Hlas: platformní routy mluví Ishida, world routy Joe (02 §2) — texty prošly
 * draft voice passem, ladění vyhrazeno vlastníkovi (režim „zatím").
 * Zdroj pravdy obsahu: docs/funkce/ (kapitoly dle mapy prostoru).
 */
import type { RouteHeader } from './types';

export const ROUTE_HEADERS: readonly RouteHeader[] = [
  // ── Platforma (Ishida) ──────────────────────────────────────────────────
  {
    route: '/',
    name: 'Úvodník',
    blurb:
      'Rozcestník celé platformy — novinky, tvoje světy a rychlé akce. Odsud vedou dveře všude.',
  },
  {
    route: '/ikaros/vesmiry',
    name: 'Vesmíry',
    blurb:
      'Katalog všech světů. Někam vejdeš rovnou, jinde se klepe — režim vstupu je u každého světa.',
  },
  {
    route: '/ikaros/vytvorit-svet',
    name: 'Tvorba světa',
    blurb:
      'Zakládáš svět: stačí název, žánr a systém, zbytek předchystám. Jen pozor — technologie, magie a náboženství se volí jen teď.',
  },
  {
    route: '/ikaros/nabory',
    name: 'Nábory',
    blurb:
      'Nástěnka hledání spoluhráčů: PJ hledají hráče, hráči stůl. Vypiš vlastní nábor, nebo odpověz na cizí.',
  },
  {
    route: '/ikaros/nabory/nova',
    name: 'Nový nábor',
    blurb: 'Napiš, koho hledáš a do jakého světa. Nábor uvidí celá platforma.',
  },
  {
    route: '/ikaros/napoveda',
    name: 'Nápověda',
    blurb:
      'Moje knihovna — vše o platformě v jednom svazku. Co nenajdeš tady, nenajdeš nikde.',
  },
  {
    route: '/ikaros/profil',
    name: 'Tvůj profil',
    blurb: 'Účet, avatar, soukromí a nastavení. Co změníš tady, platí všude.',
  },
  {
    route: '/ikaros/uzivatele',
    name: 'Lidé',
    blurb:
      'Adresář obyvatel platformy — přátelství a žádosti. Koho si přidáš, toho najdeš rychleji.',
  },
  {
    route: '/ikaros/posta',
    name: 'Pošta',
    blurb:
      'Soukromé zprávy mimo světy — linka mezi čtyřma očima. Co patří do hry, patří do chatu světa.',
  },
  {
    route: '/ikaros/tvorba',
    name: 'Společná tvorba',
    blurb:
      'Komunitní knihovny — bestie, byliny, kouzla, předměty a další. Ber si do světů, co se hodí, a přispěj vlastním.',
  },
  {
    route: '/chat',
    name: 'Putyka',
    blurb:
      'Společný chat celé platformy. Tady se nepíše kronika — zprávy mizí po hodině.',
  },
  {
    route: '/chat/camp',
    name: 'Fantasy camp',
    blurb:
      'Atmosférická roleplay místnost mimo světy. Vstupuješ jako svá Camp postava.',
  },
  {
    route: '/chat/camp2',
    name: 'Mystery camp',
    blurb:
      'Atmosférická roleplay místnost mimo světy. Vstupuješ jako svá Camp postava.',
  },
  {
    route: '/chat/camp3',
    name: 'Sci-fi camp',
    blurb:
      'Atmosférická roleplay místnost mimo světy. Vstupuješ jako svá Camp postava.',
  },
  {
    route: '/invite/:token',
    name: 'Pozvánka',
    blurb: 'Někdo tě zve do svého světa. Přijmi — a brána se otevře.',
  },

  // ── Svět (Joe) ──────────────────────────────────────────────────────────
  {
    route: '/svet/:worldSlug',
    name: 'Přehled světa',
    blurb: 'Vstupní síň světa — novinky, rychlé akce a lidé, co jsou zrovna tady.',
    audienceNotes: {
      anon: 'Jako host vidíš jen průčelí; o vstup požádáš tlačítkem u názvu světa.',
      pj: 'Panel Přítomní ti hlídá, kdo je online.',
    },
  },
  {
    route: '/svet/:worldSlug/hraci',
    name: 'Hráči',
    blurb: 'Členové světa a pozvánky. Kdo co smí, řídí role — povyšuje PJ.',
    audienceNotes: {
      pj: 'Pozvi lidi odkazem, nebo vyvěs nábor na platformě.',
    },
  },
  {
    route: '/svet/:worldSlug/nastaveni',
    name: 'Nastavení světa',
    blurb: 'Taby podle tvé role — přístup, členové, vzhled a další.',
    audienceNotes: {
      ctenar: 'Jako Čtenář vidíš jen část tabů; zbytek patří vyšším rolím.',
      hrac: 'Jako Hráč vidíš jen část tabů; zbytek patří vyšším rolím.',
      pj: 'Režim vstupu do světa přepneš v tabu Přístup — svět vzniká Soukromý.',
    },
  },
  {
    route: '/svet/:worldSlug/stranky',
    name: 'Encyklopedie',
    blurb: 'Wiki stránky světa — psané jeho obyvateli, propojené [[wikilinky]].',
    audienceNotes: {
      hrac: 'Naostro tvoří Pomocný PJ a výš; ty navrhuješ přes „+ Navrhnout".',
    },
  },
  {
    route: '/svet/:worldSlug/nova-stranka',
    name: 'Nová stránka',
    blurb: 'Vyber typ (wiki, postava, NPC) a piš. Návrhy schvaluje PJ.',
  },
  {
    route: '/svet/:worldSlug/edit/:slug',
    name: 'Úprava stránky',
    blurb: 'Edituješ obsah světa. [[Wikilinky]] propojují stránky samy.',
  },
  {
    route: '/svet/:worldSlug/:slug',
    name: 'Stránka světa',
    blurb: 'Kus encyklopedie tohoto světa. Souvislosti hledej přes odkazy v textu.',
  },
  {
    route: '/svet/:worldSlug/postavy',
    name: 'Postavy',
    blurb: 'Galerie postav světa — hráčské i NPC.',
    audienceNotes: {
      hrac: 'Postavu ti zakládá PJ — napiš mu. Až bude, najdeš ji pod Moje postava.',
    },
  },
  {
    route: '/svet/:worldSlug/moje-postava',
    name: 'Moje postava',
    blurb:
      'Tvůj deník — statistiky, výbava, finance. Podoba se řídí systémem světa.',
  },
  {
    route: '/svet/:worldSlug/bestiar',
    name: 'Bestiář',
    blurb: 'Bestie tohoto světa. Prohlíží každý člen, chov spravuje PJ.',
  },
  {
    route: '/svet/:worldSlug/chat',
    name: 'Chat světa',
    blurb:
      'Kanály a konverzace — tady se hraje. Kostky hází 🎲 v composeru, povolené drží PJ.',
  },
  {
    route: '/svet/:worldSlug/novinky',
    name: 'Novinky světa',
    blurb: 'Kronika oznámení — co PJ vyhlásí, najdeš tady.',
  },
  {
    route: '/svet/:worldSlug/takticka-mapa',
    name: 'Taktická mapa',
    blurb:
      'Bojiště světa — scény, tokeny, mlha války. Velí PJ; vidíš, co ti scéna dovolí.',
  },
  // Revize 07/23 — netriviální routy (moment 2) MUSÍ mít hlavičku:
  {
    route: '/svet/:worldSlug/pavucina',
    name: 'Pavučina',
    blurb:
      'Vztahy světa jako graf — subjekty a vazby mezi nimi. Přidávej, propojuj, materializuj do stránek.',
  },
  {
    route: '/svet/:worldSlug/kalendar',
    name: 'Kalendář světa',
    blurb:
      'Přehled akcí a událostí postav pro vedení světa. In-game datum posouvá Generátor počasí.',
  },
  {
    route: '/svet/:worldSlug/mapy',
    name: 'Atlas map',
    blurb:
      'Obrázkové mapy světa s piny. Viditelnost jednotlivých map řídí PJ.',
  },
  {
    route: '/svet/:worldSlug/timeline',
    name: 'Timeline',
    blurb:
      'Historická osa světa — éry a události příběhu. Na herní akce se neváže.',
  },
  // Revize 07/23 — cíle akcí topiků/changelogu bez hlavičky:
  {
    route: '/ikaros/podporovatele',
    name: 'Podporovatelé',
    blurb:
      'Díky nim platforma běží. Podpora otevírá 30 světů místo 3, Stavitele a skiny navíc.',
  },
  {
    route: '/ikaros/akce',
    name: 'Akce',
    blurb:
      'Kalendář platformních i světových akcí — co se kde chystá a kam se přihlásit.',
  },
  {
    route: '/ikaros/oblibene',
    name: 'Oblíbené',
    blurb:
      'Tvoje záložky napříč platformou — světy i stránky, které sis připnul.',
  },
  {
    route: '/ikaros/sceny',
    name: 'Katalog scén',
    blurb:
      'Sdílené scény taktické mapy — naklonuj si cizí bojiště do svého světa i s terénem.',
  },
  {
    route: '/chat/voice',
    name: 'Voice krčma',
    blurb:
      'Hlasová místnost pro registrované — mluvené slovo místo psaní. Vstup je volný, mikrofon dobrovolný.',
  },
];
