/**
 * 17.2 — parser UVTT / `.dd2vtt` / `.df2vtt` → scéna Ikara.
 *
 * UVTT je JSON, kde geometrie (zdi, portály, světla) je v **jednotkách
 * mřížky** (počet buněk, float), NE v pixelech. Kalibrace: 1 map-space px =
 * 1 px originálního obrázku (`backgroundScale = 1`), takže `size =
 * pixels_per_grid` a přepočet bodu `px = gridUnit × pixels_per_grid`.
 *
 * Parser je čistá funkce (bez uploadu/DOM) → testovatelná. Tolerantní k
 * verzím 0.2–1.0: chybějící volitelná pole ignoruje, bere `line_of_sight`
 * i `objects_line_of_sight`. Selže jen když chybí obrázek nebo
 * `pixels_per_grid`.
 *
 * Spec: docs/arch/phase-17/spec-17.2.md
 */
import type { HexConfig, MapLight, MapWall } from '../types';

interface UvttPoint {
  x: number;
  y: number;
}

interface UvttPortal {
  position?: UvttPoint;
  bounds?: UvttPoint[];
  rotation?: number;
  /** UVTT: `true` = portál blokuje výhled (dveře zavřené). */
  closed?: boolean;
  freestanding?: boolean;
}

interface UvttLight {
  position?: UvttPoint;
  /** Dosah v jednotkách mřížky. */
  range?: number;
  intensity?: number;
  /** Hex `rrggbb` / `rrggbbaa` / `aarrggbb`; tolerantní. */
  color?: string;
  shadows?: boolean;
}

/** Surový tvar UVTT souboru (vše optional — parser validuje minimum sám). */
export interface UvttRaw {
  format?: number;
  resolution?: {
    map_origin?: UvttPoint;
    map_size?: UvttPoint;
    pixels_per_grid?: number;
  };
  line_of_sight?: UvttPoint[][];
  objects_line_of_sight?: UvttPoint[][];
  portals?: UvttPortal[];
  lights?: UvttLight[];
  environment?: {
    baked_lighting?: boolean;
    ambient_light?: string;
  };
  /** PNG jako base64 (bez `data:` prefixu). */
  image?: string;
}

/** Výstup parseru — vše potřebné k vytvoření scény (kromě uploadu obrázku). */
export interface ParsedUvtt {
  /** Kalibrovaný config scény (mřížka + pozadí). */
  config: HexConfig & {
    backgroundScale: number;
    backgroundX: number;
    backgroundY: number;
  };
  walls: MapWall[];
  lights: MapLight[];
  /** Base64 PNG (bez `data:` prefixu) → nahraje se před vytvořením scény. */
  imageBase64: string;
  /** Rozměr mapy v buňkách (kontrola / info do UI). */
  mapSizeCells: { x: number; y: number };
  pixelsPerGrid: number;
}

export class UvttParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UvttParseError';
  }
}

/** Odřízne `data:image/...;base64,` prefix, pokud ho export přidal. */
function stripDataUrlPrefix(image: string): string {
  const comma = image.indexOf('base64,');
  return comma >= 0 ? image.slice(comma + 'base64,'.length) : image;
}

/**
 * Normalizuje UVTT barvu na `#rrggbb`. Bere `rrggbb`, `rrggbbaa` (Dungeondraft)
 * i `#`-prefixované. 8 znaků = RGBA → vezme prvních 6 (RGB). Fallback bílá.
 */
