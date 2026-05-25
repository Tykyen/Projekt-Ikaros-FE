import clsx from 'clsx';
import { Maximize2, Fullscreen } from 'lucide-react';
import type { ImageFit } from '@/shared/lib/imageStyle';
import s from './ImageFitToggle.module.css';

interface Props {
  /** Aktuální fit. `null` = výchozí cover. */
  value: ImageFit | null;
  onChange: (fit: ImageFit) => void;
  disabled?: boolean;
}

/**
 * 9.5+ — toggle 2 buttonů Vyplnit (cover) / Vidět celý (contain).
 * Sdílený mezi IkarosEvent / GameEvent / WorldNews modaly.
 *
 * Cover (default) — obrázek vyplní celou plochu, můžou se oříznout okraje.
 * Contain — obrázek se vejde celý, můžou vzniknout pruhy.
 */
export function ImageFitToggle({ value, onChange, disabled = false }: Props) {
  const current = value ?? 'cover';
  return (
    <div className={s.wrap} role="group" aria-label="Režim zobrazení obrázku">
      <button
        type="button"
        className={clsx(s.btn, current === 'cover' && s.btnActive)}
        onClick={() => onChange('cover')}
        disabled={disabled}
        aria-pressed={current === 'cover'}
        title="Vyplnit celou plochu (může oříznout okraje)"
      >
        <Maximize2 size={14} aria-hidden="true" />
        <span>Vyplnit</span>
      </button>
      <button
        type="button"
        className={clsx(s.btn, current === 'contain' && s.btnActive)}
        onClick={() => onChange('contain')}
        disabled={disabled}
        aria-pressed={current === 'contain'}
        title="Vidět celý obrázek (může vzniknout pruh)"
      >
        <Fullscreen size={14} aria-hidden="true" />
        <span>Vidět celý</span>
      </button>
    </div>
  );
}
