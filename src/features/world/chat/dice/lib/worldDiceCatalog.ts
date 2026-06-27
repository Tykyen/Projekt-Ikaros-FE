/**
 * Krok 6.3a — Mapování klíčů `World.dice` (BE) na UI labels + glyphy.
 *
 * `World.dice: string[]` (z editace světa 5.3a) drží whitelist typů, které
 * PJ povolil. Picker zobrazuje jen typy, které jsou ve whitelistu.
 *
 * Glyphy renderujeme ve fontu `Iceland` (design-6.3 §7) — kruhové dlaždice
 * v pickeru i v signature pečeti v `MessageItem`.
 */

export interface DiceCatalogEntry {
  /** Label v pickeru („k20", „Fate", „k%"). */
  label: string;
  /** Glyf v kruhové dlaždici / signature pečeti. */
  glyph: string;
  /** Typ pro roll engine (`'fate'`, `'d20'`, ...). */
  rollType: string;
  /** Mažu zobrazit glyf trochu menší (k20 je dvouznakový)? */
  glyphSize?: 'sm' | 'md' | 'lg';
}

export const DICE_CATALOG: Record<string, DiceCatalogEntry> = {
  fate: { label: 'Fate', glyph: 'F', rollType: 'fate', glyphSize: 'lg' },
  d4: { label: 'k4', glyph: '4', rollType: 'd4', glyphSize: 'lg' },
  d6: { label: 'k6', glyph: '6', rollType: 'd6', glyphSize: 'lg' },
  // Nafukovací k6 (DrD 1.6) — padne-li 6, házíš znovu a přičteš hodnotu.
  'd6+': { label: 'k6+', glyph: '6+', rollType: 'd6+', glyphSize: 'md' },
  // Otevřený / eskalující 2k6 (DrD+) — dvojice 2×6 eskaluje +1, 2×1 −1.
  // Glyf v ASCII (`+`, ne small-plus U+FE62) — font Iceland small-plus nemá,
  // spadl by na fallback. „Malost" řeší glyphSize `sm` (14px).
  '2d6+': { label: '2k6+', glyph: '2k6+', rollType: '2d6+', glyphSize: 'sm' },
  d8: { label: 'k8', glyph: '8', rollType: 'd8', glyphSize: 'lg' },
  d10: { label: 'k10', glyph: '10', rollType: 'd10', glyphSize: 'md' },
  d12: { label: 'k12', glyph: '12', rollType: 'd12', glyphSize: 'md' },
  d20: { label: 'k20', glyph: '20', rollType: 'd20', glyphSize: 'md' },
  d100: { label: 'k%', glyph: '%', rollType: 'd100', glyphSize: 'lg' },
};

/** Default sada kostek, pokud `World.dice` je prázdné — Fate + d20 + d6. */
export const DEFAULT_DICE_KEYS = ['fate', 'd6', 'd20'] as const;

/**
 * Krok 6.3 — alias mapping z UI labelů (forma 2.3 CreateWorldPage/
 * BasicInfoTab `DICE` const) na katalogové klíče.
 *
 * Admin form ukládá lidsky čitelné labely jako `'Fate kostky'` nebo
 * `'d100 / procenta'`. Picker pracuje s kanonickými klíči (`'fate'`,
 * `'d100'`) z `DICE_CATALOG`. Aliasy je převedou bez nutnosti migrace
 * existujících světů.
 *
 * `'2d6', '3d6', 'Pool d6/d10', 'Mixed polyhedral'` jsou kompoziční typy
 * — nejsou samostatné chips v pickeru (uživatel klik na d6 a Pool…
 * tlačítko v popoveru). Mapují se na bázovou kostku, ale picker je tak
 * vyfiltruje až přes Pool/Mixed flow.
 *
 * `'d6+'` (nafukovací k6) a `'2d6+'` (otevřený 2k6, DrD+) JSOU naopak
 * samostatné chips — vlastní katalogová položka + vlastní roll primitiva
 * (`rollExplodingD6` / `rollExploding2d6`). Liší se tím od `'2d6'`/`'3d6'`,
 * které jsou jen statický součet a mapují se na bázovou `d6`.
 */
const KEY_ALIASES: Record<string, string> = {
  // Kanonické (no-op)
  fate: 'fate',
  d4: 'd4',
  d6: 'd6',
  'd6+': 'd6+',
  '2d6+': '2d6+',
  d8: 'd8',
  d10: 'd10',
  d12: 'd12',
  d20: 'd20',
  d100: 'd100',
  // Admin form labely (2.3 BasicInfoTab DICE constant)
  'Fate kostky': 'fate',
  'd100 / procenta': 'd100',
  // Tolerance pro alternativní zápisy eskalujících kostek
  'k6+': 'd6+',
  '2k6+': '2d6+',
  // Pool/mixed/multi-die kompozice → bázová kostka (pool/mixed flow
  // už picker zařídí přes Pool…/Mixed… linky v popoveru)
  '2d6': 'd6',
  '3d6': 'd6',
  'Pool d6': 'd6',
  'Pool d10': 'd10',
  'Mixed polyhedral': 'd20',
  // Tolerance pro alternativní zápisy (k20, K20, 1d20, 1k20)
  k4: 'd4',
  k6: 'd6',
  k8: 'd8',
  k10: 'd10',
  k12: 'd12',
  k20: 'd20',
  k100: 'd100',
  '1d4': 'd4',
  '1d6': 'd6',
  '1d8': 'd8',
  '1d10': 'd10',
  '1d12': 'd12',
  '1d20': 'd20',
  '1d100': 'd100',
};

/**
 * Vrátí kostky z `World.dice` převedené na katalogové klíče.
 *
 * Vstup může mít různé formáty (UI labely z admin formu, alternativní
 * zápisy). Neznámé klíče jsou tiše vyfiltrovány. Duplicity jsou
 * deduplikované (zachováno první pořadí).
 */
export function resolveDiceKeys(worldDice: string[] | undefined): string[] {
  if (!worldDice || worldDice.length === 0) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of worldDice) {
    const key = KEY_ALIASES[raw] ?? KEY_ALIASES[raw.toLowerCase()];
    if (key && DICE_CATALOG[key] && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result;
}

/**
 * Kanonická key z různých zápisů (`'k20'` / `'1d20'` / `'D20'`). Pomáhá
 * sjednotit data, která mohou být v `World.dice` z různých zdrojů.
 */
export function normalizeDiceKey(input: string): string | null {
  if (!input) return null;
  // Nejdřív alias mapping (zachycuje UI labely jako 'Fate kostky').
  const aliased = KEY_ALIASES[input] ?? KEY_ALIASES[input.toLowerCase()];
  if (aliased && DICE_CATALOG[aliased]) return aliased;
  // Generic regex fallback (1d20, k20, D20).
  const lower = input.trim().toLowerCase();
  const match = lower.match(/^1?[dk](\d+)$/);
  if (!match) return null;
  const sides = match[1];
  const key = `d${sides}`;
  return DICE_CATALOG[key] ? key : null;
}
