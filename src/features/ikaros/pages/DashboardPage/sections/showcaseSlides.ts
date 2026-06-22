// Spec 15.7 — data-driven seznam ukázkových snímků pro anonymní úvodní stránku.
// PŘIDÁNÍ OBRÁZKU = jeden řádek zde (nafoť `public/images/showcase/showcase_<slug>.webp`).
// Pořadí pole = pořadí rotace.
export interface ShowcaseSlide {
  /** Stabilní klíč (React key, dot aria). */
  slug: string;
  /** Cesta ze statického kořene `public/`. */
  src: string;
  /** Popisek přes spodní gradient. */
  caption: string;
}

export const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  { slug: 'uvod-sveta', src: '/images/showcase/showcase_uvod_sveta.webp', caption: 'Vybuduj vlastní svět' },
  { slug: 'vzhled-postav', src: '/images/showcase/showcase_vzhled_postav.webp', caption: 'Vytvoř si vlastní postavu' },
  { slug: 'takticka-mapa', src: '/images/showcase/showcase_takticka_mapa.webp', caption: 'Veď bitvy na taktické mapě' },
  { slug: 'denik-postavy', src: '/images/showcase/showcase_denik_postavy.webp', caption: 'Veď deník svých hrdinů' },
  { slug: 'chat', src: '/images/showcase/showcase_chat.webp', caption: 'Hraj příběh s komunitou' },
];
