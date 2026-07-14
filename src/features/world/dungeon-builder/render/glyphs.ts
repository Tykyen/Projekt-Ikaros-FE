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
  }
}
