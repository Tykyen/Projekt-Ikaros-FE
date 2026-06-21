/**
 * 15.3 — měřítko jako viditelný RÁMEČEK-PRAVÍTKO kolem mapy.
 *
 * Kolem okraje mapy se vykreslí vyplněný pruh (lišta, „rámeček obrazu") a NA něm
 * stupňované dílky + kulatá čísla — jako fyzické pravítko. Dílky jsou po
 * jednotkách scény (ne po buňkách): jemný (1/10), půlený (1/2), hlavní s číslem.
 * Lišta lemuje všechny 4 hrany, takže hráč změří délku odkudkoli. Vidí ji
 * všichni (z `config`); gate `showScale !== false`.
 *
 * Měřítko: `pxPerUnit = rozteč buňky / unitsPerCell`. Hlavní (číslovaný) dílek
 * se volí na ~72 px a kulaté číslo (1-2-5 řada).
 *
 * Žije uvnitř transform rootu (pan/zoom s mapou).
 *
 * Spec: docs/arch/phase-15/spec-15.2-15.4.md §2.2.
 */
import type { Graphics as PixiGraphics } from 'pixi.js';
import { useCallback, useMemo } from 'react';
import { getGridAdapter } from '../grid';
import type { MapBounds } from './HexGrid';
import type { HexConfig, MapThemeColors } from '../types';

interface Props {
  config: HexConfig;
  theme: MapThemeColors;
  mapBounds: MapBounds | null;
}

const TARGET_MAJOR_PX = 72; // cílová rozteč číslovaných dílků
const MINOR_LEN = 5; // jemný (1/10)
const MID_LEN = 9; // půlený (1/2)
const MAJOR_LEN = 14; // hlavní (s číslem)
const MAX_TICKS = 4000;

function niceStep(raw: number): number {
  if (raw <= 0 || !Number.isFinite(raw)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * pow;
}

function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace('.', ',');
}

interface RulerTick {
  pos: number;
  level: 0 | 1 | 2; // 0 jemný · 1 půlený · 2 hlavní (číslo)
  value: number;
}

function buildAxis(
  startPx: number,
  lengthPx: number,
  pxPerUnit: number,
): RulerTick[] {
  if (pxPerUnit <= 0 || !Number.isFinite(pxPerUnit) || lengthPx <= 0) return [];
  const majorUnit = niceStep(TARGET_MAJOR_PX / pxPerUnit);
  const minorUnit = majorUnit / 10;
  const n = Math.floor(lengthPx / pxPerUnit / minorUnit + 1e-6);
  if (n > MAX_TICKS) return [];
  const ticks: RulerTick[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i * minorUnit;
    const level: 0 | 1 | 2 = i % 10 === 0 ? 2 : i % 5 === 0 ? 1 : 0;
    ticks.push({ pos: startPx + u * pxPerUnit, level, value: u });
  }
  return ticks;
}

function tickLen(level: 0 | 1 | 2): number {
  return level === 2 ? MAJOR_LEN : level === 1 ? MID_LEN : MINOR_LEN;
}

