/**
 * 21.3a+d+e — nástrojová lišta editoru (desktop: svislá vlevo, mobil:
 * vodorovná dole se scrollem). Sada nástrojů se přepíná podle druhu mapy
 * (podzemí/město); dveře, povrchy a dekorace mají výsuvnou podpaletu.
 */
import { useState } from 'react';
import {
  Hand,
  Paintbrush,
  Eraser,
  DoorOpen,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Waves,
  Flame,
  CircleDot,
  Layers,
  Armchair,
  Type,
  Undo2,
  Redo2,
} from 'lucide-react';
import type {
  DoorCellType,
  DungeonDecorationType,
  FloorVariant,
  MapKind,
} from '../types';
import {
  DECORATION_CATEGORIES,
  DECORATION_LABELS,
  FLOOR_VARIANTS,
  FLOOR_VARIANT_LABELS,
} from '../types';
import { LEGEND_ITEMS } from '../render/drawDungeon';
import { drawCityCellGlyph, drawWildernessCellGlyph } from '../render/glyphs';
import type { EditorTool } from '../state/editorState';
import { DoorGlyphIcon, DecorationGlyphIcon, GlyphIcon } from './GlyphIcon';
import styles from './ToolPalette.module.css';

const DUNGEON_TOOLS: {
  tool: EditorTool;
  label: string;
  icon: React.ReactNode;
}[] = [
  { tool: 'floor', label: 'Podlaha (tažením)', icon: <Paintbrush size={18} /> },
  { tool: 'erase', label: 'Guma — skála (tažením)', icon: <Eraser size={18} /> },
];

const DUNGEON_TERRAIN: {
  tool: EditorTool;
  label: string;
  icon: React.ReactNode;
}[] = [
  { tool: 'stairs-up', label: 'Schody nahoru', icon: <ArrowUpFromLine size={18} /> },
  { tool: 'stairs-down', label: 'Schody dolů', icon: <ArrowDownFromLine size={18} /> },
  { tool: 'water', label: 'Voda (tažením)', icon: <Waves size={18} /> },
  { tool: 'lava', label: 'Láva (tažením)', icon: <Flame size={18} /> },
  { tool: 'pit', label: 'Jáma', icon: <CircleDot size={18} /> },
];

/** 21.3e — městské nástroje s věrnými canvas náhledy buněk. */
const CITY_TOOLS: {
  tool: EditorTool;
  label: string;
  cell: 'street' | 'building' | 'city-wall' | 'gate' | 'bridge';
}[] = [
  { tool: 'street', label: 'Ulice (tažením)', cell: 'street' },
  { tool: 'building', label: 'Budova (tažením)', cell: 'building' },
  { tool: 'city-wall', label: 'Hradba (tažením)', cell: 'city-wall' },
  { tool: 'gate', label: 'Brána', cell: 'gate' },
  { tool: 'bridge', label: 'Most (tažením)', cell: 'bridge' },
];

/** 21.3g — nástroje krajiny (cesta jede přes typ `street`). */
const WILDERNESS_TOOLS: {
  tool: EditorTool;
  label: string;
  glyph:
    | { wild: 'path' | 'forest' | 'mountain' | 'hill' | 'field' | 'swamp' }
    | { city: 'building' | 'bridge' };
}[] = [
  { tool: 'street', label: 'Cesta (tažením)', glyph: { wild: 'path' } },
  { tool: 'forest', label: 'Les (tažením)', glyph: { wild: 'forest' } },
  { tool: 'mountain', label: 'Hory (tažením)', glyph: { wild: 'mountain' } },
  { tool: 'hill', label: 'Kopce (tažením)', glyph: { wild: 'hill' } },
  { tool: 'field', label: 'Pole (tažením)', glyph: { wild: 'field' } },
  { tool: 'swamp', label: 'Mokřad (tažením)', glyph: { wild: 'swamp' } },
  { tool: 'building', label: 'Stavení (tažením)', glyph: { city: 'building' } },
  { tool: 'bridge', label: 'Most (tažením)', glyph: { city: 'bridge' } },
];

type Submenu = 'door' | 'surface' | 'decoration' | null;

