import type { ThemeId } from '@/themes/types';

/**
 * 2.3 / 5.0 — herní žánry pro wizard tvorby světa. Přeneseno ze starého
 * Matrixu (32 žánrů). Každý žánr má `theme` — výchozí vizuální motiv světa
 * (krok 5.0: motiv se odvozuje ze žánru, PJ ho může přepsat).
 *
 * `world.genre` ukládá `label` (zpětně kompatibilní se staršími světy).
 * Při volbě `Vlastní` se zobrazí free-text input a motiv padá na `modre-nebe`.
 */
export interface GenreOption {
  label: string;
  description: string;
  /** 5.0 — výchozí motiv světa pro tento žánr. */
  theme: ThemeId;
}

export const GENRES: GenreOption[] = [
  { label: 'Fantasy', description: 'Svět založený na magii, mytologii, legendách nebo nadpřirozených silách.', theme: 'fantasy' },
  { label: 'Dark fantasy', description: 'Fantasy s temným, krutým nebo hororovým nádechem.', theme: 'temna-cerven' },
  { label: 'Heroic fantasy', description: 'Fantasy zaměřená na hrdinství, velké činy a epické střety.', theme: 'heroic' },
  { label: 'Sword and sorcery', description: 'Dobrodružná fantasy s důrazem na akci, osobní motivace a menší měřítko.', theme: 'hospoda' },
  { label: 'Urban fantasy', description: 'Moderní nebo městské prostředí s existencí magie a nadpřirozena.', theme: 'urban-fantasy' },
  { label: 'Sci-fi', description: 'Svět založený na technologii, budoucnosti, vesmíru nebo spekulativní vědě.', theme: 'sci-fi' },
  { label: 'Hard sci-fi', description: 'Sci-fi s větším důrazem na technickou a vědeckou uvěřitelnost.', theme: 'vesmirna-lod' },
  { label: 'Soft sci-fi', description: 'Sci-fi více zaměřená na atmosféru, společnost nebo dobrodružství.', theme: 'soft-sci-fi' },
  { label: 'Space opera', description: 'Rozsáhlé vesmírné konflikty, impéria, flotily, velké drama.', theme: 'vesmirna-bitva' },
  { label: 'Cyberpunk', description: 'Technologická dystopie, korporace, síť, sociální rozklad.', theme: 'kyberpunk' },
  { label: 'Biopunk', description: 'Genetické zásahy, mutace, biologická kontrola a experimenty.', theme: 'biopunk' },
  { label: 'Postapo', description: 'Svět po kolapsu civilizace.', theme: 'postapo' },
  { label: 'Post-postapo', description: 'Civilizace po kolapsu se znovu skládá do nových struktur.', theme: 'post-postapo' },
  { label: 'Dystopie', description: 'Společnost ovládaná represí, ideologií nebo totalitním systémem.', theme: 'dystopie' },
  { label: 'Utopie / falešná utopie', description: 'Zdánlivě dokonalý svět s hlubším problémem.', theme: 'bila' },
  { label: 'Military', description: 'Svět zaměřený na armádu, válku, velení a ozbrojené konflikty.', theme: 'military' },
  { label: 'Politické drama', description: 'Intriky, mocenský boj, diplomacie, státní konflikty.', theme: 'severske-runy' },
  { label: 'Horor', description: 'Strach, bezmoc, neznámo, psychický tlak.', theme: 'nemrtvi' },
  { label: 'Psychologický horor', description: 'Horor zaměřený na vnitřní rozklad, trauma a mysl.', theme: 'psycho' },
  { label: 'Lovecraftovský / kosmický horor', description: 'Neuchopitelné síly, šílenství, bezvýznamnost člověka.', theme: 'lovecraft' },
  { label: 'Detektivní / mystery', description: 'Pátrání, vyšetřování, odhalování tajemství.', theme: 'mesic' },
  { label: 'Thriller', description: 'Napětí, tlak času, pronásledování, hrozba.', theme: 'thriller' },
  { label: 'Survival', description: 'Přežití v nepřátelském prostředí.', theme: 'priroda' },
  { label: 'Historický', description: 'Svět opřený o historické období s minimální odchylkou.', theme: 'pergamen' },
  { label: 'Alternativní historie', description: 'Historie se změnila jiným vývojem.', theme: 'alt-historie' },
  { label: 'Steampunk', description: 'Průmyslová estetika, pára, ozubená kola, viktoriánská technika.', theme: 'steampunk' },
  { label: 'Dieselpunk', description: 'Tvrdší industriální styl, válka, meziválečná retro-moderní estetika.', theme: 'dieselpunk' },
  { label: 'Mythic / mytologický', description: 'Svět silně opřený o konkrétní mytologii.', theme: 'indiane' },
  { label: 'Weird fiction', description: 'Zvláštní, zneklidňující a těžko zařaditelný svět.', theme: 'weird' },
  { label: 'Superhrdinský', description: 'Postavy s výjimečnými schopnostmi, maskami nebo ikonickou rolí.', theme: 'ctyri-zivly' },
  { label: 'Grimdark', description: 'Extrémně temný, cynický a brutální svět bez snadných řešení.', theme: 'grimdark' },
  { label: 'Pulp', description: 'Rychlé dobrodružství, výrazná stylizace, akce a nadsázka.', theme: 'slunce' },
];

export const GENRE_CUSTOM_LABEL = 'Vlastní';

/** 5.0 — výchozí motiv, když žánr není znám (Vlastní / starší svět). */
export const GENRE_FALLBACK_THEME: ThemeId = 'modre-nebe';

/** 5.0 — odvodí výchozí motiv světa ze žánru (`world.genre` / label). */
export function themeForGenre(genre: string | undefined): ThemeId {
  const found = GENRES.find((g) => g.label === genre);
  return found?.theme ?? GENRE_FALLBACK_THEME;
}
