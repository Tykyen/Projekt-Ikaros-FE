/**
 * 21.3a — čistý reducer stavu editoru podzemí (bez Reactu, testovatelný).
 *
 * Undo/redo = snapshoty {cells, decorations}; snapshot se ukládá na začátku
 * „tahu" (beginStroke), takže souvislé malování štětcem je jeden undo krok.
 */
import type {
  DungeonCell,
  DungeonDecoration,
  DungeonDecorationType,
  DungeonMap,
  DungeonNote,
  DoorCellType,
  FloorVariant,
  MapKind,
} from '../types';
import { DUNGEON_LIMITS, normalizeMapKind } from '../types';
import { cloneCells, resizeCells } from '../engine/model';

export type EditorTool =
  | 'pan'
  | 'floor'
  | 'erase'
  | 'door'
  | 'stairs-up'
  | 'stairs-down'
  | 'water'
  | 'lava'
  | 'pit'
  | 'surface'
  | 'decoration'
  | 'label'
  // 21.3e — město
  | 'street'
  | 'building'
  | 'city-wall'
  | 'gate'
  | 'bridge'
  // 21.3g — krajina
  | 'forest'
  | 'mountain'
  | 'hill'
  | 'field'
  | 'swamp';

/** Nástroje, které malují tažením (ostatní = klik). */
export const DRAG_TOOLS: ReadonlySet<EditorTool> = new Set([
  'floor',
  'erase',
  'water',
  'lava',
  'surface',
  'street',
  'building',
  'city-wall',
  'bridge',
  'forest',
  'mountain',
  'hill',
  'field',
  'swamp',
]);

interface Snapshot {
  cells: DungeonCell[][];
  decorations: DungeonDecoration[];
}

export interface EditorState {
  name: string;
  /** 21.3e — druh mapy řídí sadu nástrojů i renderer. */
  mapKind: MapKind;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  cells: DungeonCell[][];
  decorations: DungeonDecoration[];
  /** 21.3f — klíč mapy (mimo undo stack; edituje se textově v panelu). */
  notes: DungeonNote[];
  tool: EditorTool;
  doorType: DoorCellType;
  decorationType: Exclude<DungeonDecorationType, 'label'>;
  /** 21.3d — malovaný povrch; null = gumování povrchu. */
  surfaceVariant: FloorVariant | null;
  undoStack: Snapshot[];
  redoStack: Snapshot[];
  dirty: boolean;
  strokeOpen: boolean;
}

export type EditorAction =
  | { type: 'init'; dungeon: DungeonMap }
  | { type: 'setTool'; tool: EditorTool }
  | { type: 'setDoorType'; doorType: DoorCellType }
  | {
      type: 'setDecorationType';
      decorationType: Exclude<DungeonDecorationType, 'label'>;
    }
  | { type: 'setSurfaceVariant'; surfaceVariant: FloorVariant | null }
  | { type: 'beginStroke' }
  | { type: 'paintCell'; x: number; y: number }
  | { type: 'endStroke' }
  | { type: 'clickCell'; x: number; y: number; labelText?: string }
  | { type: 'undo' }
  | { type: 'redo' }
  | {
      type: 'applyGenerated';
      cells: DungeonCell[][];
      decorations: DungeonDecoration[];
      gridWidth: number;
      gridHeight: number;
    }
  | { type: 'rename'; name: string }
  // 21.3f — klíč mapy: upsert / smazání položky dle labelu.
  | { type: 'setNote'; label: string; title: string; text: string }
  | { type: 'removeNote'; label: string }
  | { type: 'resize'; gridWidth: number; gridHeight: number; cellSize: number }
  | { type: 'markSaved' };

const MAX_UNDO = 50;

const snapshot = (s: EditorState): Snapshot => ({
  cells: cloneCells(s.cells),
  decorations: s.decorations.map((d) => ({ ...d })),
});

const pushUndo = (s: EditorState): EditorState => ({
  ...s,
  undoStack: [...s.undoStack.slice(-(MAX_UNDO - 1)), snapshot(s)],
  redoStack: [],
});

const inGrid = (s: EditorState, x: number, y: number): boolean =>
  x >= 0 && x < s.gridWidth && y >= 0 && y < s.gridHeight;

let decorationSeq = 0;
/** Unikátní id dekorace (timestamp + pořadí — bez závislosti na uuid). */
const newDecorationId = (): string =>
  `dec-${Date.now().toString(36)}-${(decorationSeq++).toString(36)}`;