export interface ToolPaletteProps {
  mapKind: MapKind;
  tool: EditorTool;
  doorType: DoorCellType;
  decorationType: Exclude<DungeonDecorationType, 'label'>;
  surfaceVariant: FloorVariant | null;
  canUndo: boolean;
  canRedo: boolean;
  onSelectTool: (tool: EditorTool) => void;
  onSelectDoorType: (type: DoorCellType) => void;
  onSelectDecorationType: (
    type: Exclude<DungeonDecorationType, 'label'>,
  ) => void;
  onSelectSurfaceVariant: (variant: FloorVariant | null) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function ToolPalette({
  mapKind,
  tool,
  doorType,
  decorationType,
  surfaceVariant,
  canUndo,
  canRedo,
  onSelectTool,
  onSelectDoorType,
  onSelectDecorationType,
  onSelectSurfaceVariant,
  onUndo,
  onRedo,
}: ToolPaletteProps): React.ReactElement {
  const [submenu, setSubmenu] = useState<Submenu>(null);

  const toolButton = (
    t: EditorTool,
    label: string,
    icon: React.ReactNode,
  ): React.ReactElement => (
    <button
      key={t}
      type="button"
      className={`${styles.toolBtn} ${tool === t ? styles.active : ''}`}
      title={label}
      aria-label={label}
      aria-pressed={tool === t}
      onClick={() => {
        onSelectTool(t);
        setSubmenu(null);
      }}
    >
      {icon}
    </button>
  );

  const submenuButton = (
    key: Exclude<Submenu, null>,
    t: EditorTool,
    label: string,
    icon: React.ReactNode,
  ): React.ReactElement => (
    <button
      key={key}
      type="button"
      className={`${styles.toolBtn} ${tool === t ? styles.active : ''}`}
      title={label}
      aria-label={label}
      aria-pressed={tool === t}
      aria-expanded={submenu === key}
      onClick={() => {
        onSelectTool(t);
        setSubmenu((s) => (s === key ? null : key));
      }}
    >
      {icon}
    </button>
  );

  return (
    <div className={styles.palette}>
      <div className={styles.tools}>
        {toolButton('pan', 'Posun mapy', <Hand size={18} />)}

        {mapKind === 'dungeon' && (
          <>
            {DUNGEON_TOOLS.map((t) => toolButton(t.tool, t.label, t.icon))}
            {submenuButton('door', 'door', 'Dveře a průchody', <DoorOpen size={18} />)}
            {DUNGEON_TERRAIN.map((t) => toolButton(t.tool, t.label, t.icon))}
          </>
        )}
        {mapKind === 'city' && (
          <>
            {CITY_TOOLS.map((t) =>
              toolButton(
                t.tool,
                t.label,
                <GlyphIcon draw={(ctx, s) => drawCityCellGlyph(ctx, t.cell, s)} size={20} />,
              ),
            )}
            {toolButton('erase', 'Guma — terén (tažením)', <Eraser size={18} />)}
            {toolButton('water', 'Voda (tažením)', <Waves size={18} />)}
          </>
        )}
        {mapKind === 'wilderness' && (
          <>
            {WILDERNESS_TOOLS.map((t) =>
              toolButton(
                t.tool,
                t.label,
                <GlyphIcon
                  draw={(ctx, s) =>
                    'wild' in t.glyph
                      ? drawWildernessCellGlyph(ctx, t.glyph.wild, s)
                      : drawCityCellGlyph(ctx, t.glyph.city, s)
                  }
                  size={20}
                />,
              ),
            )}
            {toolButton('erase', 'Guma — louka (tažením)', <Eraser size={18} />)}
            {toolButton('water', 'Voda (tažením)', <Waves size={18} />)}
          </>
        )}

        {submenuButton(
          'surface',
          'surface',
          'Povrch (tažením)',
          <Layers size={18} />,
        )}
        {submenuButton(
          'decoration',
          'decoration',
          'Vybavení (bedny, stromy, stánky…)',
          <Armchair size={18} />,
        )}
        {toolButton('label', 'Popisek (text)', <Type size={18} />)}

        <div className={styles.divider} />

        <button
          type="button"
          className={styles.toolBtn}
          title="Zpět (Ctrl+Z)"
          aria-label="Zpět"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 size={18} />
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          title="Znovu (Ctrl+Y)"
          aria-label="Znovu"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 size={18} />
        </button>
      </div>

      {submenu === 'door' && mapKind === 'dungeon' && (
        <div className={styles.submenu} role="menu" aria-label="Typ dveří">
          {LEGEND_ITEMS.map((item) => (
            <button
              key={item.type}
              type="button"
              role="menuitemradio"
              aria-checked={doorType === item.type}
              className={`${styles.subItem} ${doorType === item.type ? styles.subActive : ''}`}
              onClick={() => {
                onSelectDoorType(item.type);
                setSubmenu(null);
              }}
            >
              <DoorGlyphIcon type={item.type} size={26} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {submenu === 'surface' && (
        <div className={styles.submenu} role="menu" aria-label="Povrch">
          {FLOOR_VARIANTS.map((v) => (
            <button
              key={v}
              type="button"
              role="menuitemradio"
              aria-checked={surfaceVariant === v}
              className={`${styles.subItem} ${surfaceVariant === v ? styles.subActive : ''}`}
              onClick={() => {
                onSelectSurfaceVariant(v);
                setSubmenu(null);
              }}
            >
              <span>{FLOOR_VARIANT_LABELS[v]}</span>
            </button>
          ))}
          <button
            type="button"
            role="menuitemradio"
            aria-checked={surfaceVariant === null}
            className={`${styles.subItem} ${surfaceVariant === null ? styles.subActive : ''}`}
            onClick={() => {
              onSelectSurfaceVariant(null);
              setSubmenu(null);
            }}
          >
            <span>Smazat povrch</span>
          </button>
          <p className={styles.subHint}>
            {mapKind === 'city'
              ? 'Maluje se tažením na terén a ulice.'
              : 'Maluje se tažením, jen na podlahu.'}
          </p>
        </div>
      )}

      {submenu === 'decoration' && (
        <div
          className={`${styles.submenu} ${styles.submenuWide}`}
          role="menu"
          aria-label="Typ vybavení"
        >
          {DECORATION_CATEGORIES.map((cat) => (
            <section key={cat.key} className={styles.subCategory}>
              <h4 className={styles.subCategoryTitle}>{cat.label}</h4>
              <div className={styles.subCategoryItems}>
                {cat.types.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="menuitemradio"
                    aria-checked={decorationType === t}
                    className={`${styles.subItem} ${decorationType === t ? styles.subActive : ''}`}
                    onClick={() => {
                      onSelectDecorationType(t);
                      setSubmenu(null);
                    }}
                  >
                    <DecorationGlyphIcon type={t} size={26} />
                    <span>{DECORATION_LABELS[t]}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          <p className={styles.subHint}>
            Opakovaný klik na položené vybavení = otočení o 90°.
          </p>
        </div>
      )}
    </div>
  );
}
