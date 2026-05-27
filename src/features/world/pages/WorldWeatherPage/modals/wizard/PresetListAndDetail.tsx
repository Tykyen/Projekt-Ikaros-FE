/**
 * 9.4-I — Stage 3 wizardu: scroll list presetů + preview detail.
 *
 * Split layout (1fr | 360px). Levý sloupec scrollovatelný list, pravý
 * sticky detail s 3 trial rolly (Leden/Červenec/Extrém nebo custom
 * calendar). „Náhled znovu" re-roll s novým salt, „→ Použít" finalizuje.
 *
 * Mobil <720px: stack pod sebou (list nahoře, detail pod ním).
 */
import { useMemo, useState } from 'react';
import { RotateCcw, ArrowRight } from 'lucide-react';
import s from './PresetListAndDetail.module.css';
import type { PresetItem } from './types';
import { Button } from '@/shared/ui';
import { usePreviewWeather } from '@/features/world/api/usePreviewWeather';
import { useTrialMonths } from '@/features/world/api/useTrialMonths';
import type { TrialMonth } from '@/features/world/api/useTrialMonths';

interface Props {
  items: PresetItem[];
  worldId: string;
  /** Volání po stisku „Použít" / „Aplikovat klimat". */
  onApply: (item: PresetItem) => void;
  /** Pokud query nonempty, ukáže banner „X výsledků pro …" + clear. */
  searchQuery?: string;
  onClearSearch?: () => void;
  /**
   * 9.4-dluh — Pokud true a `items.length === 0`, ukáže custom-specific
   * empty state s návodem („Ulož generátor jako preset…").
   */
  isCustomEmpty?: boolean;
  /**
   * 9.4-J — repair mód: existující generátor bez klimatu. CTA label se mění
   * na „Aplikovat klimat" a parent dělá merge místo full replace configu.
   */
  mode?: 'create' | 'repair';
}

