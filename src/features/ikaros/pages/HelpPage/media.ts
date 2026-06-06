// 13.5 — registr obrázků/screenshotů nápovědy. JEDINÉ místo se zdroji.
// Sekce odkazují klíčem přes <ScreenshotSlot media="..."> / <IllustrationSlot …>.
// Uživatel doplní `src` (cesta do /public/help/… nebo CDN) jen tady, na
// jednom místě. Bez `src`:
//   - ScreenshotSlot → záměrný prázdný stav (dashed rámeček + caption)
//   - IllustrationSlot → nevykreslí nic (layout nesmí spadnout)
//
// Klíč konvence: '<tab>.<nastroj>' (např. 'svet.takticka-mapa').
// Seznam chybějících snímků (klíče bez src) viz docs/arch/phase-13/napoveda-screenshoty.md.

export type HelpMediaEntry = {
  /** Cesta k obrázku. Když chybí → prázdný stav / nic. */
  src?: string;
  /** Alt text (povinný — i prázdný stav ho použije jako aria-label). */
  alt: string;
  /** Popisek pod snímkem / text prázdného stavu. */
  caption: string;
};

export const HELP_MEDIA = {
  // ── Začni tady ──────────────────────────────────────────────────────
  'start.hero': {
    src: undefined,
    alt: 'Úvod do platformy Ikaros',
    caption: 'Úvodní rozcestník — odkud se dostaneš kamkoliv',
  },
  'start.orientace': {
    src: undefined,
    alt: 'Orientace v rozhraní',
    caption: 'Hlavička s navigací, zvonkem a hledáním',
  },

  // ── Platforma ───────────────────────────────────────────────────────
  'platforma.hospoda': {
    src: undefined,
    alt: 'Hospoda — globální chat',
    caption: 'Globální chat: zprávy, přítomní a šepot',
  },
  'platforma.profil': {
    src: undefined,
    alt: 'Stránka Profil',
    caption: 'Profil — hlavička, postava v Rozcestí a bezpečnost',
  },

  // ── Svět ────────────────────────────────────────────────────────────
  'svet.prehled': {
    src: undefined,
    alt: 'Přehled světa',
    caption: 'Tři sloupce: Akce, Novinky a Oblíbené stránky',
  },
  'svet.takticka-mapa': {
    src: undefined,
    alt: 'Taktická mapa',
    caption: 'Hex grid s tokeny postav, panelem PJ a iniciativou',
  },
  'svet.chat': {
    src: undefined,
    alt: 'Chat světa',
    caption: 'Kanály, konverzace a profilové karty postav',
  },
  'svet.kalendar': {
    src: undefined,
    alt: 'Kalendář světa',
    caption: 'Měsíční kalendář s akcemi, fázemi měsíce a sezónami',
  },
  'svet.bestiar': {
    src: undefined,
    alt: 'Bestiář',
    caption: 'Knihovna statbloků se třemi rozsahy (Můj / Svět / Systém)',
  },
  'svet.pavucina': {
    src: undefined,
    alt: 'Pavučina vztahů',
    caption: 'Vztahový graf kampaně — subjekty, emoce a linky',
  },
} as const satisfies Record<string, HelpMediaEntry>;

export type HelpMediaKey = keyof typeof HELP_MEDIA;
