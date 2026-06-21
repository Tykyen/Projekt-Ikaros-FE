/**
 * Registr nadžánrových ilustrací prázdných & chybových stavů (spec 15.6).
 * Soubory: public/illustrations/states/<klíč>.webp (viz README tamtéž).
 * Klíč = název souboru bez přípony.
 */
export type StateIllustration =
  // empty
  | 'characters'
  | 'pages'
  | 'worlds'
  | 'gallery'
  | 'events'
  | 'messages'
  | 'generic-empty'
  // error
  | 'forbidden'
  | 'notfound'
  | 'crash'
  | 'load-error';

const BASE = '/illustrations/states';

/** Absolutní URL ilustrace (servírováno z public/). */
export function stateIllustrationSrc(key: StateIllustration): string {
  return `${BASE}/${key}.webp`;
}
