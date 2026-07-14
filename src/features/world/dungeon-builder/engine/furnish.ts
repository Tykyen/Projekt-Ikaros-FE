/**
 * 21.3d — auto-zabydlení místností generátoru.
 *
 * Deterministické (sdílí rng generátoru): místnost dostane typ podle velikosti,
 * typ má šablonu nábytku (co, kolik, kam — stěny/rohy/střed). Nikdy neblokuje
 * buňky sousedící se dveřmi a nepřekračuje globální limit dekorací.
 */
import type {
  DungeonCell,
  DungeonDecoration,
  DungeonDecorationType,
} from '../types';
import { DUNGEON_LIMITS } from '../types';
import type { DungeonTheme, GeneratedRoom } from './generate';

type Rng = () => number;
type Furniture = Exclude<DungeonDecorationType, 'label'>;
type Spot = 'wall' | 'corner' | 'center' | 'anywhere';

interface Placement {
  type: Furniture;
  /** Kolik kusů na 10 buněk plochy (škáluje se hustotou). */
  per10Cells: number;
  max: number;
  spot: Spot;
  randomRotation?: boolean;
}

export type RoomKind =
  | 'sklad'
  | 'loznice'
  | 'kobka'
  | 'straznice'
  | 'jidelna'
  | 'knihovna'
  | 'sal'
  | 'svatyne'
  | 'jeskyne';

const SMALL_KINDS: RoomKind[] = ['loznice', 'kobka', 'sklad'];
const MEDIUM_KINDS: RoomKind[] = ['straznice', 'jidelna', 'knihovna', 'sklad'];
const LARGE_KINDS: RoomKind[] = ['sal', 'svatyne', 'jeskyne', 'jidelna'];

/** 21.3f — tematické pooly typů místností (default = klasika výše). */
const THEME_KINDS: Partial<
  Record<
    Exclude<DungeonTheme, 'jeskyne'>,
    { small: RoomKind[]; medium: RoomKind[]; large: RoomKind[] }
  >
> = {
  hrobka: {
    small: ['kobka', 'kobka', 'svatyne'],
    medium: ['kobka', 'svatyne', 'knihovna'],
    large: ['svatyne', 'sal', 'kobka'],
  },
  doly: {
    small: ['sklad', 'jeskyne', 'kobka'],
    medium: ['sklad', 'jeskyne', 'jidelna'],
    large: ['jeskyne', 'sklad', 'sal'],
  },
  kanaly: {
    small: ['sklad', 'kobka', 'jeskyne'],
    medium: ['sklad', 'jeskyne', 'kobka'],
    large: ['jeskyne', 'sal', 'sklad'],
  },
  pevnost: {
    small: ['straznice', 'loznice', 'sklad'],
    medium: ['straznice', 'jidelna', 'sklad'],
    large: ['sal', 'straznice', 'jidelna'],
  },
};

/** Šablony: pořadí = priorita (center kusy dřív, ať mají místo). */
const TEMPLATES: Record<RoomKind, Placement[]> = {
  sklad: [
    { type: 'bedna', per10Cells: 1.2, max: 6, spot: 'corner', randomRotation: true },
    { type: 'sud', per10Cells: 1, max: 5, spot: 'wall' },
    { type: 'pytel', per10Cells: 0.6, max: 3, spot: 'wall' },
    { type: 'zasoby', per10Cells: 0.4, max: 2, spot: 'anywhere' },
  ],
  loznice: [
    { type: 'postel', per10Cells: 0.8, max: 2, spot: 'wall' },
    { type: 'truhla', per10Cells: 0.5, max: 1, spot: 'corner' },
    { type: 'skrin', per10Cells: 0.4, max: 1, spot: 'wall' },
    { type: 'svicen', per10Cells: 0.3, max: 1, spot: 'anywhere' },
  ],
  kobka: [
    { type: 'retezy', per10Cells: 0.8, max: 3, spot: 'wall' },
    { type: 'kostra', per10Cells: 0.5, max: 2, spot: 'anywhere', randomRotation: true },
    { type: 'sut', per10Cells: 0.5, max: 2, spot: 'corner' },
    { type: 'klec', per10Cells: 0.3, max: 1, spot: 'corner' },
  ],
  straznice: [
    { type: 'stul', per10Cells: 0.4, max: 1, spot: 'center' },
    { type: 'zidle', per10Cells: 0.8, max: 3, spot: 'center', randomRotation: true },
    { type: 'stojan-zbrani', per10Cells: 0.5, max: 2, spot: 'wall' },
    { type: 'bedna', per10Cells: 0.4, max: 2, spot: 'corner' },
    { type: 'ohnivy-kos', per10Cells: 0.3, max: 1, spot: 'corner' },
  ],
  jidelna: [
    { type: 'stul', per10Cells: 0.6, max: 3, spot: 'center' },
    { type: 'zidle', per10Cells: 1.2, max: 6, spot: 'center', randomRotation: true },
    { type: 'lavice', per10Cells: 0.5, max: 2, spot: 'center', randomRotation: true },
    { type: 'sud', per10Cells: 0.5, max: 2, spot: 'corner' },
    { type: 'krb', per10Cells: 0.3, max: 1, spot: 'wall' },
  ],
  knihovna: [
    { type: 'regal', per10Cells: 1, max: 5, spot: 'wall' },
    { type: 'stul', per10Cells: 0.4, max: 1, spot: 'center' },
    { type: 'kreslo', per10Cells: 0.4, max: 2, spot: 'anywhere', randomRotation: true },
    { type: 'svicen', per10Cells: 0.3, max: 1, spot: 'anywhere' },
  ],
  sal: [
    { type: 'trun', per10Cells: 0.2, max: 1, spot: 'center' },
    { type: 'koberec', per10Cells: 0.3, max: 2, spot: 'center' },
    { type: 'sloup', per10Cells: 0.6, max: 4, spot: 'corner' },
    { type: 'svicen', per10Cells: 0.5, max: 3, spot: 'wall' },
    { type: 'socha', per10Cells: 0.3, max: 2, spot: 'wall' },
  ],
  svatyne: [
    { type: 'oltar', per10Cells: 0.25, max: 1, spot: 'center' },
    { type: 'svicen', per10Cells: 0.7, max: 3, spot: 'anywhere' },
    { type: 'socha', per10Cells: 0.4, max: 2, spot: 'wall' },
    { type: 'magicky-kruh', per10Cells: 0.2, max: 1, spot: 'center' },
    { type: 'lavice', per10Cells: 0.4, max: 2, spot: 'center' },
  ],
  jeskyne: [
    { type: 'stalagmit', per10Cells: 1, max: 5, spot: 'anywhere' },
    { type: 'krystaly', per10Cells: 0.5, max: 2, spot: 'wall' },
    { type: 'houby', per10Cells: 0.6, max: 3, spot: 'anywhere' },
    { type: 'jezirko', per10Cells: 0.25, max: 1, spot: 'center' },
    { type: 'sut', per10Cells: 0.6, max: 3, spot: 'corner' },
  ],
};

