/**
 * 21.3a — vektorové glyfy pro donjon renderer (dveře, terén, dekorace).
 *
 * Konvence: každá kreslicí funkce dostane ctx s počátkem v LEVÉM HORNÍM rohu
 * buňky a velikost buňky `s`. Rotaci/orientaci řeší volající translací+rotací
 * kolem středu buňky. Paleta je záměrně fixní („papír", exportuje se do PNG).
 */
import type { DoorCellType, DungeonDecorationType } from '../types';

export const PAPER_COLORS = {
  paper: '#ffffff',
  grid: '#cdd3da',
  rock: '#0e0e10',
  ink: '#17171a',
  inkSoft: '#4a4a52',
  water: '#b9d7e8',
  waterLine: '#7fa9c4',
  lava: '#e8825f',
  lavaLine: '#b4502f',
  parchment: '#c9a670',
  parchmentEdge: '#a8854f',
  parchmentInk: '#33260f',
  // Režim MĚSTO (bílý terén, tmavé budovy).
  street: '#e6e0d2',
  building: '#26262c',
  buildingLine: '#f2f2f4',
  foliage: '#7ba274',
  foliageDark: '#4c7048',
  // Režim DIVOČINA (kartografický „papírový" terén).
  fieldLine: '#b9a468',
  swampLine: '#6f8f7a',
  mountainFill: '#d8d8dc',
} as const;

/** Obrys buňky pod kurzorem v editoru (kreslí se do „papíru", ne do chrome). */
export const EDITOR_HOVER_OUTLINE = 'rgba(64, 128, 255, 0.9)';

/** Osa průchodu: 'h' = chodba běží vodorovně (dveře stojí svisle). */
export type PassageAxis = 'h' | 'v';

/**
 * Dveřní glyf. Kreslí se v normalizovaném rámu „chodba vede vodorovně";
 * pro svislou chodbu volající otočí ctx o 90°.
 */
