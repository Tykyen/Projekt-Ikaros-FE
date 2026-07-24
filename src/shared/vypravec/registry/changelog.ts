/**
 * S3 (07 §7) — „Co je nového": ručně kurátorovaný seznam změn PRO HRÁČE
 * (ne git log — jen věci, které uživatel pozná v UI). Údržba: skill
 * `napoveda` přidává záznam při každé změně funkčnosti. Nejnovější první.
 * Badge: počet záznamů novějších než `lastSeenChangelog` (onboardingStore).
 */
import { onboardingStore } from '../state/onboardingStore';

export interface Zmena {
  /** Stabilní ID (zm-RRRR-MM-DD-slug) — kotva pro „viděno". */
  id: string;
  datum: string;
  titul: string;
  popis: string;
  /** Volitelný deep-link (doplnSlug se NEaplikuje — jen platformní routy). */
  to?: string;
}

export const ZMENY: readonly Zmena[] = [
  {
    id: 'zm-2026-07-24-denik-soubezna-editace',
    datum: '2026-07-24',
    titul: 'Souběžné úpravy deníku už nemizí',
    popis:
      'Když někdo sáhne na HP nebo listinu téže postavy ve stejnou chvíli jako ty — třeba PJ na mapě a hráč v deníku — tvoje změna se už tiše nepřepíše. Dám ti vědět a načtu aktuální stav, ať víš, na čem jsi, a můžeš úpravu zopakovat.',
  },
  {
    id: 'zm-2026-07-24-mapa-na-mobilu',
    datum: '2026-07-24',
    titul: 'Taktická mapa pod palcem',
    popis:
      'Na telefonu teď kartu tokenu i lištu iniciativy odscrolluješ prstem, aniž by ti pod tím ujížděla mapa. Tlačítka na mapě, v chatu i v deníku jsou na dotyku větší, ať se trefíš palcem.',
  },
  {
    id: 'zm-2026-07-24-scenar-session-kronika',
    datum: '2026-07-24',
    titul: 'Propoj scénář, session a kroniku',
    popis:
      'Když vedeš hru: u herní akce vybereš, který scénář se hraje, a u zápisu v kronice, ze které session vzešel. Vznikne dohledatelná linie od scénáře přes odehranou session až po záznam v historii světa.',
  },
  {
    id: 'zm-2026-07-24-prvni-dojem',
    datum: '2026-07-24',
    titul: 'Uhlazenější první dojem',
    popis:
      'Nápověda se teď otevře hned, bez čekání. Prázdné počty už neukazujeme jako „0" a pozvánku k instalaci na plochu ti nabídnu až ve chvíli, kdy ti dá smysl — ne hned na uvítanou.',
  },
  {
    id: 'zm-2026-07-24-beta-rezim',
    datum: '2026-07-24',
    titul: 'Beta režim: víš, na čem jsi',
    popis:
      'Nahoře pod hlavičkou se ukáže proužek — co může být v betě rozbité, kam nahlásit chybu a kde je „Co je nového". Data hlídáme denními zálohami. Zavřeš ho jedním klikem a zůstane zavřený.',
  },
  {
    id: 'zm-2026-07-24-nahlasit-chybu',
    datum: '2026-07-24',
    titul: 'Nahlásit chybu přímo v aplikaci',
    popis:
      'Když něco nefunguje, otevři mě a zvol „Nahlásit chybu". Pár vět stačí — kde jsi, verzi appky i prohlížeč přiložím sám. Funguje odkudkoli, i bez přihlášení.',
  },
  {
    id: 'zm-2026-07-23-vypravec',
    datum: '2026-07-23',
    titul: 'Vypravěč: Ishida, Joe a Měďák tě provedou',
    popis:
      'Noví průvodci — avatar vpravo dole (nebo Shift+V). Cesty pro PJ, hráče a tvůrce světů, výcvik taktické mapy s Měďákem, kontextová nápověda a krátké návody.',
  },
  {
    id: 'zm-2026-07-20-vykladni-skrin',
    datum: '2026-07-20',
    titul: 'Výkladní skříň světa',
    popis:
      'Svět může vystavit vybrané stránky čtenářům bez vstupu — samostatné okno pro nahlédnutí, ne nový režim přístupu.',
  },
  {
    id: 'zm-2026-07-19-stavitel',
    datum: '2026-07-19',
    titul: 'Stavitel: generátor podzemí, města a krajiny',
    popis:
      'Vygenerovanou mapu pošleš rovnou na taktickou mapu i se zdmi a viditelností (LoS).',
  },
  {
    id: 'zm-2026-07-18-nabory-filtr',
    datum: '2026-07-18',
    titul: 'Nábory: filtr podle systému a žánru',
    popis: 'Nástěnka náborů umí filtrovat inzeráty podle herního systému a žánru.',
    to: '/ikaros/nabory',
  },
  {
    id: 'zm-2026-07-15-sdileni-scen',
    datum: '2026-07-15',
    titul: 'Katalog sdílených scén',
    popis:
      'PJ může publikovat scénu taktické mapy do katalogu — ostatní si ji naklonují do svého světa i s terénem a zdmi.',
    to: '/ikaros/sceny',
  },
  {
    id: 'zm-2026-07-15-generatory',
    datum: '2026-07-15',
    titul: 'Generátory jmen a přízvisek',
    popis: 'Generátory pro NPC — jména, přízviska a rychlé nápady do hry.',
  },
];

/**
 * „Viděno" žije v onboardingStore (`lastSeenChangelog`, LWW) — BE pole
 * existuje od spec 26.3, takže badge drží krok i napříč zařízeními.
 */

/** Kolik změn uživatel ještě neviděl (badge na menu). */
export function pocetNovychZmen(): number {
  const videno = onboardingStore.getSnapshot().lastSeenChangelog;
  if (!videno) return ZMENY.length;
  // Nález 6: srovnávej DATEM (ne indexem) — smazání viděného záznamu jinak
  // rozsvítí badge na plný počet. ID má tvar zm-RRRR-MM-DD-slug.
  // Pořadí v poli řeší i více změn TÉHOŽ dne (index = počet novějších).
  const i = ZMENY.findIndex((z) => z.id === videno);
  if (i >= 0) return i;
  // Viděný záznam byl smazán → fallback na datum (nález 6).
  const videnoDatum = videno.slice(3, 13);
  return ZMENY.filter((z) => z.datum > videnoDatum).length;
}

/** Označ vše jako viděné (volat při otevření pohledu Změny). */
export function oznacZmenyVidene(): void {
  if (ZMENY.length)
    onboardingStore.aplikuj({ lastSeenChangelog: ZMENY[0].id });
}
