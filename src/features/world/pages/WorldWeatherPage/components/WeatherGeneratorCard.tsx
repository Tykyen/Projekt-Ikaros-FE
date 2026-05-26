/**
 * 9.4-I M3.2 — Karta generátoru počasí.
 *
 * Layout (dle `c:/tmp/9.4-pocasi-page-design.html`):
 *  - card-header: titulek + lokace + ikona current weather + kebab (PJ+)
 *  - hero: velké teplotní číslo + weather label
 *  - instruments row: Thermometer / Wind / Droplets / Clock (4 sloupce)
 *  - barometer row: WeatherBarometer + narrative text
 *  - hazards: extras + anomaly chip
 *  - actions: Vygenerovat + Broadcast (PomocnyPJ+)
 *
 * Weather-responsive theming přes `data-weather="<type>"` na rootu — CSS
 * driven (atmosphere overlay + particles). Skin-agnostic — všechny barvy
 * přes CSS proměnné, atmosphere přes `mix-blend-mode: screen` neutrální.
 *
 * Drag-to-reorder: handle se renderuje top-left jen pokud `canManage`.
 * Listeners/attributes získává `<WorldWeatherPage>` z `useSortable` a
 * předává sem jako props (sortable wrapper není separátní komponenta —
 * její setup je tak triviální, že žije přímo v Card).
 */