export function drawDoorGlyph(
  ctx: CanvasRenderingContext2D,
  type: DoorCellType,
  s: number,
): void {
  const lw = Math.max(1, s * 0.07);
  ctx.strokeStyle = PAPER_COLORS.ink;
  ctx.fillStyle = PAPER_COLORS.paper;
  ctx.lineWidth = lw;

  const doorW = s * 0.34; // podél chodby
  const doorH = s * 0.82; // napříč chodbou
  const x0 = (s - doorW) / 2;
  const y0 = (s - doorH) / 2;

  // Zárubně (stubs zdi) na obou krajích průchodu.
  const jamb = s * 0.14;
  ctx.fillStyle = PAPER_COLORS.rock;
  ctx.fillRect(0, 0, s, jamb);
  ctx.fillRect(0, s - jamb, s, jamb);
  ctx.fillStyle = PAPER_COLORS.paper;

  switch (type) {
    case 'archway':
      // Volný průchod — jen tečkovaná linie mezi zárubněmi.
      ctx.save();
      ctx.setLineDash([lw, lw * 1.6]);
      ctx.beginPath();
      ctx.moveTo(s / 2, jamb);
      ctx.lineTo(s / 2, s - jamb);
      ctx.stroke();
      ctx.restore();
      break;
    case 'door':
      ctx.fillRect(x0, y0, doorW, doorH);
      ctx.strokeRect(x0, y0, doorW, doorH);
      break;
    case 'door-locked': {
      ctx.fillRect(x0, y0, doorW, doorH);
      ctx.strokeRect(x0, y0, doorW, doorH);
      // Zámek: plný kosočtverec uprostřed.
      const r = s * 0.1;
      ctx.beginPath();
      ctx.moveTo(s / 2, s / 2 - r);
      ctx.lineTo(s / 2 + r, s / 2);
      ctx.lineTo(s / 2, s / 2 + r);
      ctx.lineTo(s / 2 - r, s / 2);
      ctx.closePath();
      ctx.fillStyle = PAPER_COLORS.ink;
      ctx.fill();
      break;
    }
    case 'door-trapped': {
      ctx.fillRect(x0, y0, doorW, doorH);
      ctx.strokeRect(x0, y0, doorW, doorH);
      // Past: výstražný trojúhelník.
      const r = s * 0.13;
      ctx.beginPath();
      ctx.moveTo(s / 2, s / 2 - r);
      ctx.lineTo(s / 2 + r * 0.9, s / 2 + r * 0.7);
      ctx.lineTo(s / 2 - r * 0.9, s / 2 + r * 0.7);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'door-secret': {
      // Tajné dveře: čárkovaný obrys + „S".
      ctx.save();
      ctx.setLineDash([lw * 1.4, lw * 1.2]);
      ctx.strokeRect(x0, y0, doorW, doorH);
      ctx.restore();
      ctx.fillStyle = PAPER_COLORS.ink;
      ctx.font = `${s * 0.42}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', s / 2, s / 2 + s * 0.02);
      break;
    }
    case 'portcullis': {
      // Padací mříž: řada teček napříč průchodem.
      ctx.fillStyle = PAPER_COLORS.ink;
      const dots = 4;
      for (let i = 0; i < dots; i++) {
        const y = jamb + ((s - 2 * jamb) * (i + 0.5)) / dots;
        ctx.beginPath();
        ctx.arc(s / 2, y, Math.max(1, s * 0.055), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }
}

/** Schody: rungy napříč chodbou; down = zužující se, up = rozšiřující se. */
export function drawStairsGlyph(
  ctx: CanvasRenderingContext2D,
  direction: 'up' | 'down',
  s: number,
): void {
  ctx.strokeStyle = PAPER_COLORS.ink;
  ctx.lineWidth = Math.max(1, s * 0.06);
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps;
    const x = s * t;
    const half =
      direction === 'down'
        ? (s * 0.42 * (steps - i)) / steps
        : (s * 0.42 * (i + 1)) / steps;
    ctx.beginPath();
    ctx.moveTo(x, s / 2 - half);
    ctx.lineTo(x, s / 2 + half);
    ctx.stroke();
  }
}

/** Terén uvnitř buňky (voda / láva / jáma). Volá se po vykreslení podlahy. */
export function drawTerrainGlyph(
  ctx: CanvasRenderingContext2D,
  type: 'water' | 'lava' | 'pit',
  s: number,
): void {
  if (type === 'pit') {
    const inset = s * 0.16;
    ctx.strokeStyle = PAPER_COLORS.ink;
    ctx.lineWidth = Math.max(1, s * 0.07);
    ctx.strokeRect(inset, inset, s - 2 * inset, s - 2 * inset);
    ctx.beginPath();
    ctx.moveTo(inset, inset);
    ctx.lineTo(s - inset, s - inset);
    ctx.moveTo(s - inset, inset);
    ctx.lineTo(inset, s - inset);
    ctx.stroke();
    return;
  }
  const fill = type === 'water' ? PAPER_COLORS.water : PAPER_COLORS.lava;
  const line = type === 'water' ? PAPER_COLORS.waterLine : PAPER_COLORS.lavaLine;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(1, s * 0.05);
  for (const ty of [0.35, 0.7]) {
    ctx.beginPath();
    ctx.moveTo(s * 0.15, s * ty);
    ctx.quadraticCurveTo(s * 0.375, s * (ty - 0.12), s * 0.5, s * ty);
    ctx.quadraticCurveTo(s * 0.625, s * (ty + 0.12), s * 0.85, s * ty);
    ctx.stroke();
  }
}

/**
 * Buňka městského terénu (režim MĚSTO). Kreslí CELOU buňku (0,0,s,s).
 * Orientaci řeší volající rotací kolem středu — kreslí se v normalizovaném
 * rámu „průchod/tok vede vodorovně".
 */
export function drawCityCellGlyph(
  ctx: CanvasRenderingContext2D,
  type: 'street' | 'building' | 'city-wall' | 'gate' | 'bridge',
  s: number,
): void {
  const lw = Math.max(1, s * 0.06);

  switch (type) {
    case 'street':
      // Písková ulice — mřížku přes ni kreslí renderer.
      ctx.fillStyle = PAPER_COLORS.street;
      ctx.fillRect(0, 0, s, s);
      break;
    case 'building':
      // Blok budovy + vnitřní světlá kontura.
      ctx.fillStyle = PAPER_COLORS.building;
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = PAPER_COLORS.buildingLine;
      ctx.lineWidth = lw * 0.5;
      ctx.strokeRect(lw * 0.8, lw * 0.8, s - 1.6 * lw, s - 1.6 * lw);
      break;
    case 'city-wall':
      // Hradba + „ochoz": přerušovaná linka středem.
      ctx.fillStyle = PAPER_COLORS.building;
      ctx.fillRect(0, 0, s, s);
      ctx.save();
      ctx.strokeStyle = PAPER_COLORS.buildingLine;
      ctx.lineWidth = lw * 0.7;
      ctx.setLineDash([lw * 1.4, lw * 1.2]);
      ctx.beginPath();
      ctx.moveTo(0, s / 2);
      ctx.lineTo(s, s / 2);
      ctx.stroke();
      ctx.restore();
      break;
    case 'gate': {
      // Hradební špalky nahoře a dole; mezera = terén (nekreslí se).
      ctx.fillStyle = PAPER_COLORS.building;
      ctx.fillRect(0, 0, s, s * 0.22);
      ctx.fillRect(0, s * 0.78, s, s * 0.22);
      // Dvě křídla vrat vedle sebe kolem středu, svisle centrovaná.
      const dw = s * 0.16;
      const dh = s * 0.5;
      const y0 = (s - dh) / 2;
      ctx.fillStyle = PAPER_COLORS.paper;
      ctx.strokeStyle = PAPER_COLORS.ink;
      ctx.lineWidth = lw;
      for (const x0 of [s / 2 - dw, s / 2]) {
        ctx.fillRect(x0, y0, dw, dh);
        ctx.strokeRect(x0, y0, dw, dh);
      }
      break;
    }
    case 'bridge': {
      // Voda pod mostem.
      ctx.fillStyle = PAPER_COLORS.water;
      ctx.fillRect(0, 0, s, s);
      // Prkna: 4 svislé čáry mezi zábradlími.
      ctx.strokeStyle = PAPER_COLORS.ink;
      ctx.lineWidth = lw * 0.6;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const x = (s * (i + 0.5)) / 4;
        ctx.moveTo(x, s * 0.18);
        ctx.lineTo(x, s * 0.82);
      }
      ctx.stroke();
      // Zábradlí: 2 vodorovné čáry přes celou šířku.
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.18);
      ctx.lineTo(s, s * 0.18);
      ctx.moveTo(0, s * 0.82);
      ctx.lineTo(s, s * 0.82);
      ctx.stroke();
      break;
    }
  }
}

/**
 * Buňka divočiny (kartografický „papírový" styl). Kreslí CELOU buňku (0,0,s,s).
 * `variant` (celé číslo, default 0) deterministicky střídá vzor (např. směr
 * orby) — žádná náhoda. Orientaci (např. cesty) řeší volající rotací.
 */
export function drawWildernessCellGlyph(
  ctx: CanvasRenderingContext2D,
  type: 'forest' | 'mountain' | 'hill' | 'field' | 'swamp' | 'path',
  s: number,
  variant: number = 0,
): void {
  const lw = Math.max(1, s * 0.06);

  switch (type) {
    case 'forest': {
      // 3 korunky stromů: kruhy + tečka kmene dole u každé.
      const r = s * 0.18;
      const crowns: [number, number][] = [
        [0.3, 0.35],
        [0.65, 0.3],
        [0.45, 0.7],
      ];
      for (const [cx, cy] of crowns) {
        ctx.fillStyle = PAPER_COLORS.foliage;
        ctx.strokeStyle = PAPER_COLORS.foliageDark;
        ctx.lineWidth = lw * 0.5;
        ctx.beginPath();
        ctx.arc(s * cx, s * cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Kmen: tečka ink pod korunou.
        ctx.fillStyle = PAPER_COLORS.ink;
        ctx.beginPath();
        ctx.arc(s * cx, s * cy + r, lw * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'mountain': {
      // Velký vrchol přes buňku: vrchol (0.5s,0.15s), základna 0.1s–0.9s na 0.85s.
      const ax = s * 0.5;
      const ay = s * 0.15;
      ctx.fillStyle = PAPER_COLORS.mountainFill;
      ctx.strokeStyle = PAPER_COLORS.ink;
      ctx.lineWidth = lw * 0.7;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(s * 0.9, s * 0.85);
      ctx.lineTo(s * 0.1, s * 0.85);
      ctx.closePath();
      ctx.fill();
      // Sněhový vrcholek: horní ~20 % trojúhelníku (šířka roste lineárně).
      ctx.fillStyle = PAPER_COLORS.paper;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(s * 0.58, s * 0.29);
      ctx.lineTo(s * 0.42, s * 0.29);
      ctx.closePath();
      ctx.fill();
      // Obrys až po sněhu, ať zůstane celý.
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(s * 0.9, s * 0.85);
      ctx.lineTo(s * 0.1, s * 0.85);
      ctx.closePath();
      ctx.stroke();
      // Šrafa svahu: 3 šikmé čárky z pravé hrany dovnitř dolů.
      ctx.lineWidth = lw * 0.5;
      ctx.beginPath();
      for (const t of [0.35, 0.55, 0.75]) {
        const px = ax + (s * 0.9 - ax) * t;
        const py = ay + (s * 0.85 - ay) * t;
        ctx.moveTo(px, py);
        ctx.lineTo(px - s * 0.1, py + s * 0.1);
      }
      ctx.stroke();
      break;
    }
    case 'hill': {
      // 2 obloučky (půlkruhy nahoru) vedle sebe, druhý menší a posunutý.
      ctx.strokeStyle = PAPER_COLORS.ink;
      ctx.lineWidth = lw * 0.7;
      ctx.beginPath();
      ctx.arc(s * 0.38, s * 0.62, s * 0.22, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.7, s * 0.68, s * 0.14, Math.PI, 0);
      ctx.stroke();
      break;
    }
    case 'field': {
      // Rovnoběžná orba: 4 čáry přes buňku; lichá varianta = svisle.
      ctx.strokeStyle = PAPER_COLORS.fieldLine;
      ctx.lineWidth = lw * 0.6;
      const vertical = variant % 2 === 1;
      ctx.beginPath();
      for (const t of [0.2, 0.4, 0.6, 0.8]) {
        if (vertical) {
          ctx.moveTo(s * t, 0);
          ctx.lineTo(s * t, s);
        } else {
          ctx.moveTo(0, s * t);
          ctx.lineTo(s, s * t);
        }
      }
      ctx.stroke();
      // Drobná tečka v rohu.
      ctx.fillStyle = PAPER_COLORS.inkSoft;
      ctx.beginPath();
      ctx.arc(s * 0.88, s * 0.88, lw * 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'swamp': {
      // 3 krátké vodní čárky (jako u vody, kratší).
      ctx.strokeStyle = PAPER_COLORS.waterLine;
      ctx.lineWidth = lw * 0.5;
      const waves: [number, number, number][] = [
        [0.15, 0.45, 0.3],
        [0.5, 0.85, 0.5],
        [0.2, 0.55, 0.82],
      ];
      ctx.beginPath();
      for (const [x1, x2, ty] of waves) {
        ctx.moveTo(s * x1, s * ty);
        ctx.lineTo(s * x2, s * ty);
      }
      ctx.stroke();
      // 2 trsy trávy: vějířky 3 čárek z jednoho bodu.
      ctx.strokeStyle = PAPER_COLORS.swampLine;
      const tufts: [number, number][] = [
        [0.68, 0.32],
        [0.32, 0.66],
      ];
      ctx.beginPath();
      for (const [cx, cy] of tufts) {
        ctx.moveTo(s * cx, s * cy);
        ctx.lineTo(s * (cx - 0.07), s * (cy - 0.12));
        ctx.moveTo(s * cx, s * cy);
        ctx.lineTo(s * cx, s * (cy - 0.14));
        ctx.moveTo(s * cx, s * cy);
        ctx.lineTo(s * (cx + 0.07), s * (cy - 0.12));
      }
      ctx.stroke();
      break;
    }
    case 'path': {
      // Pásek přes celou buňku vodorovně; orientaci řeší volající rotací.
      ctx.fillStyle = PAPER_COLORS.street;
      ctx.fillRect(0, s * 0.25, s, s * 0.5);
      // Tečkované okraje pásku.
      ctx.save();
      ctx.strokeStyle = PAPER_COLORS.inkSoft;
      ctx.lineWidth = lw * 0.6;
      ctx.setLineDash([lw, lw * 1.4]);
      ctx.beginPath();
      ctx.moveTo(0, s * 0.25);
      ctx.lineTo(s, s * 0.25);
      ctx.moveTo(0, s * 0.75);
      ctx.lineTo(s, s * 0.75);
      ctx.stroke();
      ctx.restore();
      break;
    }
  }
}

/**
 * Dekorace (top-down nábytek). Kreslí se v rámu buňky (0,0,s,s);
 * rotaci řeší volající. `label` má vlastní větev v drawDungeon (text).
 */
export function drawDecorationGlyph(
  ctx: CanvasRenderingContext2D,
  type: Exclude<DungeonDecorationType, 'label'>,
  s: number,
): void {
  const lw = Math.max(1, s * 0.06);
  ctx.strokeStyle = PAPER_COLORS.ink;
  ctx.fillStyle = PAPER_COLORS.paper;
  ctx.lineWidth = lw;
  const inset = s * 0.16;
  const w = s - 2 * inset;

  switch (type) {
    case 'bedna':
      ctx.fillRect(inset, inset, w, w);
      ctx.strokeRect(inset, inset, w, w);
      ctx.beginPath();
      ctx.moveTo(inset, inset);
      ctx.lineTo(inset + w, inset + w);
      ctx.moveTo(inset + w, inset);
      ctx.lineTo(inset, inset + w);
      ctx.stroke();
      break;
    case 'sud':
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, w / 3.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, lw * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = PAPER_COLORS.ink;
      ctx.fill();
      break;
    case 'truhla': {
      const h = w * 0.7;
      const y = (s - h) / 2;
      ctx.fillRect(inset, y, w, h);
      ctx.strokeRect(inset, y, w, h);
      ctx.beginPath();
      ctx.moveTo(inset, y + h * 0.32);
      ctx.lineTo(inset + w, y + h * 0.32);
      ctx.stroke();
      ctx.fillStyle = PAPER_COLORS.ink;
      ctx.fillRect(s / 2 - lw, y + h * 0.32 - lw, lw * 2, lw * 2.4);
      break;
    }
    case 'postel': {
      const bw = w * 0.72;
      const x = (s - bw) / 2;
      ctx.fillRect(x, inset, bw, w);
      ctx.strokeRect(x, inset, bw, w);
      // Polštář u hlavy.
      ctx.strokeRect(x + bw * 0.14, inset + w * 0.07, bw * 0.72, w * 0.22);
      // Deka — příčná linie.
      ctx.beginPath();
      ctx.moveTo(x, inset + w * 0.45);
      ctx.lineTo(x + bw, inset + w * 0.45);
      ctx.stroke();
      break;
    }
    case 'stul': {
      const h = w * 0.62;
      const y = (s - h) / 2;
      ctx.fillRect(inset, y, w, h);
      ctx.strokeRect(inset, y, w, h);
      ctx.strokeRect(inset + lw * 1.4, y + lw * 1.4, w - lw * 2.8, h - lw * 2.8);
      break;
    }
    case 'zidle': {
      const seat = w * 0.55;
      const x = (s - seat) / 2;
      const y = (s - seat) / 2;
      ctx.fillRect(x, y, seat, seat);
      ctx.strokeRect(x, y, seat, seat);
      // Opěradlo.
      ctx.lineWidth = lw * 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + seat, y);
      ctx.stroke();
      ctx.lineWidth = lw;
      break;
    }
    case 'lavice': {
      const h = w * 0.28;
      const y = (s - h) / 2;
      ctx.fillRect(inset, y, w, h);
      ctx.strokeRect(inset, y, w, h);
      break;
    }
    case 'regal': {
      ctx.fillRect(inset, inset, w, w);
      ctx.strokeRect(inset, inset, w, w);
      for (const t of [0.33, 0.66]) {
        ctx.beginPath();
        ctx.moveTo(inset, inset + w * t);
        ctx.lineTo(inset + w, inset + w * t);
        ctx.stroke();
      }
      // Hřbety knih.
      for (const bx of [0.2, 0.38, 0.56, 0.74]) {
        ctx.beginPath();
        ctx.moveTo(inset + w * bx, inset + w * 0.08);
        ctx.lineTo(inset + w * bx, inset + w * 0.28);
        ctx.stroke();
      }
      break;
    }
    case 'krb': {
      // Půlkruh ohniště + plamen.
      ctx.beginPath();
      ctx.arc(s / 2, inset + lw, w / 2, 0, Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s / 2 - w * 0.12, s / 2 + w * 0.05);
      ctx.quadraticCurveTo(s / 2 - w * 0.16, s / 2 - w * 0.22, s / 2, s / 2 - w * 0.3);
      ctx.quadraticCurveTo(s / 2 + w * 0.16, s / 2 - w * 0.1, s / 2 + w * 0.1, s / 2 + w * 0.05);
      ctx.stroke();
      break;
    }
    case 'oltar': {
      const h = w * 0.55;
      const y = (s - h) / 2;
      ctx.fillRect(inset, y, w, h);
      ctx.strokeRect(inset, y, w, h);
      // Kříž na desce.
      ctx.beginPath();
      ctx.moveTo(s / 2, y + h * 0.18);
      ctx.lineTo(s / 2, y + h * 0.82);
      ctx.moveTo(s / 2 - w * 0.14, y + h * 0.38);
      ctx.lineTo(s / 2 + w * 0.14, y + h * 0.38);
      ctx.stroke();
      break;
    }
    case 'sloup':
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, w * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = PAPER_COLORS.ink;
      ctx.fill();
      break;
    case 'studna':
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, w * 0.26, 0, Math.PI * 2);
      ctx.fillStyle = PAPER_COLORS.ink;
      ctx.fill();
      break;
    case 'zebrik': {
      const x1 = s * 0.36;
      const x2 = s * 0.64;
      ctx.beginPath();
      ctx.moveTo(x1, inset);
      ctx.lineTo(x1, s - inset);
      ctx.moveTo(x2, inset);
      ctx.lineTo(x2, s - inset);
      for (const t of [0.28, 0.44, 0.6, 0.76]) {
        ctx.moveTo(x1, s * t);
        ctx.lineTo(x2, s * t);
      }
      ctx.stroke();
      break;
    }
    case 'sut': {
      // Suť: deterministický rozsyp kamínků.
      ctx.fillStyle = PAPER_COLORS.inkSoft;
      const stones: [number, number, number][] = [
        [0.3, 0.35, 0.1],
        [0.55, 0.28, 0.07],
        [0.68, 0.55, 0.09],
        [0.4, 0.62, 0.08],
        [0.55, 0.75, 0.06],
      ];
      for (const [px, py, pr] of stones) {
        ctx.beginPath();
        ctx.arc(s * px, s * py, s * pr, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // ---- Nábytek (21.3e) ----
    case 'kreslo': {
      // Židle s područkami: sedák + tlusté U kolem tří stran.
      const seat = w * 0.5;
      const x = (s - seat) / 2;
      const y = (s - seat) / 2;
      ctx.fillRect(x, y, seat, seat);
      ctx.strokeRect(x, y, seat, seat);
      ctx.lineWidth = lw * 1.8;
      ctx.beginPath();
      ctx.moveTo(x - lw, y + seat);
      ctx.lineTo(x - lw, y - lw);
      ctx.lineTo(x + seat + lw, y - lw);
      ctx.lineTo(x + seat + lw, y + seat);
      ctx.stroke();
      ctx.lineWidth = lw;
      break;
    }
    case 'trun': {
      // Křeslo s vysokým opěradlem: dvojitá horní čára + koule v rozích.
      const seat = w * 0.6;
      const x = (s - seat) / 2;
      const y = (s - seat) / 2;
      ctx.fillRect(x, y, seat, seat);
      ctx.strokeRect(x, y, seat, seat);
      ctx.beginPath();
      ctx.moveTo(x, y - lw * 1.6);
      ctx.lineTo(x + seat, y - lw * 1.6);
      ctx.stroke();
      ctx.fillStyle = PAPER_COLORS.ink;
      for (const bx of [x, x + seat]) {
        ctx.beginPath();
        ctx.arc(bx, y - lw * 1.6, lw * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'skrin': {
      // Obdélník na výšku + středová svislá čára + tečky úchytů.
      const bw = w * 0.7;
      const x = (s - bw) / 2;
      ctx.fillRect(x, inset, bw, w);
      ctx.strokeRect(x, inset, bw, w);
      ctx.beginPath();
      ctx.moveTo(s / 2, inset);
      ctx.lineTo(s / 2, inset + w);
      ctx.stroke();
      ctx.fillStyle = PAPER_COLORS.ink;
      for (const dx of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s / 2 + dx * bw * 0.12, s / 2, lw * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'stojan-zbrani': {
      // Svislý stojan + 3 šikmá kopí přes něj.
      const bw = w * 0.42;
      const x = (s - bw) / 2;
      ctx.fillRect(x, inset, bw, w);
      ctx.strokeRect(x, inset, bw, w);
      ctx.beginPath();
      for (const t of [0.34, 0.5, 0.66]) {
        ctx.moveTo(s * t - w * 0.14, inset + w + lw);
        ctx.lineTo(s * t + w * 0.14, inset - lw);
      }
      ctx.stroke();
      break;
    }
    case 'koberec': {
      // Jen obrysy: vnější + vnitřní obdélník, třásně na obou koncích.
      const h = w * 0.68;
      const y = (s - h) / 2;
      ctx.strokeRect(inset, y, w, h);
      ctx.strokeRect(inset + w * 0.12, y + h * 0.16, w * 0.76, h * 0.68);
      ctx.beginPath();
      for (const t of [0.2, 0.4, 0.6, 0.8]) {
        ctx.moveTo(inset, y + h * t);
        ctx.lineTo(inset - lw * 1.6, y + h * t);
        ctx.moveTo(inset + w, y + h * t);
        ctx.lineTo(inset + w + lw * 1.6, y + h * t);
      }
      ctx.stroke();
      break;
    }

    // ---- Kontejnery (21.3e) ----
    case 'kos': {
      // Kruh + mřížka pletení (2 vodorovné oblouky).
      const r = w * 0.42;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      for (const ty of [0.42, 0.58]) {
        ctx.beginPath();
        ctx.moveTo(s / 2 - r * 0.8, s * ty);
        ctx.quadraticCurveTo(s / 2, s * ty + r * 0.35, s / 2 + r * 0.8, s * ty);
        ctx.stroke();
      }
      break;
    }
    case 'pytel': {
      // Kapka: kruh dole + zúžený krk + uzlík.
      const r = w * 0.36;
      const cy = s * 0.6;
      ctx.beginPath();
      ctx.arc(s / 2, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s / 2 - r * 0.35, cy - r * 0.9);
      ctx.lineTo(s / 2, s * 0.24);
      ctx.moveTo(s / 2 + r * 0.35, cy - r * 0.9);
      ctx.lineTo(s / 2, s * 0.24);
      ctx.stroke();
      ctx.fillStyle = PAPER_COLORS.ink;
      ctx.beginPath();
      ctx.arc(s / 2, s * 0.24, lw, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'amfora': {
      // Elipsa-tělo + úzké hrdlo + 2 ouška.
      ctx.beginPath();
      ctx.ellipse(s / 2, s * 0.58, w * 0.3, w * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const nw = w * 0.16;
      ctx.fillRect(s / 2 - nw / 2, s * 0.18, nw, s * 0.14);
      ctx.strokeRect(s / 2 - nw / 2, s * 0.18, nw, s * 0.14);
      for (const dir of [-1, 1] as const) {
        ctx.beginPath();
        ctx.moveTo(s / 2 + dir * w * 0.24, s * 0.34);
        ctx.quadraticCurveTo(s / 2 + dir * w * 0.46, s * 0.4, s / 2 + dir * w * 0.28, s * 0.48);
        ctx.stroke();
      }
      break;
    }
    case 'klec': {
      // Čtverec + 3 svislé mříže + závěsné oko nahoře.
      ctx.fillRect(inset, inset, w, w);
      ctx.strokeRect(inset, inset, w, w);
      ctx.beginPath();
      for (const t of [0.25, 0.5, 0.75]) {
        ctx.moveTo(inset + w * t, inset);
        ctx.lineTo(inset + w * t, inset + w);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s / 2, inset - lw * 1.2, lw * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    // ---- Dungeon (21.3e) ----
    case 'svicen': {
      // Tyč + 2 ramena + 3 plamínky-tečky nahoře.
      ctx.beginPath();
      ctx.moveTo(s / 2, s * 0.32);
      ctx.lineTo(s / 2, s - inset);
      ctx.moveTo(s / 2 - w * 0.3, s * 0.36);
      ctx.quadraticCurveTo(s / 2 - w * 0.3, s * 0.52, s / 2, s * 0.52);
      ctx.moveTo(s / 2 + w * 0.3, s * 0.36);
      ctx.quadraticCurveTo(s / 2 + w * 0.3, s * 0.52, s / 2, s * 0.52);
      ctx.stroke();
      ctx.fillStyle = PAPER_COLORS.ink;
      const flames: [number, number][] = [
        [-0.3, 0.32],
        [0, 0.26],
        [0.3, 0.32],
      ];
      for (const [dx, ty] of flames) {
        ctx.beginPath();
        ctx.arc(s / 2 + dx * w, s * ty, lw * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'kostra': {
      // Lebka-kruh s očima + zkřížené kosti pod ní.
      const r = w * 0.22;
      const cy = s * 0.36;
      ctx.beginPath();
      ctx.arc(s / 2, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PAPER_COLORS.ink;
      for (const dx of [-0.4, 0.4]) {
        ctx.beginPath();
        ctx.arc(s / 2 + dx * r, cy, lw * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(s / 2 - w * 0.32, s * 0.56);
      ctx.lineTo(s / 2 + w * 0.32, s * 0.8);
      ctx.moveTo(s / 2 + w * 0.32, s * 0.56);
      ctx.lineTo(s / 2 - w * 0.32, s * 0.8);
      ctx.stroke();
      break;
    }
    case 'retezy': {
      // Řetěz: 4 malé elipsy střídavě natočené v diagonále.
      for (let i = 0; i < 4; i++) {
        const t = 0.26 + i * 0.16;
        ctx.beginPath();
        ctx.ellipse(
          s * t,
          s * t,
          lw * 1.9,
          lw * 1.1,
          Math.PI / 4 + (i % 2) * (Math.PI / 2),
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      break;
    }
    case 'socha': {
      // Podstavec + silueta: kruh-hlava + trojúhelník-tělo.
      ctx.fillRect(inset, inset, w, w);
      ctx.strokeRect(inset, inset, w, w);
      ctx.fillStyle = PAPER_COLORS.ink;
      ctx.beginPath();
      ctx.moveTo(s / 2, s * 0.42);
      ctx.lineTo(s / 2 + w * 0.26, s * 0.78);
      ctx.lineTo(s / 2 - w * 0.26, s * 0.78);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s / 2, s * 0.32, w * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'fontana': {
      // Velký kruh + malý kruh uprostřed + 4 kapky okolo.
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, w * 0.16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PAPER_COLORS.ink;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.arc(s / 2 + Math.cos(a) * w * 0.3, s / 2 + Math.sin(a) * w * 0.3, lw * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'ohnivy-kos': {
      // Trojnožka: kruh + 3 nohy + plamínek-vlnka nad kruhem.
      const r = w * 0.3;
      const cy = s * 0.46;
      ctx.beginPath();
      ctx.arc(s / 2, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s / 2 - r * 0.8, cy + r * 0.5);
      ctx.lineTo(s / 2 - r * 1.3, s - inset);
      ctx.moveTo(s / 2 + r * 0.8, cy + r * 0.5);
      ctx.lineTo(s / 2 + r * 1.3, s - inset);
      ctx.moveTo(s / 2, cy + r);
      ctx.lineTo(s / 2, s - inset);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s / 2 - r * 0.6, cy - r - lw);
      ctx.quadraticCurveTo(s / 2 - r * 0.2, cy - r - w * 0.22, s / 2, cy - r - lw);
      ctx.quadraticCurveTo(s / 2 + r * 0.3, cy - r - w * 0.2, s / 2 + r * 0.6, cy - r - lw);
      ctx.stroke();
      break;
    }
    case 'kotel': {
      // Polokoule dnem dolů + linka hladiny + 2 ouška.
      const r = w / 2;
      const cy = s * 0.4;
      ctx.beginPath();
      ctx.arc(s / 2, cy, r, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s / 2 - r * 0.75, cy + r * 0.28);
      ctx.lineTo(s / 2 + r * 0.75, cy + r * 0.28);
      ctx.stroke();
      for (const dir of [-1, 1] as const) {
        ctx.beginPath();
        ctx.arc(s / 2 + dir * r, cy, lw * 1.4, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'magicky-kruh': {
      // Kruh + vepsaný pentagram, tenké čáry.
      const r = w / 2;
      ctx.lineWidth = lw * 0.7;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * (Math.PI * 2)) / 5;
        const px = s / 2 + Math.cos(a) * r;
        const py = s / 2 + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.lineWidth = lw;
      break;
    }
    case 'nahrobek': {
      // Obdélník se zaobleným vrškem + křížek uvnitř.
      const bw = w * 0.6;
      const x = (s - bw) / 2;
      const top = s * 0.3;
      ctx.beginPath();
      ctx.moveTo(x, s - inset);
      ctx.lineTo(x, top);
      ctx.arc(s / 2, top, bw / 2, Math.PI, 0);
      ctx.lineTo(x + bw, s - inset);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s / 2, s * 0.34);
      ctx.lineTo(s / 2, s * 0.56);
      ctx.moveTo(s / 2 - bw * 0.18, s * 0.42);
      ctx.lineTo(s / 2 + bw * 0.18, s * 0.42);
      ctx.stroke();
      break;
    }

    // ---- Jeskyně (21.3e) ----
    case 'stalagmit': {
      // 2–3 trojúhelníky špičkou nahoru, různé výšky.
      ctx.fillStyle = PAPER_COLORS.inkSoft;
      const spikes: [number, number, number][] = [
        [0.32, 0.3, 0.13],
        [0.55, 0.42, 0.1],
        [0.72, 0.52, 0.08],
      ];
      for (const [cx, ty, hw] of spikes) {
        ctx.beginPath();
        ctx.moveTo(s * cx, s * ty);
        ctx.lineTo(s * (cx + hw), s * 0.8);
        ctx.lineTo(s * (cx - hw), s * 0.8);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'krystaly': {
      // 3 štíhlé kosočtverce rostoucí z jednoho bodu, tenký stroke.
      ctx.lineWidth = lw * 0.7;
      const bx = s * 0.5;
      const by = s * 0.78;
      const tips: [number, number, number][] = [
        [0.3, 0.3, 0.07],
        [0.52, 0.22, 0.08],
        [0.72, 0.38, 0.06],
      ];
      for (const [tx, ty, hw] of tips) {
        const dx = s * tx - bx;
        const dy = s * ty - by;
        const len = Math.hypot(dx, dy) || 1;
        const ox = (-dy / len) * s * hw;
        const oy = (dx / len) * s * hw;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo((bx + s * tx) / 2 + ox, (by + s * ty) / 2 + oy);
        ctx.lineTo(s * tx, s * ty);
        ctx.lineTo((bx + s * tx) / 2 - ox, (by + s * ty) / 2 - oy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.lineWidth = lw;
      break;
    }
    case 'houby': {
      // 2 hřiby: klobouk-oblouk + noha, různé velikosti.
      const shrooms: [number, number, number][] = [
        [0.38, 0.55, 0.18],
        [0.66, 0.66, 0.11],
      ];
      for (const [cx, cy, r] of shrooms) {
        ctx.beginPath();
        ctx.moveTo(s * cx, s * cy);
        ctx.lineTo(s * cx, s * (cy + r * 1.4));
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s * cx, s * cy, s * r, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      break;
    }
    case 'pavucina': {
      // V rohu buňky: 3 soustředné čtvrtkruhy + 3 paprsky, tenké čáry.
      ctx.strokeStyle = PAPER_COLORS.inkSoft;
      ctx.lineWidth = lw * 0.7;
      for (const r of [0.24, 0.42, 0.6]) {
        ctx.beginPath();
        ctx.arc(0, 0, s * r, 0, Math.PI / 2);
        ctx.stroke();
      }
      ctx.beginPath();
      for (const a of [Math.PI * 0.1, Math.PI * 0.25, Math.PI * 0.4]) {
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * s * 0.66, Math.sin(a) * s * 0.66);
      }
      ctx.stroke();
      break;
    }
    case 'koreny': {
      // 3 vlnité čáry od horní hrany dolů, každá s odbočkou.
      ctx.lineWidth = lw * 0.8;
      const roots: [number, number][] = [
        [0.3, 0.08],
        [0.52, -0.07],
        [0.72, 0.06],
      ];
      for (const [tx, sway] of roots) {
        ctx.beginPath();
        ctx.moveTo(s * tx, 0);
        ctx.quadraticCurveTo(s * (tx + sway), s * 0.35, s * (tx - sway * 0.5), s * 0.62);
        ctx.moveTo(s * (tx + sway * 0.6), s * 0.38);
        ctx.lineTo(s * (tx + sway * 0.6 + 0.09), s * 0.56);
        ctx.stroke();
      }
      ctx.lineWidth = lw;
      break;
    }
    case 'jezirko':
      // Nepravidelný oblý blob vody + 1 vlnka.
      ctx.fillStyle = PAPER_COLORS.water;
      ctx.strokeStyle = PAPER_COLORS.waterLine;
      ctx.beginPath();
      ctx.moveTo(s * 0.24, s * 0.42);
      ctx.bezierCurveTo(s * 0.3, s * 0.16, s * 0.72, s * 0.18, s * 0.8, s * 0.44);
      ctx.bezierCurveTo(s * 0.88, s * 0.68, s * 0.62, s * 0.86, s * 0.42, s * 0.8);
      ctx.bezierCurveTo(s * 0.2, s * 0.74, s * 0.16, s * 0.6, s * 0.24, s * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.38, s * 0.52);
      ctx.quadraticCurveTo(s * 0.47, s * 0.44, s * 0.55, s * 0.52);
      ctx.quadraticCurveTo(s * 0.6, s * 0.56, s * 0.66, s * 0.52);
      ctx.stroke();
      break;

    // ---- Tábor (21.3e) ----
    case 'ohniste': {
      // Kruh z 8 teček-kamenů + plamínek uprostřed.
      ctx.fillStyle = PAPER_COLORS.ink;
      const r = w * 0.42;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8;
        ctx.beginPath();
        ctx.arc(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r, lw * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(s / 2 - w * 0.12, s / 2 + w * 0.14);
      ctx.quadraticCurveTo(s / 2 - w * 0.18, s / 2 - w * 0.12, s / 2, s / 2 - w * 0.22);
      ctx.moveTo(s / 2 + w * 0.12, s / 2 + w * 0.14);
      ctx.quadraticCurveTo(s / 2 + w * 0.18, s / 2 - w * 0.08, s / 2 + w * 0.02, s / 2 - w * 0.16);
      ctx.stroke();
      break;
    }
    case 'stan':
      // Trojúhelník + svislá čára vchodu.
      ctx.beginPath();
      ctx.moveTo(s / 2, inset);
      ctx.lineTo(s - inset, s - inset);
      ctx.lineTo(inset, s - inset);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s / 2, s * 0.45);
      ctx.lineTo(s / 2, s - inset);
      ctx.stroke();
      break;
    case 'zasoby': {
      // Malá bedna + pytel vedle sebe.
      const bs = w * 0.44;
      const by = s * 0.62 - bs / 2;
      ctx.fillRect(inset, by, bs, bs);
      ctx.strokeRect(inset, by, bs, bs);
      ctx.beginPath();
      ctx.moveTo(inset, by);
      ctx.lineTo(inset + bs, by + bs);
      ctx.stroke();
      const pr = w * 0.22;
      ctx.beginPath();
      ctx.arc(s * 0.66, s * 0.64, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.66, s * 0.64 - pr);
      ctx.lineTo(s * 0.66, s * 0.64 - pr - lw * 1.6);
      ctx.stroke();
      break;
    }
    case 'spaci-pytel': {
      // Protáhlý zaoblený obdélník + příčná čára u hlavy.
      const bw = w * 0.5;
      const x = (s - bw) / 2;
      const rr = bw / 2;
      ctx.beginPath();
      ctx.moveTo(x, inset + rr);
      ctx.arc(s / 2, inset + rr, rr, Math.PI, 0);
      ctx.lineTo(x + bw, s - inset - rr);
      ctx.arc(s / 2, s - inset - rr, rr, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, inset + bw * 0.55);
      ctx.lineTo(x + bw, inset + bw * 0.55);
      ctx.stroke();
      break;
    }

    // ---- Město (režim MĚSTO) ----
    case 'stanek': {
      // Pult na spodních 2/3 + pruhovaná markýza na horní 1/3.
      const ah = w / 3; // výška markýzy
      ctx.fillRect(inset, inset + ah, w, w - ah);
      ctx.strokeRect(inset, inset + ah, w, w - ah);
      // Markýza: podklad paper + 3 ink pruhy (mezi nimi paper) + obrys.
      ctx.fillRect(inset, inset, w, ah);
      ctx.fillStyle = PAPER_COLORS.ink;
      const sw = w / 5;
      for (const i of [0, 2, 4]) {
        ctx.fillRect(inset + i * sw, inset, sw, ah);
      }
      ctx.strokeRect(inset, inset, w, ah);
      break;
    }
    case 'vozik': {
      // Korba nahoře, 2 kola pod ní, oj šikmo doprava.
      const bw = w * 0.68;
      const bh = w * 0.46;
      ctx.fillRect(inset, inset, bw, bh);
      ctx.strokeRect(inset, inset, bw, bh);
      // Oj: 2 šikmé čárky z korby doprava.
      ctx.beginPath();
      ctx.moveTo(inset + bw, inset + bh * 0.25);
      ctx.lineTo(inset + w, inset + bh * 0.55);
      ctx.moveTo(inset + bw, inset + bh * 0.65);
      ctx.lineTo(inset + w, inset + bh * 0.95);
      ctx.stroke();
      // Kola: kruhy s tečkou uprostřed.
      const wr = w * 0.16;
      const wy = inset + bh + wr + lw;
      ctx.fillStyle = PAPER_COLORS.ink;
      for (const wx of [inset + bw * 0.26, inset + bw * 0.74]) {
        ctx.beginPath();
        ctx.arc(wx, wy, wr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(wx, wy, lw * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'lucerna': {
      // Tyč + kosočtvercová lampa nahoře + tenký kruh „záře".
      ctx.beginPath();
      ctx.moveTo(s / 2, s * 0.75);
      ctx.lineTo(s / 2, s * 0.35);
      ctx.stroke();
      const r = w * 0.18;
      const cy = s * 0.35;
      ctx.beginPath();
      ctx.moveTo(s / 2, cy - r);
      ctx.lineTo(s / 2 + r, cy);
      ctx.lineTo(s / 2, cy + r);
      ctx.lineTo(s / 2 - r, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = PAPER_COLORS.inkSoft;
      ctx.lineWidth = lw * 0.4;
      ctx.beginPath();
      ctx.arc(s / 2, cy, r * 1.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = PAPER_COLORS.ink;
      ctx.lineWidth = lw;
      break;
    }
    case 'strom': {
      // Koruna: kruh se střapatým okrajem (8 bump po obvodu) + kmen-tečka.
      const r = w * 0.45;
      ctx.fillStyle = PAPER_COLORS.foliage;
      ctx.strokeStyle = PAPER_COLORS.foliageDark;
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = (i * Math.PI * 2) / 8;
        const px = s / 2 + Math.cos(a) * r * 0.85;
        const py = s / 2 + Math.sin(a) * r * 0.85;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          const am = ((i - 0.5) * Math.PI * 2) / 8;
          ctx.quadraticCurveTo(
            s / 2 + Math.cos(am) * r * 1.2,
            s / 2 + Math.sin(am) * r * 1.2,
            px,
            py,
          );
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PAPER_COLORS.ink;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, lw * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PAPER_COLORS.ink;
      break;
    }
    case 'ker': {
      // 3 menší překrývající se kruhy do trojlístku.
      const r = w * 0.22;
      ctx.fillStyle = PAPER_COLORS.foliage;
      ctx.strokeStyle = PAPER_COLORS.foliageDark;
      const lobes: [number, number][] = [
        [0.5, 0.4],
        [0.38, 0.58],
        [0.62, 0.58],
      ];
      for (const [cx, cy] of lobes) {
        ctx.beginPath();
        ctx.arc(s * cx, s * cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = PAPER_COLORS.ink;
      break;
    }
    case 'plot': {
      // 3 svislé kůly + 2 vodorovné latě v pásu kolem středu.
      ctx.lineWidth = lw * 1.2;
      ctx.beginPath();
      for (const tx of [0.28, 0.5, 0.72]) {
        ctx.moveTo(s * tx, s * 0.34);
        ctx.lineTo(s * tx, s * 0.66);
      }
      ctx.stroke();
      ctx.lineWidth = lw * 0.7;
      ctx.beginPath();
      ctx.moveTo(s * 0.16, s * 0.42);
      ctx.lineTo(s * 0.84, s * 0.42);
      ctx.moveTo(s * 0.16, s * 0.58);
      ctx.lineTo(s * 0.84, s * 0.58);
      ctx.stroke();
      ctx.lineWidth = lw;
      break;
    }

    // ---- Markery (21.3e) — výrazné, mají „ukazovat". ----
    case 'marker-klic': {
      // Obrys klíče: oko + dřík + 2 zuby, tučnější.
      ctx.lineWidth = lw * 1.3;
      const r = w * 0.18;
      ctx.beginPath();
      ctx.arc(s * 0.32, s * 0.32, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.32 + r * 0.7, s * 0.32 + r * 0.7);
      ctx.lineTo(s * 0.74, s * 0.74);
      ctx.moveTo(s * 0.74, s * 0.74);
      ctx.lineTo(s * 0.66, s * 0.82);
      ctx.moveTo(s * 0.62, s * 0.62);
      ctx.lineTo(s * 0.54, s * 0.7);
      ctx.stroke();
      ctx.lineWidth = lw;
      break;
    }
    case 'marker-poklad':
      // Velké ✕ přes střed, tučné.
      ctx.lineWidth = lw * 1.8;
      ctx.beginPath();
      ctx.moveTo(inset, inset);
      ctx.lineTo(s - inset, s - inset);
      ctx.moveTo(s - inset, inset);
      ctx.lineTo(inset, s - inset);
      ctx.stroke();
      ctx.lineWidth = lw;
      break;
    case 'marker-vykricnik': {
      // Tučný vykřičník: svislý obdélníček + tečka.
      const bw = w * 0.16;
      ctx.fillStyle = PAPER_COLORS.ink;
      ctx.fillRect(s / 2 - bw / 2, inset, bw, w * 0.6);
      ctx.beginPath();
      ctx.arc(s / 2, s - inset - bw, bw * 0.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'marker-hvezda': {
      // 5cípá hvězda obrys, tučnější.
      ctx.lineWidth = lw * 1.3;
      const ro = w / 2;
      const ri = ro * 0.42;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? ro : ri;
        const px = s / 2 + Math.cos(a) * r;
        const py = s / 2 + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.lineWidth = lw;
      break;
    }
    case 'marker-otaznik':
      // Tučný otazník textem.
      ctx.fillStyle = PAPER_COLORS.ink;
      ctx.font = `bold ${s * 0.6}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', s / 2, s / 2 + s * 0.02);
      break;
  }
}

/**
 * 21.3e — jemné šrafování povrchu podlahy. Kreslí se PŘED mřížkou/dekoracemi
 * do rámu buňky (0,0,s,s). Nenápadné: barva mřížky, tenké čáry.
 * Neznámá varianta = nekreslí nic.
 */
export function drawFloorVariant(
  ctx: CanvasRenderingContext2D,
  variant: string,
  s: number,
): void {
  ctx.strokeStyle = PAPER_COLORS.grid;
  ctx.fillStyle = PAPER_COLORS.grid;
  ctx.lineWidth = Math.max(0.5, s * 0.025);

  switch (variant) {
    case 'dlazba':
      // Spáry dlaždic 2×2: 2 svislé + 2 vodorovné čárky, offset od kraje.
      ctx.beginPath();
      ctx.moveTo(s / 2, s * 0.1);
      ctx.lineTo(s / 2, s * 0.4);
      ctx.moveTo(s / 2, s * 0.6);
      ctx.lineTo(s / 2, s * 0.9);
      ctx.moveTo(s * 0.1, s / 2);
      ctx.lineTo(s * 0.4, s / 2);
      ctx.moveTo(s * 0.6, s / 2);
      ctx.lineTo(s * 0.9, s / 2);
      ctx.stroke();
      break;
    case 'drevo':
      // Prkna: 3 vodorovné čáry + 1 krátká svislá spára.
      ctx.beginPath();
      for (const ty of [0.25, 0.5, 0.75]) {
        ctx.moveTo(0, s * ty);
        ctx.lineTo(s, s * ty);
      }
      ctx.moveTo(s * 0.62, s * 0.5);
      ctx.lineTo(s * 0.62, s * 0.75);
      ctx.stroke();
      break;
    case 'hlina': {
      // Rozsypané tečky, deterministické pozice.
      const dots: [number, number][] = [
        [0.22, 0.3],
        [0.55, 0.18],
        [0.78, 0.46],
        [0.35, 0.66],
        [0.62, 0.82],
      ];
      for (const [px, py] of dots) {
        ctx.beginPath();
        ctx.arc(s * px, s * py, Math.max(0.5, s * 0.03), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'pisek':
      // 2 krátké vlnky.
      ctx.beginPath();
      ctx.moveTo(s * 0.2, s * 0.35);
      ctx.quadraticCurveTo(s * 0.35, s * 0.28, s * 0.5, s * 0.35);
      ctx.moveTo(s * 0.45, s * 0.68);
      ctx.quadraticCurveTo(s * 0.6, s * 0.61, s * 0.75, s * 0.68);
      ctx.stroke();
      break;
    case 'trava': {
      // 3 trsy: krátké čárky do V + středové stéblo.
      const tufts: [number, number][] = [
        [0.28, 0.32],
        [0.62, 0.55],
        [0.4, 0.78],
      ];
      ctx.beginPath();
      for (const [cx, cy] of tufts) {
        ctx.moveTo(s * cx, s * cy);
        ctx.lineTo(s * (cx - 0.05), s * (cy - 0.09));
        ctx.moveTo(s * cx, s * cy);
        ctx.lineTo(s * (cx + 0.05), s * (cy - 0.09));
        ctx.moveTo(s * cx, s * cy);
        ctx.lineTo(s * cx, s * (cy - 0.11));
      }
      ctx.stroke();
      break;
    }
  }
}