export function MapScaleFrame({
  config,
  theme,
  mapBounds,
}: Props): React.ReactElement | null {
  const adapter = getGridAdapter(config.gridType);
  const unitsPerCell = config.unitsPerCell ?? 1;
  const unitLabel = config.unitLabel ?? 'm';
  const fontSize = Math.max(9, Math.round(config.size * 0.3));
  // Šířka lišty rámečku (pojme nejdelší dílek + číslo).
  const band = MAJOR_LEN + Math.round(fontSize * 1.8) + 6;

  const origin0 = adapter.toPixel(0, 0, config.size);
  const pitchX =
    adapter.toPixel(1, 0, config.size).x - origin0.x || config.size;
  const pitchY =
    adapter.toPixel(0, 1, config.size).y - origin0.y || config.size;
  const pxPerUnitX = pitchX / unitsPerCell;
  const pxPerUnitY = pitchY / unitsPerCell;

  const { xTicks, yTicks } = useMemo(() => {
    if (!mapBounds) return { xTicks: [], yTicks: [] };
    return {
      xTicks: buildAxis(mapBounds.x, mapBounds.width, pxPerUnitX),
      yTicks: buildAxis(mapBounds.y, mapBounds.height, pxPerUnitY),
    };
  }, [mapBounds, pxPerUnitX, pxPerUnitY]);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (!mapBounds) return;
      const top = mapBounds.y;
      const left = mapBounds.x;
      const right = mapBounds.x + mapBounds.width;
      const bottom = mapBounds.y + mapBounds.height;
      const w = right - left;
      const h = bottom - top;

      // 1) Vyplněné lišty rámečku (mimo mapu; rohy pokryjí horní/dolní lišta).
      g.rect(left - band, top - band, w + 2 * band, band); // horní
      g.rect(left - band, bottom, w + 2 * band, band); // dolní
      g.rect(left - band, top, band, h); // levá
      g.rect(right, top, band, h); // pravá
      // Poloprůhledná lišta — viditelná jako rámeček, ale obsah pod ní prosvítá
      // (neblokuje mapu/mlhu za sebou).
      g.fill({ color: theme.canvasBg, alpha: 0.55 });

      // 2) Dílky NA liště (od hrany mapy ven do lišty).
      for (const t of xTicks) {
        const len = tickLen(t.level);
        g.moveTo(t.pos, top);
        g.lineTo(t.pos, top - len);
        g.moveTo(t.pos, bottom);
        g.lineTo(t.pos, bottom + len);
      }
      for (const t of yTicks) {
        const len = tickLen(t.level);
        g.moveTo(left, t.pos);
        g.lineTo(left - len, t.pos);
        g.moveTo(right, t.pos);
        g.lineTo(right + len, t.pos);
      }
      // 3) Vnitřní rám (hrana mapy) + vnější rám (kraj lišty).
      g.moveTo(left, top);
      g.lineTo(right, top);
      g.lineTo(right, bottom);
      g.lineTo(left, bottom);
      g.lineTo(left, top);
      g.moveTo(left - band, top - band);
      g.lineTo(right + band, top - band);
      g.lineTo(right + band, bottom + band);
      g.lineTo(left - band, bottom + band);
      g.lineTo(left - band, top - band);
      g.stroke({
        color: theme.gridStroke,
        width: theme.gridStrokeWidth,
        alpha: 0.95,
      });
    },
    [mapBounds, xTicks, yTicks, band, theme.canvasBg, theme.gridStroke, theme.gridStrokeWidth],
  );

  if (config.showScale === false || !mapBounds) return null;

  const labelStyle = {
    fontFamily: 'monospace',
    fontSize,
    fill: 0xffffff,
    stroke: { color: 0x000000, width: 3 },
  } as const;
  const left = mapBounds.x;
  const top = mapBounds.y;
  const right = mapBounds.x + mapBounds.width;
  const bottom = mapBounds.y + mapBounds.height;
  const xMajors = xTicks.filter((t) => t.level === 2);
  const yMajors = yTicks.filter((t) => t.level === 2);
  const numOffset = MAJOR_LEN + fontSize * 0.7; // číslo za hlavním dílkem v liště

  return (
    <pixiContainer label="scale-frame">
      <pixiGraphics draw={draw} />
      {/* Čísla osy X — na horní i dolní liště (poslední nese jednotku). */}
      {xMajors.map((t, i) => {
        const text =
          i === xMajors.length - 1
            ? `${fmt(t.value)} ${unitLabel}`
            : fmt(t.value);
        return (
          <pixiContainer key={`x${i}`}>
            <pixiText
              text={text}
              x={t.pos}
              y={top - numOffset}
              anchor={0.5}
              resolution={2}
              style={labelStyle}
            />
            <pixiText
              text={text}
              x={t.pos}
              y={bottom + numOffset}
              anchor={0.5}
              resolution={2}
              style={labelStyle}
            />
          </pixiContainer>
        );
      })}
      {/* Čísla osy Y — na levé i pravé liště. */}
      {yMajors.map((t, i) => {
        const text =
          i === yMajors.length - 1
            ? `${fmt(t.value)} ${unitLabel}`
            : fmt(t.value);
        return (
          <pixiContainer key={`y${i}`}>
            <pixiText
              text={text}
              x={left - numOffset}
              y={t.pos}
              anchor={0.5}
              resolution={2}
              style={labelStyle}
            />
            <pixiText
              text={text}
              x={right + numOffset}
              y={t.pos}
              anchor={0.5}
              resolution={2}
              style={labelStyle}
            />
          </pixiContainer>
        );
      })}
    </pixiContainer>
  );
}
