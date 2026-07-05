/**
 * 17.2/17.1 — renderer zdí/dveří scény (import UVTT).
 *
 * Souřadnice v map-space px (`points`), layer žije uvnitř transform rootu
 * (pan/zoom s mapou). Viditelné **jen PJ** — editační/kontrolní vrstva.
 *
 * Zdi (`type='wall'`) = jeden `<pixiGraphics>` batch (výkon). Dveře
 * (`type='door'`) = samostatné klikatelné elementy s „úchytem" uprostřed:
 * 17.1 PJ na něj klikne → otevře/zavře → dynamická LoS se přepočítá.
 *
 * Spec: docs/arch/phase-17/spec-17.2.md §5, spec-17.1.md §5.
 */
import type {
  Graphics as PixiGraphics,
  FederatedPointerEvent,
} from 'pixi.js';
import { useCallback } from 'react';
import type { MapWall } from '../types';

const WALL_COLOR = 0xff5a3c; // cihlová — zeď blokující výhled
const DOOR_CLOSED_COLOR = 0xffc93c; // žlutá — zavřené dveře (blokují)
const DOOR_OPEN_COLOR = 0x4caf50; // zelená — otevřené dveře (neblokují)
const WALL_WIDTH = 3;
const DOOR_HANDLE_R = 7; // poloměr klikatelného úchytu dveří

/** Nakreslí jednu lomenou čáru `[x0,y0,x1,y1,...]`. */
function strokePolyline(g: PixiGraphics, points: number[]): void {
  if (points.length < 4) return;
  g.moveTo(points[0], points[1]);
  for (let i = 2; i + 1 < points.length; i += 2) {
    g.lineTo(points[i], points[i + 1]);
  }
}

/** Střed dveří (průměr bodů) — pro úchyt. */
function midPoint(points: number[]): { x: number; y: number } {
  let sx = 0;
  let sy = 0;
  const n = Math.floor(points.length / 2);
  for (let i = 0; i < points.length; i += 2) {
    sx += points[i];
    sy += points[i + 1];
  }
  return { x: sx / n, y: sy / n };
}

/** Klikatelné dveře: čára + úchyt uprostřed (barva dle open/closed). */
function DoorView({
  door,
  onToggle,
}: {
  door: MapWall;
  onToggle?: (id: string) => void;
}): React.ReactElement {
  const open = door.door?.open === true;
  const color = open ? DOOR_OPEN_COLOR : DOOR_CLOSED_COLOR;
  const mid = midPoint(door.points);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      strokePolyline(g, door.points);
      g.stroke({ color, width: WALL_WIDTH + 1, alpha: open ? 0.5 : 0.9 });
      // Úchyt (fill = spolehlivý hit target).
      g.circle(mid.x, mid.y, DOOR_HANDLE_R);
      g.fill({ color, alpha: open ? 0.5 : 0.95 });
    },
    [door.points, color, open, mid.x, mid.y],
  );

  const handleTap = (e: FederatedPointerEvent): void => {
    e.stopPropagation();
    onToggle?.(door.id);
  };

  return (
    <pixiContainer
      eventMode={onToggle ? 'static' : 'none'}
      cursor={onToggle ? 'pointer' : 'default'}
      onPointerTap={onToggle ? handleTap : undefined}
    >
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
}

interface Props {
  walls: MapWall[];
  /** Vrstva se renderuje jen pro PJ. */
  visible: boolean;
  /** 17.1 — PJ toggle dveří (undefined = neklikatelné). */
  onToggleDoor?: (id: string) => void;
}

export function WallsLayer({
  walls,
  visible,
  onToggleDoor,
}: Props): React.ReactElement | null {
  const drawWalls = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (!visible) return;
      for (const w of walls) {
        if (w.type === 'door') continue; // dveře jsou samostatné elementy
        strokePolyline(g, w.points);
        g.stroke({ color: WALL_COLOR, width: WALL_WIDTH, alpha: 0.85 });
      }
    },
    [walls, visible],
  );

  if (!visible || walls.length === 0) return null;

  const doors = walls.filter((w) => w.type === 'door');

  return (
    <pixiContainer label="walls-content">
      <pixiGraphics draw={drawWalls} />
      {doors.map((d) => (
        <DoorView key={d.id} door={d} onToggle={onToggleDoor} />
      ))}
    </pixiContainer>
  );
}
