/**
 * 15.3 — sdílené pravítko (měření bod↔bod). Ephemeral, NEní v operation logu
 * (vzor `PingsLayer`/spotlight). Hráč i PJ; výsledek vidí všichni přes WS, ať
 * celý stůl sleduje dostřel.
 *
 * Vzdálenost = počet buněk mezi konci (přes `GridAdapter.distance` daného typu
 * mřížky) × `config.unitsPerCell`, popisek v `config.unitLabel`.
 *
 * Žije uvnitř transform rootu (souřadnice v map-space → pan/zoom s mapou).
 *
 * Spec: docs/arch/phase-15/spec-15.2-15.4.md §2.2b.
 */
import type { Graphics as PixiGraphics } from 'pixi.js';
import { useCallback } from 'react';
import { getGridAdapter } from '../grid';
import type { HexConfig, MapThemeColors } from '../types';

export interface RulerLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RemoteRuler {
  userName: string;
  line: RulerLine;
}

function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace('.', ',');
}

/** Vzdálenost v buňkách + v jednotkách scény mezi konci pravítka. */
function measure(
  line: RulerLine,
  config: HexConfig,
): { cells: number; units: number } {
  const adapter = getGridAdapter(config.gridType);
  const a = adapter.toCell(
    line.x1 - config.originX,
    line.y1 - config.originY,
    config.size,
  );
  const b = adapter.toCell(
    line.x2 - config.originX,
    line.y2 - config.originY,
    config.size,
  );
  const cells = adapter.distance(a, b);
  return { cells, units: cells * (config.unitsPerCell ?? 1) };
}

function RulerView({
  line,
  config,
  color,
  caption,
}: {
  line: RulerLine;
  config: HexConfig;
  /** Pixi ColorSource — hex number (theme ring) i rgba string (pingColor). */
  color: string | number;
  /** Volitelný prefix popisku (jméno měřícího u cizího pravítka). */
  caption?: string;
}): React.ReactElement {
  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.moveTo(line.x1, line.y1);
      g.lineTo(line.x2, line.y2);
      g.stroke({ color, width: Math.max(2, config.size * 0.06), alpha: 0.95 });
      // Koncové body.
      g.circle(line.x1, line.y1, Math.max(3, config.size * 0.12));
      g.circle(line.x2, line.y2, Math.max(3, config.size * 0.12));
      g.fill({ color, alpha: 0.95 });
    },
    [line, color, config.size],
  );

  const { cells, units } = measure(line, config);
  const unitLabel = config.unitLabel ?? 'm';
  const midX = (line.x1 + line.x2) / 2;
  const midY = (line.y1 + line.y2) / 2;
  const fontSize = Math.max(11, Math.round(config.size * 0.4));
  const text = caption
    ? `${caption}: ${fmt(units)} ${unitLabel} (${cells})`
    : `${fmt(units)} ${unitLabel} (${cells})`;

  return (
    <pixiContainer label="ruler" eventMode="none">
      <pixiGraphics draw={draw} />
      <pixiText
        text={text}
        x={midX}
        y={midY - fontSize}
        anchor={0.5}
        resolution={2}
        style={{
          fontFamily: 'monospace',
          fontSize,
          fill: 0xffffff,
          fontWeight: 'bold',
          stroke: { color: 0x000000, width: 4 },
        }}
      />
    </pixiContainer>
  );
}

interface Props {
  /** Vlastní rozměřované pravítko (právě tažené). */
  local: RulerLine | null;
  /** Cizí pravítka (keyed per userId v rodiči). */
  remotes: RemoteRuler[];
  config: HexConfig;
  theme: MapThemeColors;
}

export function MapRulerLayer({
  local,
  remotes,
  config,
  theme,
}: Props): React.ReactElement {
  return (
    <pixiContainer label="ruler-content">
      {remotes.map((r, i) => (
        <RulerView
          key={`remote-${i}`}
          line={r.line}
          config={config}
          color={theme.pingColor}
          caption={r.userName}
        />
      ))}
      {local && (
        <RulerView line={local} config={config} color={theme.tokenRingSelected} />
      )}
    </pixiContainer>
  );
}
