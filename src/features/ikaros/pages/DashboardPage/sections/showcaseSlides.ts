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
  { slug: 'takticka-mapa', src: '/images/showcase/showcase_takticka_mapa.webp', caption: 'Bojuj na taktické mapě' },
  { slug: 'chat', src: '/images/showcase/showcase_chat.webp', caption: 'Hraj příběh s komunitou' },
  { slug: 'uvod-sveta', src: '/images/showcase/showcase_uvod_sveta.webp', caption: 'Vytvoř svět' },
  { slug: 'vzhled-postav', src: '/images/showcase/showcase_vzhled_postav.webp', caption: 'Vytvoř postavu' },
  { slug: 'denik-postavy', src: '/images/showcase/showcase_denik_postavy.webp', caption: 'Veď deník vlastních hrdinů' },
];
