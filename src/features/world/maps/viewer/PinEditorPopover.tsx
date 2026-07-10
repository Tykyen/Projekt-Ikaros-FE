import { useId, useMemo, useState } from 'react';
import { MapPin, FileText, Layers, Info, Search, Trash2 } from 'lucide-react';
import { PagePicker } from '@/features/world/components/PagePicker/PagePicker';
import type {
  CreatePinInput,
  WorldMapEntry,
  WorldMapPin,
  WorldMapPinTargetType,
} from '../types';
import {
  PIN_ICON_CATEGORIES,
  PIN_COLORS,
  DEFAULT_PIN_ICON,
  DEFAULT_PIN_COLOR,
} from '../constants/pinAppearance';
import s from './viewer.module.css';

interface Props {
  worldId: string;
  maps: WorldMapEntry[];
  currentMapId: string;
  /** Null = nová vlaječka. */
  editing: WorldMapPin | null;
  pos: { left: number; top: number };
  onSave: (input: CreatePinInput, editingId: string | null) => void;
  onDelete: (pinId: string) => void;
  onClose: () => void;
}

/**
 * 16.5 — editor vlaječky (nová i úprava). Cíl `page` = sdílený `PagePicker`;
 * `map` = výběr jiné mapy světa; `none` = jen informace. Vzhled = ~30 ikon
 * (filtr) + 6 barev. „Tajná" = `!isPublic`.
 */
