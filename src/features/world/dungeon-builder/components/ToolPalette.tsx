/**
 * 21.3a — nástrojová lišta editoru (desktop: svislá vlevo, mobil: vodorovná
 * dole se scrollem). Dveře a dekorace mají výsuvnou podpaletu.
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
  Armchair,
  Type,
  Undo2,
  Redo2,
} from 'lucide-react';
import type { DoorCellType, DungeonDecorationType } from '../types';
import { DECORATION_LABELS, DECORATION_TYPES } from '../types';
import { LEGEND_ITEMS } from '../render/drawDungeon';
import type { EditorTool } from '../state/editorState';
import { DoorGlyphIcon, DecorationGlyphIcon } from './GlyphIcon';
import styles from './ToolPalette.module.css';

const MAIN_TOOLS: { tool: EditorTool; label: string; icon: React.ReactNode }[] =
  [
    { tool: 'pan', label: 'Posun mapy', icon: <Hand size={18} /> },
    { tool: 'floor', label: 'Podlaha (tažením)', icon: <Paintbrush size={18} /> },
    { tool: 'erase', label: 'Guma — skála (tažením)', icon: <Eraser size={18} /> },
  ];

const TERRAIN_TOOLS: {
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

export interface ToolPaletteProps {
  tool: EditorTool;
  doorType: DoorCellType;
  decorationType: Exclude<DungeonDecorationType, 'label'>;
  canUndo: boolean;
  canRedo: boolean;
  onSelectTool: (tool: EditorTool) => void;
  onSelectDoorType: (type: DoorCellType) => void;
  onSelectDecorationType: (
    type: Exclude<DungeonDecorationType, 'label'>,
  ) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function ToolPalette({
  tool,
  doorType,
  decorationType,
  canUndo,
  canRedo,
  onSelectTool,
  onSelectDoorType,
  onSelectDecorationType,
  onUndo,
  onRedo,
}: ToolPaletteProps): React.ReactElement {
  const [submenu, setSubmenu] = useState<'door' | 'decoration' | null>(null);

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

  return (
    <div className={styles.palette}>
      <div className={styles.tools}>
        {MAIN_TOOLS.map((t) => toolButton(t.tool, t.label, t.icon))}

        <button
          type="button"
          className={`${styles.toolBtn} ${tool === 'door' ? styles.active : ''}`}
          title="Dveře a průchody"
          aria-label="Dveře a průchody"
          aria-pressed={tool === 'door'}
          aria-expanded={submenu === 'door'}
          onClick={() => {
            onSelectTool('door');
            setSubmenu((s) => (s === 'door' ? null : 'door'));
          }}
        >
          <DoorOpen size={18} />
        </button>

        {TERRAIN_TOOLS.map((t) => toolButton(t.tool, t.label, t.icon))}

        <button
          type="button"
          className={`${styles.toolBtn} ${tool === 'decoration' ? styles.active : ''}`}
          title="Vybavení (bedny, stoly, postele…)"
          aria-label="Vybavení"
          aria-pressed={tool === 'decoration'}
          aria-expanded={submenu === 'decoration'}
          onClick={() => {
            onSelectTool('decoration');
            setSubmenu((s) => (s === 'decoration' ? null : 'decoration'));
          }}
        >
          <Armchair size={18} />
        </button>

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

      {submenu === 'door' && (
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

      {submenu === 'decoration' && (
        <div className={styles.submenu} role="menu" aria-label="Typ vybavení">
          {DECORATION_TYPES.filter((t) => t !== 'label').map((t) => (
            <button
              key={t}
              type="button"
              role="menuitemradio"
              aria-checked={decorationType === t}
              className={`${styles.subItem} ${decorationType === t ? styles.subActive : ''}`}
              onClick={() => {
                onSelectDecorationType(
                  t as Exclude<DungeonDecorationType, 'label'>,
                );
                setSubmenu(null);
              }}
            >
              <DecorationGlyphIcon
                type={t as Exclude<DungeonDecorationType, 'label'>}
                size={26}
              />
              <span>{DECORATION_LABELS[t]}</span>
            </button>
          ))}
          <p className={styles.subHint}>
            Opakovaný klik na položené vybavení = otočení o 90°.
          </p>
        </div>
      )}
    </div>
  );
}
