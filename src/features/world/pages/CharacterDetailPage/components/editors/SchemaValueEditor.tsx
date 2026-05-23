import { useRef } from 'react';
import { toast } from 'sonner';
import { useUploadImage, parseApiError } from '@/shared/api';
import { Button } from '@/shared/ui';
import s from './editors.module.css';

interface Props {
  /** Typ bloku schématu — `stat` | `bar` | `list` | `text` | `image` | … */
  type: string;
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  maxValue?: number;
  minValue?: number;
  /** D-DIARY-3 — defaultní URL pro `image` blok (ze schématu). Per-postava
   *  override se ukládá do `value`; pokud chybí, použije se `defaultImageUrl`. */
  defaultImageUrl?: string;
}

/**
 * 8.1 + 8.5 — Editor hodnoty jednoho bloku schématu. Vstup se mění podle
 * `type`. `image` typ (D-DIARY-3) podporuje upload + reset na default.
 */
export function SchemaValueEditor({
  type,
  label,
  value,
  onChange,
  maxValue,
  minValue,
  defaultImageUrl,
}: Props) {
  const id = `schema-${label}`;
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMut = useUploadImage();

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const r = await uploadMut.mutateAsync(file);
      onChange(r.url);
    } catch (err) {
      toast.error(parseApiError(err));
    }
    e.target.value = '';
  }

  function renderInput() {
    if (type === 'image') {
      const currentSrc =
        (typeof value === 'string' && value ? value : defaultImageUrl) || '';
      const hasOverride = typeof value === 'string' && value !== '';
      return (
        <div className={s.imageRow}>
          {currentSrc ? (
            <img src={currentSrc} alt={label} className={s.imagePreview} />
          ) : (
            <div className={s.imagePlaceholder}>—</div>
          )}
          <div className={s.imageActions}>
            <Button
              variant="secondary"
              size="sm"
              loading={uploadMut.isPending}
              onClick={() => fileRef.current?.click()}
            >
              {hasOverride ? 'Změnit' : 'Nahrát vlastní'}
            </Button>
            {hasOverride && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(undefined)}
              >
                Vrátit výchozí
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
          </div>
        </div>
      );
    }
    if (type === 'stat' || type === 'bar') {
      return (
        <input
          id={id}
          className={s.field}
          type="number"
          max={maxValue}
          min={minValue}
          value={typeof value === 'number' ? value : (value as string) ?? ''}
          onChange={(e) =>
            onChange(e.target.value === '' ? undefined : Number(e.target.value))
          }
        />
      );
    }
    if (type === 'list') {
      const text = Array.isArray(value) ? value.join('\n') : '';
      return (
        <textarea
          id={id}
          className={s.field}
          rows={3}
          placeholder="Jedna položka na řádek"
          value={text}
          onChange={(e) =>
            onChange(
              e.target.value
                .split('\n')
                .map((v) => v.trim())
                .filter(Boolean),
            )
          }
        />
      );
    }
    return (
      <input
        id={id}
        className={s.field}
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    );
  }

  return (
    <div className={s.stack}>
      <label className={s.label} htmlFor={id}>
        {label}
        {type === 'bar' && typeof maxValue === 'number' && ` / ${maxValue}`}
      </label>
      {renderInput()}
    </div>
  );
}
