/**
 * S3 (07 §7) — „Co je nového": ručně kurátorovaný seznam změn PRO HRÁČE
 * (ne git log — jen věci, které uživatel pozná v UI). Údržba: skill
 * `napoveda` přidává záznam při každé změně funkčnosti. Nejnovější první.
 * Badge: počet záznamů novějších než `vypravec:zmenyVideny` (localStorage).
 */
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
    id: 'zm-2026-07-23-vypravec',
    datum: '2026-07-23',
    titul: 'Vypravěč: Ishida a Joe tě provedou',
    popis:
      'Nová postava-průvodce (klávesa Shift+V nebo tlačítko s klíčem). Cesty pro nové PJ, hráče i tvůrce světů, kontextová nápověda ke každé stránce a krátké návody.',
  },
  {
    id: 'zm-2026-07-21-sdileni-scen',
    datum: '2026-07-21',
    titul: 'Katalog sdílených scén',
    popis:
      'PJ může publikovat scénu taktické mapy do katalogu — ostatní si ji naklonují do svého světa i s terénem a zdmi.',
    to: '/ikaros/sceny',
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
    id: 'zm-2026-07-15-generatory',
    datum: '2026-07-15',
    titul: 'Generátory jmen a přízvisek',
    popis: 'Generátory pro NPC — jména, přízviska a rychlé nápady do hry.',
  },
];

const KLIC_VIDENO = 'vypravec:zmenyVideny';

/** Kolik změn uživatel ještě neviděl (badge na menu). */
export function pocetNovychZmen(): number {
  try {
    const videno = localStorage.getItem(KLIC_VIDENO);
    if (!videno) return ZMENY.length;
    const i = ZMENY.findIndex((z) => z.id === videno);
    return i < 0 ? ZMENY.length : i;
  } catch {
    return 0;
  }
}

/** Označ vše jako viděné (volat při otevření pohledu Změny). */
export function oznacZmenyVidene(): void {
  try {
    if (ZMENY.length) localStorage.setItem(KLIC_VIDENO, ZMENY[0].id);
  } catch {
    /* privátní režim — badge prostě zůstane */
  }
}