function normalizeColor(raw: string | undefined): string {
  if (!raw) return '#ffffff';
  const hex = raw.replace(/^#/, '');
  if (hex.length === 6) return `#${hex.toLowerCase()}`;
  if (hex.length === 8) return `#${hex.slice(0, 6).toLowerCase()}`;
  if (hex.length === 3) {
    const [r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return '#ffffff';
}

/** Grid-space bod → map-space px (scale = 1). */
function toPx(p: UvttPoint, ppg: number): [number, number] {
  return [p.x * ppg, p.y * ppg];
}

/** Polygon bodů → flat pole `[x0,y0,x1,y1,...]` v px. */
function polyToPoints(poly: UvttPoint[], ppg: number): number[] {
  const out: number[] = [];
  for (const p of poly) {
    const [x, y] = toPx(p, ppg);
    out.push(x, y);
  }
  return out;
}

/**
 * Rozparsuje UVTT JSON string → data scény. Vyhodí `UvttParseError` s
 * přátelskou zprávou při nevalidním vstupu.
 */
export function parseUvtt(jsonText: string): ParsedUvtt {
  let raw: UvttRaw;
  try {
    raw = JSON.parse(jsonText) as UvttRaw;
  } catch {
    throw new UvttParseError('Soubor není platný JSON (očekává se UVTT/.dd2vtt).');
  }

  const ppg = raw.resolution?.pixels_per_grid;
  if (!ppg || ppg <= 0) {
    throw new UvttParseError(
      'V souboru chybí rozměr mřížky (resolution.pixels_per_grid) — není to platná UVTT mapa.',
    );
  }
  if (!raw.image || raw.image.trim().length === 0) {
    throw new UvttParseError('V souboru chybí obrázek mapy (image).');
  }

  const origin = raw.resolution?.map_origin ?? { x: 0, y: 0 };
  const mapSize = raw.resolution?.map_size ?? { x: 0, y: 0 };

  // ── Zdi z line_of_sight + objects_line_of_sight ──────────────────────────
  const walls: MapWall[] = [];
  const losGroups = [
    ...(raw.line_of_sight ?? []),
    ...(raw.objects_line_of_sight ?? []),
  ];
  losGroups.forEach((poly, i) => {
    if (!Array.isArray(poly) || poly.length < 2) return;
    walls.push({
      id: `w${i}`,
      points: polyToPoints(poly, ppg),
      type: 'wall',
      blocksSight: true,
    });
  });

  // ── Dveře z portals ──────────────────────────────────────────────────────
  (raw.portals ?? []).forEach((portal, i) => {
    const bounds = portal.bounds;
    if (!Array.isArray(bounds) || bounds.length < 2) return;
    // Portál blokuje výhled když `closed === true`. UI ho pak umí „otevřít".
    const closed = portal.closed !== false; // default zavřené
    walls.push({
      id: `d${i}`,
      points: polyToPoints(bounds, ppg),
      type: 'door',
      door: { open: !closed },
      blocksSight: closed,
    });
  });

  // ── Světla ───────────────────────────────────────────────────────────────
  const lights: MapLight[] = [];
  (raw.lights ?? []).forEach((light, i) => {
    if (!light.position) return;
    const [x, y] = toPx(light.position, ppg);
    lights.push({
      id: `l${i}`,
      x,
      y,
      range: (light.range ?? 0) * ppg,
      intensity: typeof light.intensity === 'number' ? light.intensity : 1,
      color: normalizeColor(light.color),
      shadows: light.shadows,
    });
  });

  const config: ParsedUvtt['config'] = {
    gridType: 'square',
    size: ppg,
    originX: origin.x * ppg,
    originY: origin.y * ppg,
    showGrid: true,
    unitsPerCell: 1,
    unitLabel: 'm',
    showScale: true,
    backgroundScale: 1,
    backgroundX: 0,
    backgroundY: 0,
  };

  return {
    config,
    walls,
    lights,
    imageBase64: stripDataUrlPrefix(raw.image),
    mapSizeCells: { x: mapSize.x, y: mapSize.y },
    pixelsPerGrid: ppg,
  };
}

/**
 * Base64 PNG → `File` (pro `useUploadImage`, který bere `File`/`Blob`).
 * Prohlížečové API (atob) — mimo čistý parser, volá se až v import akci.
 */
export function base64PngToFile(base64: string, fileName: string): File {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: 'image/png' });
}
