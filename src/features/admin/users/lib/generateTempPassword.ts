/**
 * D-NEW-INV-ADMIN-UI — generátor dočasného hesla pro admin akce
 * (reset hesla / založení uživatele). BE heslo negeneruje (admin ho dodává
 * v body), takže ho vyrábí FE a admin si ho zkopíruje.
 *
 * - `crypto.getRandomValues` + rejection sampling (bez modulo biasu,
 *   vzor `rollEngine.secureRandomInt`).
 * - Charset bez záměnných znaků (0/O, 1/l/I) — heslo se předává ručně.
 * - Default 14 znaků splňuje BE `MinLength(8)`/`MaxLength(128)`.
 */
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function generateTempPassword(length = 14): string {
  const out: string[] = [];
  // Největší násobek CHARSET.length ≤ 2^32 — hodnoty nad ním zahazujeme.
  const limit = Math.floor(0x1_0000_0000 / CHARSET.length) * CHARSET.length;
  while (out.length < length) {
    const buf = new Uint32Array(length - out.length);
    crypto.getRandomValues(buf);
    for (const n of buf) {
      if (n < limit && out.length < length) {
        out.push(CHARSET[n % CHARSET.length]);
      }
    }
  }
  return out.join('');
}
