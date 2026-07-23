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
    id: 'zm-2026-07-23-vypravec',
    datum: '2026-07-23',
    titul: 'Vypravěč: Ishida, Joe a Měďák tě provedou',
    popis:
      'Nová postava-průvodce — avatar vpravo dole (nebo Shift+V). Cesty pro PJ, hráče a tvůrce světů, výcvik taktické mapy s Měďákem, kontextová nápověda a krátké návody.',
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

/**
 * „Viděno" žije v onboardingStore (`lastSeenChangelog`, LWW) — BE pole
 * existuje od spec 26.3, takže badge drží krok i napříč zařízeními.
 */

/** Kolik změn uživatel ještě neviděl (badge na menu). */
export function pocetNovychZmen(): number {
  const videno = onboardingStore.getSnapshot().lastSeenChangelog;
  if (!videno) return ZMENY.length;
  const i = ZMENY.findIndex((z) => z.id === videno);
  return i < 0 ? ZMENY.length : i;
}

/** Označ vše jako viděné (volat při otevření pohledu Změny). */
export function oznacZmenyVidene(): void {
  if (ZMENY.length)
    onboardingStore.aplikuj({ lastSeenChangelog: ZMENY[0].id });
}
