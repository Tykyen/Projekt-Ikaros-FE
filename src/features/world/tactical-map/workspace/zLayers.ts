/**
 * 17.10 A1 — centrální z-index škála overlay vrstvy taktické mapy.
 *
 * Nahrazuje roztroušené literály jedním pojmenovaným zdrojem. Hodnoty jsou
 * **1:1 dnešní stav** (beze změny vizuálního pořadí) — migrace je čistě
 * „literál → token se stejnou hodnotou".
 *
 * - TS konstanta `Z_MAP` = pro JS-nastavovaný `zIndex` (např. fokusnutá
 *   plovoucí karta v A4).
 * - Zrcadlo v CSS jako `--z-map-*` proměnné na `.viewport`
 *   (viz `TacticalMapView.module.css`). CSS moduly čtou
 *   `var(--z-map-x, <fallback>)`, kde fallback = původní hodnota, takže i
 *   prvky mimo `.viewport` (portály/modaly) drží své pořadí.
 *
 * Pořadí (nízké → vysoké): atmosféra < iniciativa < rohové sloty <
 * overlay stavů < notebook < panely < nástroje/flyout < karta tokenu < modal.
 */
export const Z_MAP = {
  /** Atmosférická FX vrstva nad PixiJS canvasem, pod UI. */
  atmosphere: 2,
  /** Horní iniciativní/bojová lišta. */
  initiative: 20,
  /** Rohové sloty (connection badge, počasí). */
  corner: 30,
  /** Overlay „Hra zastavena" (lock). */
  overlayLocked: 40,
  /** Overlay „Mapa skrytá" (hidden). */
  overlayHidden: 50,
  /** Banner umísťování tokenu. */
  banner: 50,
  /** Notebook (deník / poznámky). */
  notebook: 60,
  /** Herní panely vlevo dole (Hody, Orchestrace). */
  panel: 90,
  /** Pravá lišta nástrojů (tool dock stack). */
  toolPanel: 100,
  /** Flyouty palet (PJ panel). */
  flyout: 100,
  /** Backdrop overlay módu karty tokenu (těsně pod kartou). */
  tokenBackdrop: 399,
  /** Karta tokenu (statblok panel). */
  tokenPanel: 400,
  /** Modály (katalog, dialogy) — portály na body. */
  modal: 1000,
} as const;

export type ZMapLayer = keyof typeof Z_MAP;