import { forwardRef, useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import {
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Thermometer,
  Wind,
  Droplets,
  Clock,
  MoreVertical,
  RefreshCw,
  Radio,
  Pencil,
  Trash2,
  Settings,
  Flame,
  Snowflake,
  GripVertical,
  AlertTriangle,
  Star,
  History,
} from 'lucide-react';
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import type { WeatherGenerator } from '@/shared/types';
import { KebabMenu } from '@/shared/ui';
import type { KebabMenuItem } from '@/shared/ui';
import { WeatherBarometer } from './WeatherBarometer';
import { WeatherAtmosphere } from './WeatherAtmosphere';
import s from './WeatherGeneratorCard.module.css';

interface Props {
  generator: WeatherGenerator;
  canManage: boolean; // PomocnyPJ+ — generovat, broadcast, ručně, drag
  canDelete: boolean; // PJ+ — smazat
  onGenerate: () => void;
  onBroadcast: () => void;
  onEdit: () => void;
  onManual: () => void;
  onDelete: () => void;
  /** 9.4 dluh #2 — otevře modal s historií snapshotů. */
  onHistory?: () => void;
  /** 9.4 dluh #4 — favorites (FE-only, localStorage). */
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** Drag-handle props z `useSortable` v rodiči — null pokud `!canManage`. */
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
  dragHandleRef?: (el: HTMLElement | null) => void;
  /** Loading flagy z mutations pro disable. */
  generatePending?: boolean;
  /** Sortable transform style — předáno z rodiče. */
  style?: CSSProperties;
  isDragging?: boolean;
  isOver?: boolean;
}

const WEATHER_ICON_MAP: Record<string, typeof CloudSun> = {
  clear: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  snow: CloudSnow,
  fog: CloudFog,
};

function pickWeatherIcon(type: string) {
  return WEATHER_ICON_MAP[type] ?? Cloud;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 9.4 — Formátuje in-game čas v UTC (BE ukládá hour/minute přes setUTCHours,
 * abychom zachovali přesný nastavený čas napříč timezone klientů).
 */
function formatInGameTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function anomalyLabel(t?: string | null): { label: string; icon: typeof Flame } | null {
  switch (t) {
    case 'heat_wave':
      return { label: 'Vlna veder', icon: Flame };
    case 'cold_snap':
      return { label: 'Mrazivá vlna', icon: Snowflake };
    case 'severe_storm':
      return { label: 'Silná bouře', icon: AlertTriangle };
    default:
      return null;
  }
}

export const WeatherGeneratorCard = forwardRef<HTMLElement, Props>(
  function WeatherGeneratorCard(
    {
      generator,
      canManage,
      canDelete,
      onGenerate,
      onBroadcast,
      onEdit,
      onManual,
      onDelete,
      onHistory,
      isFavorite = false,
      onToggleFavorite,
      dragAttributes,
      dragListeners,
      dragHandleRef,
      generatePending,
      style,
      isDragging,
      isOver,
    },
    ref,
  ) {
    const [kebabAnchor, setKebabAnchor] = useState<HTMLButtonElement | null>(
      null,
    );
    const [kebabOpen, setKebabOpen] = useState(false);

    const cw = generator.currentWeather;
    const weatherType = cw?.weatherType ?? 'unknown';
    const WeatherIcon = pickWeatherIcon(weatherType);
    const anomaly = cw ? anomalyLabel(cw.anomalyType) : null;

    const kebabItems: KebabMenuItem[] = [
      {
        key: 'edit',
        label: 'Upravit generátor',
        icon: <Pencil size={16} aria-hidden="true" />,
        onClick: () => {
          setKebabOpen(false);
          onEdit();
        },
      },
      {
        key: 'manual',
        label: 'Ručně nastavit počasí',
        icon: <Settings size={16} aria-hidden="true" />,
        onClick: () => {
          setKebabOpen(false);
          onManual();
        },
      },
      ...(onHistory
        ? [
            {
              key: 'history',
              label: 'Historie počasí',
              icon: <History size={16} aria-hidden="true" />,
              onClick: () => {
                setKebabOpen(false);
                onHistory();
              },
            },
          ]
        : []),
      ...(canDelete
        ? [
            {
              key: 'delete',
              label: 'Smazat generátor',
              variant: 'danger' as const,
              icon: <Trash2 size={16} aria-hidden="true" />,
              onClick: () => {
                setKebabOpen(false);
                onDelete();
              },
            },
          ]
        : []),
    ];

    return (
      <article
        ref={ref}
        className={clsx(
          s.card,
          isDragging && s.dragging,
          isOver && s.over,
        )}
        data-weather={weatherType}
        data-elev="card"
        style={style}
      >
        <WeatherAtmosphere weatherType={weatherType} seed={generator.id} />

        {canManage && (
          <button
            ref={(el) => dragHandleRef?.(el)}
            type="button"
            className={s.dragHandle}
            aria-label={`Přesunout generátor ${generator.name}`}
            title="Přesunout"
            {...dragAttributes}
            {...dragListeners}
          >
            <GripVertical size={14} aria-hidden="true" />
          </button>
        )}

        <header className={s.header}>
          <div className={s.titleBlock}>
            <h2 className={s.name}>{generator.name}</h2>
            {generator.description && (
              <div className={s.location}>{generator.description}</div>
            )}
          </div>
          <div className={s.iconBox} aria-hidden="true">
            <WeatherIcon size={28} />
          </div>
          {onToggleFavorite && (
            <button
              type="button"
              className={s.starBtn}
              data-favorite={isFavorite || undefined}
              aria-label={
                isFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'
              }
              aria-pressed={isFavorite}
              title={isFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
              onClick={onToggleFavorite}
            >
              <Star
                size={18}
                fill={isFavorite ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
            </button>
          )}
          {canManage && (
            <button
              ref={setKebabAnchor}
              type="button"
              className={s.kebab}
              aria-label="Více akcí"
              aria-haspopup="menu"
              aria-expanded={kebabOpen}
              onClick={() => setKebabOpen((v) => !v)}
            >
              <MoreVertical size={18} aria-hidden="true" />
            </button>
          )}
        </header>

        {cw ? (
          <>
            <div className={s.hero}>
              <div className={s.temp}>
                {Math.round(cw.temperature)}
                <span className={s.tempUnit}>°{cw.tempUnit}</span>
              </div>
              <div className={s.weatherLabel}>
                <strong>{cw.cloudiness?.description ?? weatherType}</strong>
                <span>{cw.precipitation?.description ?? ''}</span>
              </div>
            </div>

            <div className={s.instruments}>
              <div className={s.instrument}>
                <Thermometer size={18} className={s.instrumentIcon} aria-hidden="true" />
                <div className={s.instrumentValue}>
                  {Math.round(cw.temperature)}°
                </div>
                <div className={s.instrumentLabel}>Teplota</div>
              </div>
              <div className={s.instrument}>
                <Wind size={18} className={s.instrumentIcon} aria-hidden="true" />
                <div className={s.instrumentValue}>
                  {Math.round(cw.wind?.speed ?? 0)}
                </div>
                <div className={s.instrumentLabel}>Vítr km/h</div>
              </div>
              <div className={s.instrument}>
                <Droplets size={18} className={s.instrumentIcon} aria-hidden="true" />
                <div className={s.instrumentValue}>{Math.round(cw.humidity)}%</div>
                <div className={s.instrumentLabel}>Vlhkost</div>
              </div>
              <div className={s.instrument}>
                <Clock size={18} className={s.instrumentIcon} aria-hidden="true" />
                <div className={s.instrumentValue}>
                  {cw.inGameDate
                    ? formatInGameTime(cw.inGameDate)
                    : formatTime(cw.generatedAt)}
                </div>
                <div className={s.instrumentLabel}>
                  {cw.inGameDate ? 'Čas' : 'Update'}
                </div>
              </div>
            </div>

            <div className={s.barometerRow}>
              <WeatherBarometer
                value={cw.pressure?.value ?? 1013}
                trend={cw.pressure?.trend ?? ''}
              />
              {cw.narrativeText && (
                <p className={s.narrative}>„{cw.narrativeText}"</p>
              )}
            </div>

            {(anomaly || (cw.extras && cw.extras.length > 0)) && (
              <div className={s.hazards}>
                {anomaly && (
                  <span className={clsx(s.hazard, s.hazardWarn)}>
                    <anomaly.icon size={12} aria-hidden="true" />
                    {anomaly.label}
                  </span>
                )}
                {cw.extras?.map((extra, i) => (
                  <span key={i} className={s.hazard} title={extra.description}>
                    {extra.label}: {extra.value}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className={s.empty}>
            <div className={s.emptyIcon} aria-hidden="true">
              <Cloud size={32} />
            </div>
            <h3 className={s.emptyTitle}>Zatím nevygenerováno</h3>
            <p className={s.emptyText}>
              Generátor je nakonfigurovaný, ale ještě nemá první výsledek.
            </p>
          </div>
        )}

        {canManage && (
          <div className={s.actions}>
            <button
              type="button"
              className={s.actionBtn}
              onClick={onGenerate}
              disabled={generatePending}
            >
              <RefreshCw size={14} aria-hidden="true" />
              <span>{cw ? 'Vygenerovat' : 'Vygenerovat první'}</span>
            </button>
            {cw && (
              <button
                type="button"
                className={clsx(s.actionBtn, s.actionPrimary)}
                onClick={onBroadcast}
              >
                <Radio size={14} aria-hidden="true" />
                <span>Broadcast</span>
              </button>
            )}
          </div>
        )}

        {canManage && (
          <KebabMenu
            anchor={kebabAnchor}
            open={kebabOpen}
            onClose={() => setKebabOpen(false)}
            items={kebabItems}
            ariaLabel={`Akce s generátorem ${generator.name}`}
          />
        )}
      </article>
    );
  },
);
