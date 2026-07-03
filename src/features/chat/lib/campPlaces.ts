/**
 * Lokace Camp — 3 styly × 20 lokací. Mapování id → název → soubor ilustrace
 * migrováno ze starého Matrixu (`pages/Ikaros/IkarosChat.tsx`), přípony `.png` → `.webp`.
 * Ilustrace: `public/images/camp/` (fantasy v rootu, scifi/mystic v podsložkách).
 */

export type RoomStyle = 'fantasy' | 'scifi' | 'mystic';

export interface Place {
  /** ID lokace '1'–'20' — klíč i do `CAMP_DESCRIPTIONS`. */
  id: string;
  name: string;
  /** Název souboru ilustrace (.webp). */
  image: string;
}

export const ROOM_STYLES: { value: RoomStyle; label: string }[] = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'scifi', label: 'Sci-fi' },
  { value: 'mystic', label: 'Mystika' },
];

export const CAMP_PLACES: Record<RoomStyle, Place[]> = {
  fantasy: [
    { id: '1', name: 'Pohádkový les', image: 'pohadkovy_les.webp' },
    { id: '2', name: 'Rozvaliny horské strážnice', image: 'rozvaliny_straznice.webp' },
    { id: '3', name: 'Zatopený chrám', image: 'zatopeny_chram.webp' },
    { id: '4', name: 'Hostinec U Poslední lucerny', image: 'hostinec_lucerna.webp' },
    { id: '5', name: 'Mlžné hřbitovní návrší', image: 'mlzne_navrsi.webp' },
    { id: '6', name: 'Starý stříbrný důl', image: 'stribrny_dul.webp' },
    { id: '7', name: 'Kamenný kruh v pustině', image: 'kamenny_kruh.webp' },
    { id: '8', name: 'Lesní lovecký zámeček', image: 'lovecky_zamecek.webp' },
    { id: '9', name: 'Vesnice mimo obchodní cesty', image: 'vesnice_mimo_cesty.webp' },
    { id: '10', name: 'Jeskyně pod vodopádem', image: 'jeskyne_pod_vodopadem.webp' },
    { id: '11', name: 'Řeka – pobřeží vhodné k rybaření', image: 'reka_pobrezi.webp' },
    { id: '12', name: 'Přístav', image: 'pristav.webp' },
    { id: '13', name: 'Poutnická kaple na rozcestí', image: 'poutnicka_kaple.webp' },
    { id: '14', name: 'Tichý klášter v lesích', image: 'tichy_klaster.webp' },
    { id: '15', name: 'Horský průsmyk', image: 'horsky_prusmyk.webp' },
    { id: '16', name: 'Vlčí hrádek', image: 'vlci_hradek.webp' },
    { id: '17', name: 'Tržiště', image: 'trziste.webp' },
    { id: '18', name: 'Starý maják', image: 'stary_majak.webp' },
    { id: '19', name: 'Dřevorubecká mýtina', image: 'drevorubecka_mytina.webp' },
    { id: '20', name: 'Zbořený most nad řekou', image: 'zboreny_most.webp' },
  ],
  scifi: [
    { id: '1', name: 'Orbitální stanice', image: 'scifi_orbitalni_stanice.webp' },
    { id: '2', name: 'Těžební komplex na asteroidu', image: 'scifi_tezebni_komplex.webp' },
    { id: '3', name: 'Kolonie pod skleněným dómem', image: 'scifi_kolonie_dom.webp' },
    { id: '4', name: 'Přístav mezihvězdných lodí', image: 'scifi_pristav_lodi.webp' },
    { id: '5', name: 'Výzkumná stanice v ledovém kráteru', image: 'scifi_ledovy_krater.webp' },
    { id: '6', name: 'Podzemní město', image: 'scifi_podzemni_mesto.webp' },
    { id: '7', name: 'Vrak lodi na měsíci', image: 'scifi_vrak_lodi.webp' },
    { id: '8', name: 'Biotechnologická zahrada', image: 'scifi_biotech_zahrada.webp' },
    { id: '9', name: 'Kybernetické tržiště', image: 'scifi_kyber_trziste.webp' },
    { id: '10', name: 'Starý komunikační satelit', image: 'scifi_stary_satelit.webp' },
    { id: '11', name: 'Luxusní věž korporace', image: 'scifi_korpovez.webp' },
    { id: '12', name: 'Slum megaměsta', image: 'scifi_slum.webp' },
    { id: '13', name: 'Pouštní rafinerie', image: 'scifi_pustni_rafinerie.webp' },
    { id: '14', name: 'Podmořská základna', image: 'scifi_podmorska_zakladna.webp' },
    { id: '15', name: 'Chrám umělé inteligence', image: 'scifi_chram_ai.webp' },
    { id: '16', name: 'Vězeňská stanice', image: 'scifi_vezenska_stanice.webp' },
    { id: '17', name: 'Vrakoviště robotů', image: 'scifi_vrakoviste_robotu.webp' },
    { id: '18', name: 'Maglevové nádraží', image: 'scifi_maglev_nadrazi.webp' },
    { id: '19', name: 'Energetická farma', image: 'scifi_energo_farma.webp' },
    { id: '20', name: 'Genová klinika', image: 'scifi_genova_klinika.webp' },
  ],
  mystic: [
    { id: '1', name: 'Temný hrad', image: 'mystic_temny_hrad.webp' },
    { id: '2', name: 'Uličky o půlnoci', image: 'mystic_ulicky_pulnoc.webp' },
    { id: '3', name: 'Stará hospoda', image: 'mystic_stara_hospoda.webp' },
    { id: '4', name: 'Muzeum', image: 'mystic_muzeum.webp' },
    { id: '5', name: 'Mlha na polích', image: 'mystic_mlha_pole.webp' },
    { id: '6', name: 'Panelákové sklepy', image: 'mystic_panelak_sklepy.webp' },
    { id: '7', name: 'Zastávka posledního autobusu', image: 'mystic_zastavka_autobusu.webp' },
    { id: '8', name: 'Městský hřbitov', image: 'mystic_mestsky_hrbitov.webp' },
    { id: '9', name: 'Kaple u silnice', image: 'mystic_kaple_silnice.webp' },
    { id: '10', name: 'Opuštěná nemocnice', image: 'mystic_opustena_nemocnice.webp' },
    { id: '11', name: 'Staré sídliště', image: 'mystic_stare_sidliste.webp' },
    { id: '12', name: 'Park po dešti', image: 'mystic_park_po_desti.webp' },
    { id: '13', name: 'Podchod pod nádražím', image: 'mystic_podchod_nadrazi.webp' },
    { id: '14', name: 'Studentská kolej', image: 'mystic_studentska_kolej.webp' },
    { id: '15', name: 'Antikvariát', image: 'mystic_antikvariat.webp' },
    { id: '16', name: 'Nádraží za svítání', image: 'mystic_nadrazi_svitani.webp' },
    { id: '17', name: 'Přehrada', image: 'mystic_prehrada.webp' },
    { id: '18', name: 'Zapomenuté kino', image: 'mystic_zapomenute_kino.webp' },
    { id: '19', name: 'Střecha obchodního centra', image: 'mystic_strecha_oc.webp' },
    { id: '20', name: 'Les za satelitním městečkem', image: 'mystic_les_satelit.webp' },
  ],
};

/** Absolutní cesta k ilustraci lokace. Fantasy v rootu, scifi/mystic v podsložkách. */
export function placeImageUrl(style: RoomStyle, image: string): string {
  return style === 'fantasy'
    ? `/images/camp/${image}`
    : `/images/camp/${style}/${image}`;
}

/** Lokace dle id; `undefined` pro neznámé id. */
export function findPlace(style: RoomStyle, placeId: string): Place | undefined {
  return CAMP_PLACES[style].find((p) => p.id === placeId);
}