function applyTool(s: EditorState, x: number, y: number): EditorState {
  if (!inGrid(s, x, y)) return s;
  const current = s.cells[y][x];
  const setCell = (cell: DungeonCell): EditorState => {
    const cells = s.cells.map((row, ry) =>
      ry === y ? row.map((c, rx) => (rx === x ? cell : c)) : row,
    );
    return { ...s, cells, dirty: true };
  };
  switch (s.tool) {
    case 'floor':
      return current.type === 'floor' ? s : setCell({ type: 'floor' });
    case 'erase': {
      const withoutDecs = s.decorations.filter(
        (d) => d.cellX !== x || d.cellY !== y,
      );
      if (current.type === 'empty' && withoutDecs.length === s.decorations.length)
        return s;
      const next = setCell({ type: 'empty' });
      return { ...next, decorations: withoutDecs, dirty: true };
    }
    case 'door':
      return setCell({ type: s.doorType });
    case 'stairs-up':
    case 'stairs-down':
    case 'water':
    case 'lava':
    case 'pit':
    case 'street': // 21.3e+g — město/krajina (stejný vzor: nastav typ buňky)
    case 'building':
    case 'city-wall':
    case 'gate':
    case 'bridge':
    case 'forest':
    case 'mountain':
    case 'hill':
    case 'field':
    case 'swamp':
      return current.type === s.tool ? s : setCell({ type: s.tool });
    case 'surface': {
      // 21.3d+g — povrch: dungeon jen na podlahu; město/krajina na terén a cestu.
      const paintable =
        s.mapKind === 'dungeon'
          ? current.type === 'floor'
          : current.type === 'empty' || current.type === 'street';
      if (!paintable) return s;
      const next = s.surfaceVariant ?? undefined;
      if (current.floorVariant === next) return s;
      return setCell(
        next
          ? { type: current.type, floorVariant: next }
          : { type: current.type },
      );
    }
    default:
      return s;
  }
}

function placeDecoration(
  s: EditorState,
  x: number,
  y: number,
  labelText?: string,
): EditorState {
  if (!inGrid(s, x, y)) return s;
  if (s.tool === 'label') {
    const text = labelText?.trim();
    if (!text) return s;
    // Existující popisek na buňce se přepíše (edit na místě).
    const others = s.decorations.filter(
      (d) => d.type !== 'label' || d.cellX !== x || d.cellY !== y,
    );
    if (others.length >= DUNGEON_LIMITS.maxDecorations) return s;
    return {
      ...s,
      decorations: [
        ...others,
        {
          id: newDecorationId(),
          type: 'label',
          cellX: x,
          cellY: y,
          rotation: 0,
          label: text.slice(0, 60),
        },
      ],
      dirty: true,
    };
  }
  // Dekorace: opakovaný klik na stejný typ na buňce = rotace o 90°.
  const existing = s.decorations.find(
    (d) => d.cellX === x && d.cellY === y && d.type === s.decorationType,
  );
  if (existing) {
    return {
      ...s,
      decorations: s.decorations.map((d) =>
        d.id === existing.id
          ? { ...d, rotation: (((d.rotation + 90) % 360) as 0 | 90 | 180 | 270) }
          : d,
      ),
      dirty: true,
    };
  }
  if (s.decorations.length >= DUNGEON_LIMITS.maxDecorations) return s;
  return {
    ...s,
    decorations: [
      ...s.decorations,
      {
        id: newDecorationId(),
        type: s.decorationType,
        cellX: x,
        cellY: y,
        rotation: 0,
      },
    ],
    dirty: true,
  };
}

export function createEditorState(dungeon: DungeonMap): EditorState {
  const mapKind = normalizeMapKind(dungeon.mapKind);
  return {
    name: dungeon.name,
    mapKind,
    gridWidth: dungeon.gridWidth,
    gridHeight: dungeon.gridHeight,
    cellSize: dungeon.cellSize,
    cells:
      dungeon.cells.length === dungeon.gridHeight
        ? cloneCells(dungeon.cells)
        : resizeCells(dungeon.cells, dungeon.gridWidth, dungeon.gridHeight),
    decorations: dungeon.decorations.map((d) => ({ ...d })),
    notes: (dungeon.notes ?? []).map((n) => ({ ...n })),
    tool: mapKind === 'dungeon' ? 'floor' : 'street',
    doorType: 'door',
    decorationType: mapKind === 'dungeon' ? 'bedna' : 'strom',
    surfaceVariant: mapKind === 'dungeon' ? 'dlazba' : 'trava',
    undoStack: [],
    redoStack: [],
    dirty: false,
    strokeOpen: false,
  };
}

