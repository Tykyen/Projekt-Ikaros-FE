/**
 * Spec 26.1 — placeholder siluety Vypravěče (inline SVG, currentColor).
 * Po dodání grafiky (02a) je nahradí vektorizované siluety finálních assetů:
 * výměna = výměna path, žádná změna kódu. Barvu VŽDY dodává okolí přes
 * currentColor (tokeny motivu) — žádné pevné barvy.
 */

/** Ishida (mimo svět) — gentleman s cylindrem. */
export function SiluetaCylindr({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M28 34 L30 16 Q30 12 34 12 L62 10 Q66 10 66 14 L66 32 L78 34 Q82 35 81 38 Q80 41 76 41 L22 43 Q18 43 18 40 Q18 37 22 36 Z M36 48 Q47 44 56 48 Q64 52 63 62 Q62 70 54 73 L60 78 Q70 82 76 90 Q78 94 74 96 L26 98 Q22 98 23 93 Q27 84 38 79 L42 74 Q34 70 34 60 Q34 52 36 48 Z" />
    </svg>
  );
}

/** Joe (ve světě) — postava s lucernou. */
export function SiluetaLucerna({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {/* hlava + vlasy, tělo v plášti, paže s lucernou u boku */}
      <path d="M46 10 Q56 8 60 16 Q63 22 60 28 Q66 30 64 36 L62 40 Q58 36 52 36 Q46 36 43 40 Q38 34 41 26 Q42 12 46 10 Z M42 42 Q52 38 60 44 Q66 50 66 62 L68 92 Q68 96 64 96 L38 96 Q34 96 34 92 L36 60 Q36 48 42 42 Z" />
      {/* lucerna na držadle */}
      <path d="M22 58 Q22 54 26 54 Q30 54 30 58 L29 60 Q34 62 34 68 L34 76 Q34 82 26 82 Q18 82 18 76 L18 68 Q18 62 23 60 Z M24 84 L28 84 L27 90 L25 90 Z" />
    </svg>
  );
}
