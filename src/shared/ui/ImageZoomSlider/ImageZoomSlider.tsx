import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import s from './ImageZoomSlider.module.css';

interface Props {
  /** Aktuální zoom v procentech (100–400). `null` = výchozí 100. */
  value: number | null;
  onChange: (zoom: number) => void;
  /** Reset na default 100. */
  onReset: () => void;
  /** Disabled pokud není obrázek nebo když probíhá mutace. */
  disabled?: boolean;
}

const MIN = 100;
const MAX = 400;
const DEFAULT = 100;

/**
 * 9.5+ — slider pro zoom obrázku v editor modálech (IkarosEvent / GameEvent /
 * WorldNews). Sdílený, reuse pattern pro budoucí entity s hero obrázkem.
 *
 * Pod 100 % automatic switch karty na `object-fit: contain` (vidět celý);
 * nad 100 % `object-fit: cover` + `transform: scale`. Viz `shared/lib/imageStyle.ts`.
 */
export function ImageZoomSlider({
  value,
  onChange,
  onReset,
  disabled = false,
}: Props) {
  const current = value ?? DEFAULT;
  const isDefault = current === DEFAULT;

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <ZoomOut size={14} aria-hidden="true" className={s.icon} />
        <input
          type="range"
          className={s.slider}
          min={MIN}
          max={MAX}
          step={5}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          aria-label="Přiblížení obrázku"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={current}
        />
        <ZoomIn size={14} aria-hidden="true" className={s.icon} />
        <span className={s.value} aria-live="polite">
          {current} %
        </span>
        {!isDefault && (
          <button
            type="button"
            className={s.resetBtn}
            onClick={onReset}
            disabled={disabled}
            aria-label="Resetovat na 100 %"
            title="Reset na 100 %"
          >
            <RotateCcw size={12} aria-hidden="true" />
          </button>
        )}
      </div>
      <span className={s.hint}>
        {current === 100
          ? 'Standardní velikost.'
          : 'Přiblíženo — vidíš detail.'}
      </span>
    </div>
  );
}