export function PinEditorPopover({
  worldId,
  maps,
  currentMapId,
  editing,
  pos,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const uid = useId();
  const [label, setLabel] = useState(editing?.label ?? '');
  const [info, setInfo] = useState(editing?.info ?? '');
  const [targetType, setTargetType] = useState<WorldMapPinTargetType>(
    editing?.targetType ?? 'none',
  );
  const [targetSlug, setTargetSlug] = useState<string | null>(
    editing?.targetSlug ?? null,
  );
  const [targetMapId, setTargetMapId] = useState<string | null>(
    editing?.targetMapId ?? null,
  );
  const [icon, setIcon] = useState(editing?.icon ?? DEFAULT_PIN_ICON);
  const [color, setColor] = useState(editing?.color ?? DEFAULT_PIN_COLOR);
  const [isPublic, setIsPublic] = useState(editing?.isPublic ?? true);
  const [iconFilter, setIconFilter] = useState('');

  const mapOptions = useMemo(
    () => maps.filter((m) => m.id !== currentMapId),
    [maps, currentMapId],
  );

  const filteredCats = useMemo(() => {
    const q = iconFilter.trim().toLowerCase();
    if (!q) return PIN_ICON_CATEGORIES;
    return PIN_ICON_CATEGORIES.map((c) => ({
      ...c,
      icons: c.icons.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((c) => c.icons.length > 0);
  }, [iconFilter]);

  function handleSave() {
    onSave(
      {
        x: editing?.x ?? 0,
        y: editing?.y ?? 0,
        label: label.trim() || 'Bez názvu',
        info: info.trim(),
        targetType,
        targetSlug: targetType === 'page' ? targetSlug : null,
        targetMapId: targetType === 'map' ? targetMapId : null,
        icon,
        color,
        isPublic,
      },
      editing?.id ?? null,
    );
  }

  const TYPES: { t: WorldMapPinTargetType; label: string; Icon: typeof Info }[] =
    [
      { t: 'page', label: 'Stránka', Icon: FileText },
      { t: 'map', label: 'Jiná mapa', Icon: Layers },
      { t: 'none', label: 'Jen info', Icon: Info },
    ];

  return (
    <div
      className={s.editor}
      style={{ left: pos.left, top: pos.top }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <h4 className={s.editorTitle}>
        <MapPin size={16} aria-hidden />
        {editing ? 'Upravit vlaječku' : 'Nová vlaječka'}
      </h4>

      <div className={s.field}>
        <label className={s.fieldLabel} htmlFor={`${uid}-label`}>Popisek</label>
        {/* eslint-disable jsx-a11y/no-autofocus -- autofocus do prvního pole při otevření popoveru je záměr */}
        <input
          id={`${uid}-label`}
          className={s.input}
          type="text"
          value={label}
          maxLength={200}
          placeholder="např. Přístav Mir500"
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
        />
        {/* eslint-enable jsx-a11y/no-autofocus */}
      </div>

      <div className={s.field}>
        <label className={s.fieldLabel} htmlFor={`${uid}-info`}>Informace (volitelné)</label>
        <textarea
          id={`${uid}-info`}
          className={s.textarea}
          value={info}
          maxLength={2000}
          placeholder="Krátký odstavec o místě — vidí ho hráč v bublině."
          onChange={(e) => setInfo(e.target.value)}
        />
      </div>

      <div className={s.field}>
        {/* Skupinový popisek segmentu tlačítek (víc controlů) → span, ne label. */}
        <span className={s.fieldLabel}>Co pin dělá po kliknutí</span>
        <div className={s.seg}>
          {TYPES.map(({ t, label: l, Icon }) => (
            <button
              key={t}
              type="button"
              className={`${s.segBtn} ${targetType === t ? s.segBtnSel : ''}`}
              onClick={() => setTargetType(t)}
            >
              <Icon size={16} aria-hidden />
              {l}
            </button>
          ))}
        </div>
      </div>

      {targetType === 'page' && (
        <div className={s.field}>
          {/* PagePicker = vlastní widget bez jednoho přímého inputu → span. */}
          <span className={s.fieldLabel}>Vybrat stránku</span>
          <PagePicker
            worldId={worldId}
            value={targetSlug}
            onChange={setTargetSlug}
            placeholder="Vyhledej stránku…"
          />
        </div>
      )}
      {targetType === 'map' && (
        <div className={s.field}>
          <label className={s.fieldLabel} htmlFor={`${uid}-map`}>Vybrat mapu</label>
          <select
            id={`${uid}-map`}
            className={s.select}
            value={targetMapId ?? ''}
            onChange={(e) => setTargetMapId(e.target.value || null)}
            data-native-select
          >
            <option value="">— vyber mapu —</option>
            {mapOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={s.field}>
        {/* Skupinový popisek pro filtr + mřížku ikon → span, ne label. */}
        <span className={s.fieldLabel}>Vzhled — ikona</span>
        <div className={s.field} style={{ marginBottom: 6 }}>
          <div
            className={s.input}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Search size={14} aria-hidden style={{ opacity: 0.6 }} />
            <input
              type="text"
              value={iconFilter}
              placeholder="Filtr ikon…"
              onChange={(e) => setIconFilter(e.target.value)}
              style={{
                flex: 1,
                border: 0,
                background: 'transparent',
                color: 'inherit',
                font: 'inherit',
                outline: 'none',
              }}
            />
          </div>
        </div>
        {filteredCats.map((cat) => (
          <div key={cat.label}>
            <div className={s.catLabel}>{cat.label}</div>
            <div className={s.iconGrid}>
              {cat.icons.map(({ key, label: l, Icon }) => (
                <button
                  key={key}
                  type="button"
                  className={`${s.iconBtn2} ${icon === key ? s.iconBtnSel : ''}`}
                  title={l}
                  aria-label={l}
                  onClick={() => setIcon(key)}
                >
                  <Icon size={17} aria-hidden />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={s.field}>
        {/* Skupinový popisek pro tlačítka barev → span, ne label. */}
        <span className={s.fieldLabel}>Barva</span>
        <div className={s.colorRow}>
          {PIN_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`${s.colorBtn} ${color === c.key ? s.colorBtnSel : ''}`}
              style={{ background: c.value }}
              title={c.label}
              aria-label={c.label}
              onClick={() => setColor(c.key)}
            />
          ))}
        </div>
      </div>

      <div className={s.field}>
        <div className={s.visRow}>
          <span
            className={`${s.switch} ${!isPublic ? s.switchOn : ''}`}
            role="switch"
            aria-checked={!isPublic}
            tabIndex={0}
            onClick={() => setIsPublic((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsPublic((v) => !v);
            }}
          >
            <span className={s.knob} />
          </span>
          Tajná vlaječka (jen PJ)
        </div>
      </div>

      <div className={s.editorActions}>
        {editing && (
          <button
            type="button"
            className={`${s.btn} ${s.btnDanger}`}
            onClick={() => onDelete(editing.id)}
          >
            <Trash2 size={14} aria-hidden /> Smazat
          </button>
        )}
        <button type="button" className={s.btn} onClick={onClose}>
          Zrušit
        </button>
        <button
          type="button"
          className={`${s.btn} ${s.btnPrimary}`}
          onClick={handleSave}
        >
          {editing ? 'Uložit' : 'Přidat'}
        </button>
      </div>
    </div>
  );
}
