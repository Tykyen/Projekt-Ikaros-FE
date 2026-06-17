/**
 * Krok 6.3-fix4 — Téma 3D kostky odvozené z materiálu (dice-box-threejs).
 *
 * Materiál nese povrch (textura), engine kreslí číslo. Číslo = světlé s
 * tmavým obrysem → čitelné na světlém i tmavém materiálu. Tělo (background)
 * bílé, aby `multiply` textura ukázala pravé barvy materiálu.
 */
import {
  getMaterial,
  resolveMaterialId,
  type DiceMaterial,
} from './dice3dMaterials';

export interface Dice3dColorset {
  name: string; // = id materiálu → engine cachuje colorset per materiál
  foreground: string; // barva čísla
  background: string; // tělo kostky (multiply base → bílá = pravé barvy textury)
  outline: string; // obrys čísla
  texture: string; // jméno textury = id materiálu (resolved patchem getTexture)
}

export interface Dice3dTheme {
  colorset: Dice3dColorset;
  /** dice-box material: 'none' | 'metal' | 'wood' | 'glass' | 'plastic'. */
  material: string;
}

/** Deskriptor vlastní textury pro dice-box (injektuje se přes getTexture patch). */
export interface Dice3dTextureDescriptor {
  name: string;
  composite: string;
  source: string;
  source_bump: string;
  material?: string;
}

/**
 * dice-box materiál per skupina. Zatím bezpečně `plastic` (nasvícené, bez
 * reflexních cube map, které balík neveze) — kov/sklo doladíme po vizuálu.
 */
const GROUP_MATERIAL: Record<string, string> = {
  bezne: 'plastic',
  kamen: 'plastic',
  kov: 'plastic',
  draci: 'plastic',
  element: 'plastic',
  mysticke: 'plastic',
};

export function getDice3dTheme(materialId: string | null | undefined): Dice3dTheme {
  const id = resolveMaterialId(materialId);
  const m = getMaterial(id) as DiceMaterial;
  // Barva čísla dle světlosti materiálu: tmavé číslo + světlý obrys na světlém
  // povrchu, světlé číslo + tmavý obrys na tmavém. Obrys = opačný → čitelnost.
  const light = m.light === true;
  return {
    colorset: {
      name: id,
      foreground: light ? '#16181f' : '#f4f8ff',
      background: '#ffffff',
      outline: light ? '#ffffff' : '#0a0c14',
      texture: id,
    },
    material: GROUP_MATERIAL[m.groupSlug] ?? 'plastic',
  };
}

/**
 * Deskriptor textury pro daný materiál. `source` je relativní k `assetPath`
 * (`/dice-box/`), bump = stejný obrázek (reliéf zdarma, jako vestavěné textury).
 */
export function materialTextureDescriptor(
  name: string,
): Dice3dTextureDescriptor | null {
  const m = getMaterial(name);
  if (!m) return null;
  return {
    name,
    composite: 'multiply',
    source: m.source,
    // Bump vypnutý — barevný obrázek jako bump kalí povrch. Pravé šedotónové
    // bump mapy lze dodat zvlášť (zatím čistá barva = živější materiál).
    source_bump: '',
  };
}

/**
 * Detekce WebGL — bez něj overlay použije 2D fallback místo 3D enginu.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}