export function PresetListAndDetail({
  items,
  worldId,
  onApply,
  searchQuery,
  onClearSearch,
  isCustomEmpty,
  mode = 'create',
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    items[0]?.id ?? null,
  );
  const [reRollSalt, setReRollSalt] = useState(0);

  const trialMonths = useTrialMonths(worldId);
  const { previewWeather } = usePreviewWeather();

  // Selected fallback — pokud zmizí ze seznamu (např. search filter), vyber první.
  const selected = useMemo<PresetItem | null>(() => {
    const direct = items.find((i) => i.id === selectedId);
    if (direct) return direct;
    return items[0] ?? null;
  }, [items, selectedId]);

  const config = useMemo(
    () => (selected ? selected.toConfig() : null),
    [selected],
  );

  const previews = useMemo(() => {
    if (!config || !selected) return [];
    return trialMonths.map((month, idx) => ({
      month,
      result: previewWeather(config, month, {
        configId: selected.id,
        salt: `${idx}-${reRollSalt}`,
      }),
    }));
  }, [config, selected, trialMonths, previewWeather, reRollSalt]);

  if (items.length === 0) {
    // 9.4-dluh — custom-specific empty state (před fallback search empty).
    if (isCustomEmpty && !searchQuery) {
      return (
        <div className={s.empty}>
          <p style={{ fontSize: 32, marginBottom: 8 }} aria-hidden>
            ⭐
          </p>
          <p>
            <strong>Zatím nemáš žádný vlastní preset pro tento svět.</strong>
          </p>
          <p style={{ opacity: 0.7, maxWidth: 480 }}>
            Otevři modal „Nový generátor", dolaď konfiguraci v záložkách
            „Základ" / „Pokročilé", a klikni na „Uložit jako preset". Uložené
            presety se objeví zde a můžeš je rychle znovu použít.
          </p>
        </div>
      );
    }
    return (
      <div className={s.empty}>
        <p>Žádné presety neodpovídají hledanému výrazu.</p>
        {onClearSearch && (
          <Button variant="ghost" onClick={onClearSearch}>
            Smazat hledání
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={s.layout}>
      {/* LEFT — preset list */}
      <div className={s.list} role="listbox" aria-label="Seznam presetů">
        {searchQuery && (
          <div className={s.searchBanner}>
            <span>{items.length} výsledků pro „{searchQuery}"</span>
            {onClearSearch && (
              <button
                type="button"
                className={s.clearBtn}
                onClick={onClearSearch}
              >
                Smazat
              </button>
            )}
          </div>
        )}
        {items.map((item) => {
          const isSelected = selected?.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`${s.row} ${isSelected ? s.rowSelected : ''}`}
              role="option"
              aria-selected={isSelected}
              onClick={() => setSelectedId(item.id)}
            >
              <span className={s.rowGlyph} aria-hidden>
                {item.glyph}
              </span>
              <span className={s.rowInfo}>
                <span className={s.rowName}>{item.displayName}</span>
                <span className={s.rowSub}>{item.subtitle}</span>
                <span className={s.rowMetrics}>
                  <span>🌡 {item.metrics.tempLabel}</span>
                  {item.metrics.humidityLabel && (
                    <span>💧 {item.metrics.humidityLabel}</span>
                  )}
                  {item.metrics.windLabel && (
                    <span>💨 {item.metrics.windLabel}</span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* RIGHT — preview detail */}
      {selected && (
        <div className={s.detail}>
          <div className={s.detailHead}>
            <span className={s.detailGlyph} aria-hidden>
              {selected.glyph}
            </span>
            <div>
              <div className={s.detailName}>{selected.displayName}</div>
              <div className={s.detailSub}>{selected.subtitle}</div>
            </div>
          </div>

          <div className={s.detailSection}>
            <div className={s.detailLabel}>▸ Popisek</div>
            <p className={s.detailText}>{selected.description}</p>
          </div>

          <div className={s.detailSection}>
            <div className={s.detailLabel}>▸ Náhled — 3 sample rolly</div>
            <div className={s.trialGrid}>
              {previews.map((p) => (
                <TrialCell
                  key={`${p.month.label}-${reRollSalt}`}
                  month={p.month}
                  result={p.result}
                />
              ))}
            </div>
          </div>

          <div className={s.detailActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReRollSalt((n) => n + 1)}
            >
              <RotateCcw size={14} aria-hidden /> Náhled znovu
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onApply(selected)}
            >
              <ArrowRight size={14} aria-hidden />{' '}
              {mode === 'repair' ? 'Aplikovat klimat' : 'Použít'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface TrialCellProps {
  month: TrialMonth;
  result: ReturnType<ReturnType<typeof usePreviewWeather>['previewWeather']>;
}

function TrialCell({ month, result }: TrialCellProps) {
  const glyph = result.weatherIcon || '🌤';
  const desc =
    result.isAnomaly && result.anomalyType
      ? anomalyLabel(result.anomalyType)
      : describeWeather(result.weatherType);

  return (
    <div className={s.trialCell}>
      <div className={s.trialMonth}>{month.label}</div>
      <div className={s.trialGlyph}>{glyph}</div>
      <div className={s.trialTemp}>
        {Math.round(result.temperature)}°
      </div>
      <div className={s.trialDesc}>{desc}</div>
    </div>
  );
}

function anomalyLabel(type: 'heat_wave' | 'cold_snap' | 'severe_storm'): string {
  switch (type) {
    case 'heat_wave':
      return 'Vlna veder';
    case 'cold_snap':
      return 'Mrazivá vlna';
    case 'severe_storm':
      return 'Silná bouře';
  }
}

function describeWeather(type: string): string {
  switch (type) {
    case 'clear':
      return 'Slunečno';
    case 'cloudy':
      return 'Oblačno';
    case 'rain':
      return 'Déšť';
    case 'storm':
      return 'Bouřka';
    case 'snow':
      return 'Sníh';
    case 'fog':
      return 'Mlha';
    default:
      return '—';
  }
}
