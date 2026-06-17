/**
 * Krok 6.3-fix4 — Registr materiálů 3D kostek (nahrazuje starý skin systém).
 *
 * Zdroj pravdy = `dice3dMaterials.generated.json` (generuje
 * `scripts/optimize-dice-skins.mjs` z PNG dodaných PJ). 69 materiálů v 6
 * skupinách; engine dokresluje číslo, materiál nese jen povrch.
 */
import rawManifest from './dice3dMaterials.generated.json';

export interface DiceMaterial {
  /** Stabilní id, např. `kamen-obsidian`. Ukládá se do membership mapping. */
  id: string;
  /** Český název skupiny (UI). */
  group: string;
  /** Slug skupiny, např. `kamen`. */
  groupSlug: string;
  /** Český název materiálu (UI). */
  name: string;
  /** Cesta textury relativně k `assetPath` (`/dice-box/`). */
  source: string;
}

export const DICE_MATERIALS: DiceMaterial[] = rawManifest as DiceMaterial[];

const BY_ID = new Map(DICE_MATERIALS.map((m) => [m.id, m]));

/** Pořadí skupin v pickeru (dle slug). */
export const GROUP_ORDER = [
  'bezne',
  'kamen',
  'kov',
  'draci',
  'element',
  'mysticke',
] as const;

/** Český label skupiny dle slug (z manifestu, fallback na slug). */
export const GROUP_LABELS: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const m of DICE_MATERIALS) out[m.groupSlug] = m.group;
  return out;
})();

/** Default materiál — tmavý obsidián ladí se synthwave identitou. */
export const DEFAULT_MATERIAL_ID = BY_ID.has('kamen-obsidian')
  ? 'kamen-obsidian'
  : (DICE_MATERIALS[0]?.id ?? '');

export function getMaterial(id: string | null | undefined): DiceMaterial | undefined {
  if (!id) return undefined;
  return BY_ID.get(id);
}

/** Staré/neznámé id (starý skin systém) → default materiál. */
export function resolveMaterialId(id: string | null | undefined): string {
  return id && BY_ID.has(id) ? id : DEFAULT_MATERIAL_ID;
}

/** Materiály seskupené dle skupiny (pořadí dle `GROUP_ORDER`). */
export function getMaterialsByGroup(): Record<string, DiceMaterial[]> {
  const out: Record<string, DiceMaterial[]> = {};
  for (const slug of GROUP_ORDER) out[slug] = [];
  for (const m of DICE_MATERIALS) {
    (out[m.groupSlug] ??= []).push(m);
  }
  return out;
}

/** Absolutní URL textury pro 2D náhled (picker, chat čip). */
export function materialPreviewUrl(id: string): string {
  const m = getMaterial(id);
  return m ? `/dice-box/${m.source}` : '';
}
