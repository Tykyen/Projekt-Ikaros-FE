/**
 * 10.2h — čisté utility mlhy: štětec → hexy, „efektivně odhalené" hexy.
 *
 * Zdroj pravdy je `scene.revealedHexes`; PC tokeny implicitně „prosvítí" mlhu
 * kolem sebe (Matrix `alwaysVisibleHexes`) → vždy viditelné PJ i hráči.
 *
 * Spec: docs/arch/phase-10/spec-10.2h.md.
 */
import { getHexesInRadius } from '../../hexUtils';
import type { HexCoord, MapToken } from '../../types';
import type { FogBrushSize } from '../../hooks/useFogTool';

/** Klíč hexu pro Set/dedup. */
export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

/**
 * Vytáhne alpha složku z `rgba(r,g,b,a)` stringu (theme fog fill). `parseHexColor`
 * z `useMapTheme` alpha zahazuje — fog ji potřebuje pro průhlednost overlaye.
 * Fallback 1 (plná) pro rgb()/hex/nevalidní vstup.
 */
export function parseAlpha(value: string): number {
  const m = /rgba?\([^)]*?,[^)]*?,[^)]*?,\s*([\d.]+)\s*\)/.exec(value ?? '');
  if (!m) return 1;
  const a = parseFloat(m[1]);
  return Number.isFinite(a) ? Math.min(1, Math.max(0, a)) : 1;
}

/** Hexy zasažené štětcem dané velikosti se středem v (q,r). */
export function fogBrushHexes(
  q: number,
  r: number,
  size: FogBrushSize,
): HexCoord[] {
  return size === 0 ? [{ q, r }] : getHexesInRadius(q, r, size);
}

/**
 * Set efektivně odhalených hexů = `revealedHexes` ∪ hexy všech PC tokenů
 * (`!isNpc`). Použito pro masku mlhy i pro NPC visibility gate.
 */
export function effectivelyRevealed(
  revealedHexes: HexCoord[],
  tokens: MapToken[],
): Set<string> {
  const set = new Set<string>();
  for (const h of revealedHexes) set.add(hexKey(h.q, h.r));
  for (const t of tokens) {
    if (!t.isNpc) set.add(hexKey(t.q, t.r));
  }
  return set;
}

/**
 * NPC/bestie token je pro **hráče** skrytý, pokud je mlha aktivní a token stojí
 * v zamlženém (= ne efektivně-odhaleném) hexu. PJ vidí vše; PC tokeny vidí vždy.
 */
export function isTokenHiddenByFog(
  token: MapToken,
  opts: { fogEnabled: boolean; isPJ: boolean; revealedSet: Set<string> },
): boolean {
  if (!opts.fogEnabled || opts.isPJ) return false;
  if (!token.isNpc) return false; // PC vždy viditelný
  return !opts.revealedSet.has(hexKey(token.q, token.r));
}