export interface FurnishInput {
  cells: DungeonCell[][];
  rooms: GeneratedRoom[];
  /** Buňky dveří (jejich okolí zůstává volné). */
  doors: { x: number; y: number }[];
  /** 0–1: podíl zabydlených místností i hustota kusů. */
  furnishing: number;
  rng: Rng;
  /** Kolik dekorací už existuje (čísla místností) — kvůli globálnímu limitu. */
  existingCount: number;
  /** 21.3f — téma řídí pool typů místností. */
  theme?: DungeonTheme;
}

export function furnishRooms(input: FurnishInput): DungeonDecoration[] {
  const { cells, rooms, doors, rng, existingCount } = input;
  const furnishing = Math.max(0, Math.min(1, input.furnishing));
  if (furnishing === 0 || rooms.length === 0) return [];

  // Blokované buňky: dveře + jejich 4-okolí (průchod musí zůstat volný).
  const blocked = new Set<string>();
  for (const d of doors) {
    blocked.add(`${d.x},${d.y}`);
    blocked.add(`${d.x + 1},${d.y}`);
    blocked.add(`${d.x - 1},${d.y}`);
    blocked.add(`${d.x},${d.y + 1}`);
    blocked.add(`${d.x},${d.y - 1}`);
  }
  const occupied = new Set<string>();
  const density = 0.3 + 0.7 * furnishing;
  const out: DungeonDecoration[] = [];
  let budget = DUNGEON_LIMITS.maxDecorations - existingCount;

  const themed =
    input.theme && input.theme !== 'jeskyne'
      ? THEME_KINDS[input.theme]
      : undefined;
  const pickKind = (room: GeneratedRoom): RoomKind => {
    const area = room.width * room.height;
    const pool =
      area <= 15
        ? (themed?.small ?? SMALL_KINDS)
        : area <= 35
          ? (themed?.medium ?? MEDIUM_KINDS)
          : (themed?.large ?? LARGE_KINDS);
    return pool[Math.floor(rng() * pool.length)];
  };

  for (const room of rooms) {
    if (budget <= 0) break;
    // Podíl zabydlených místností — deterministicky přes rng.
    if (rng() > furnishing * 0.9 + 0.1) continue;
    const kind = pickKind(room);
    const area = room.width * room.height;

    // Kandidátní buňky dle spotu (jen podlaha, mimo blokované/obsazené).
    const inRoom = (x: number, y: number): boolean =>
      x >= room.x &&
      x < room.x + room.width &&
      y >= room.y &&
      y < room.y + room.height;
    const usable = (x: number, y: number): boolean =>
      inRoom(x, y) &&
      cells[y]?.[x]?.type === 'floor' &&
      !blocked.has(`${x},${y}`) &&
      !occupied.has(`${x},${y}`);
    const spots: Record<Spot, [number, number][]> = {
      wall: [],
      corner: [],
      center: [],
      anywhere: [],
    };
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (!usable(x, y)) continue;
        const onEdgeX = x === room.x || x === room.x + room.width - 1;
        const onEdgeY = y === room.y || y === room.y + room.height - 1;
        spots.anywhere.push([x, y]);
        if (onEdgeX && onEdgeY) spots.corner.push([x, y]);
        else if (onEdgeX || onEdgeY) spots.wall.push([x, y]);
        else spots.center.push([x, y]);
      }
    }
    const takeSpot = (spot: Spot): [number, number] | null => {
      // Fallback řetěz: požadovaný spot → anywhere.
      for (const pool of spot === 'anywhere' ? [spots.anywhere] : [spots[spot], spots.anywhere]) {
        const free = pool.filter(([x, y]) => usable(x, y));
        if (free.length) return free[Math.floor(rng() * free.length)];
      }
      return null;
    };

    for (const p of TEMPLATES[kind]) {
      if (budget <= 0) break;
      const count = Math.min(
        p.max,
        Math.round((area / 10) * p.per10Cells * density + rng() * 0.5),
      );
      for (let i = 0; i < count && budget > 0; i++) {
        const cell = takeSpot(p.spot);
        if (!cell) break;
        const [x, y] = cell;
        occupied.add(`${x},${y}`);
        out.push({
          id: `furn-${room.number}-${out.length}`,
          type: p.type,
          cellX: x,
          cellY: y,
          rotation: p.randomRotation
            ? (([0, 90, 180, 270] as const)[Math.floor(rng() * 4)])
            : 0,
        });
        budget--;
      }
    }
  }
  return out;
}