export function editorReducer(
  s: EditorState,
  a: EditorAction,
): EditorState {
  switch (a.type) {
    case 'init':
      return createEditorState(a.dungeon);
    case 'setTool':
      return { ...s, tool: a.tool };
    case 'setDoorType':
      return { ...s, doorType: a.doorType, tool: 'door' };
    case 'setDecorationType':
      return { ...s, decorationType: a.decorationType, tool: 'decoration' };
    case 'setSurfaceVariant':
      return { ...s, surfaceVariant: a.surfaceVariant, tool: 'surface' };
    case 'beginStroke':
      return s.strokeOpen ? s : { ...pushUndo(s), strokeOpen: true };
    case 'paintCell':
      return s.strokeOpen ? applyTool(s, a.x, a.y) : s;
    case 'endStroke':
      return { ...s, strokeOpen: false };
    case 'clickCell': {
      const pushed = pushUndo(s);
      const next =
        s.tool === 'decoration' || s.tool === 'label'
          ? placeDecoration(pushed, a.x, a.y, a.labelText)
          : applyTool(pushed, a.x, a.y);
      // Nic se nezměnilo → snapshot zase zahoď (žádný prázdný undo krok).
      return next === pushed ? s : next;
    }
    case 'undo': {
      const prev = s.undoStack[s.undoStack.length - 1];
      if (!prev) return s;
      return {
        ...s,
        cells: prev.cells,
        decorations: prev.decorations,
        undoStack: s.undoStack.slice(0, -1),
        redoStack: [...s.redoStack.slice(-(MAX_UNDO - 1)), snapshot(s)],
        dirty: true,
      };
    }
    case 'redo': {
      const next = s.redoStack[s.redoStack.length - 1];
      if (!next) return s;
      return {
        ...s,
        cells: next.cells,
        decorations: next.decorations,
        redoStack: s.redoStack.slice(0, -1),
        undoStack: [...s.undoStack.slice(-(MAX_UNDO - 1)), snapshot(s)],
        dirty: true,
      };
    }
    case 'applyGenerated':
      return {
        ...pushUndo(s),
        cells: a.cells,
        decorations: a.decorations,
        gridWidth: a.gridWidth,
        gridHeight: a.gridHeight,
        dirty: true,
        strokeOpen: false,
      };
    case 'rename':
      return {
        ...s,
        name: a.name.slice(0, DUNGEON_LIMITS.maxNameLength),
        dirty: true,
      };
    case 'setNote': {
      const label = a.label.trim();
      if (!label) return s;
      const others = s.notes.filter((n) => n.label !== label);
      if (others.length >= 200) return s;
      // Prázdná položka = smazání (nedržet vatu v dokumentu).
      if (!a.title.trim() && !a.text.trim())
        return { ...s, notes: others, dirty: true };
      return {
        ...s,
        notes: [
          ...others,
          {
            label,
            title: a.title.slice(0, 120),
            text: a.text.slice(0, 2000),
          },
        ],
        dirty: true,
      };
    }
    case 'removeNote':
      return {
        ...s,
        notes: s.notes.filter((n) => n.label !== a.label),
        dirty: true,
      };
    case 'resize': {
      const gridWidth = Math.max(
        DUNGEON_LIMITS.minGrid,
        Math.min(DUNGEON_LIMITS.maxGrid, a.gridWidth),
      );
      const gridHeight = Math.max(
        DUNGEON_LIMITS.minGrid,
        Math.min(DUNGEON_LIMITS.maxGrid, a.gridHeight),
      );
      const cellSize = Math.max(
        DUNGEON_LIMITS.minCellSize,
        Math.min(DUNGEON_LIMITS.maxCellSize, a.cellSize),
      );
      if (
        gridWidth === s.gridWidth &&
        gridHeight === s.gridHeight &&
        cellSize === s.cellSize
      )
        return s;
      return {
        ...pushUndo(s),
        gridWidth,
        gridHeight,
        cellSize,
        cells: resizeCells(s.cells, gridWidth, gridHeight),
        decorations: s.decorations.filter(
          (d) => d.cellX < gridWidth && d.cellY < gridHeight,
        ),
        dirty: true,
      };
    }
    case 'markSaved':
      return { ...s, dirty: false };
    default:
      return s;
  }
}
