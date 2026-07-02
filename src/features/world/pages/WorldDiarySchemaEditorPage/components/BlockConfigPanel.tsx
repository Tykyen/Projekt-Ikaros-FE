import { useRef, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Input, Button } from '@/shared/ui';
import { useUploadImage, parseApiError } from '@/shared/api';
import type {
  DiarySchemaBlock,
  DiaryBlockType,
} from '../../api/diarySchema.types';
import { DIARY_BLOCK_TYPES } from '../../api/diarySchema.types';
import s from './DiarySchemaEditor.module.css';

interface Props {
  block: DiarySchemaBlock | undefined;
  readOnly?: boolean;
  onChange: (next: DiarySchemaBlock) => void;
  onDelete: () => void;
  /** Známé `key` v ostatních blocích — pro detekci duplicit při změně. */
  knownKeys?: Set<string>;
}

const TYPE_LABELS: Record<DiaryBlockType, string> = {
  stat: 'Statistika',
  number: 'Číslo',
  bar: 'Pruh (HP/Energie)',
  list: 'Výběr ze seznamu',
  text: 'Text (krátký)',
  textarea: 'Text (dlouhý)',
  image: 'Obrázek',
  relation: 'Vazba',
  formula: 'Vzorec',
};

/**
 * 8.5 — pravý panel editoru. Form fields závisí na `block.type`. Validace
 * jen vizuální (červené pole = duplicitní klíč nebo prázdný label); hard
 * validace v `schemaValidation.ts` při submit.
 */
export function BlockConfigPanel({
  block,
  readOnly,
  onChange,
  onDelete,
  knownKeys,
}: Props) {
  // Hooks vždy nahoře — pro `image` blok potřebujeme uploader.
  const uploadMut = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!block) {
    return (
      <div className={s.panel}>
        <div className={s.panelHeader}>Konfigurace</div>
        <div className={s.configEmpty}>Vyber blok pro úpravu</div>
      </div>
    );
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const r = await uploadMut.mutateAsync(file);
      setConfigField('imageUrl', r.url);
    } catch (err) {
      toast.error(parseApiError(err));
    }
    e.target.value = '';
  }

  function setField<K extends keyof DiarySchemaBlock>(
    key: K,
    value: DiarySchemaBlock[K],
  ) {
    if (!block) return;
    onChange({ ...block, [key]: value });
  }

  function setConfigField<K extends keyof NonNullable<DiarySchemaBlock['config']>>(
    key: K,
    value: NonNullable<DiarySchemaBlock['config']>[K],
  ) {
    if (!block) return;
    const config = { ...(block.config ?? {}), [key]: value };
    if (value === undefined || value === '') delete (config as Record<string, unknown>)[key];
    onChange({ ...block, config });
  }

  const isNumeric =
    block.type === 'stat' ||
    block.type === 'bar' ||
    block.type === 'number';
  const isList = block.type === 'list';
  const isBar = block.type === 'bar';
  const isImage = block.type === 'image';
  const isFormula = block.type === 'formula';

  const keyIsDuplicate =
    knownKeys && block.key !== '' && knownKeys.has(block.key);

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>Konfigurace</div>
      <div className={s.configForm}>
        <div className={s.fieldRow}>
          <label className={s.fieldLabel}>Label</label>
          <Input
            value={block.label}
            disabled={readOnly}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setField('label', e.target.value)
            }
          />
        </div>

        <div className={s.fieldRow}>
          <label className={s.fieldLabel}>Klíč (slug)</label>
          <Input
            value={block.key}
            disabled={readOnly}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setField('key', e.target.value.toLowerCase())
            }
            style={
              keyIsDuplicate
                ? { borderColor: 'var(--danger, #ef4444)' }
                : undefined
            }
          />
          {keyIsDuplicate && (
            <small style={{ color: 'var(--danger, #ef4444)' }}>
              Duplicitní klíč.
            </small>
          )}
        </div>

        <div className={s.fieldRow}>
          <label className={s.fieldLabel}>Typ</label>
          <select
            value={block.type}
            disabled={readOnly}
            onChange={(e) => setField('type', e.target.value as DiaryBlockType)}
          >
            {DIARY_BLOCK_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className={s.fieldRow}>
          <label className={s.fieldLabel}>Popis (volitelný)</label>
          <Input
            value={block.config?.description ?? ''}
            disabled={readOnly}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setConfigField('description', e.target.value)
            }
          />
        </div>

        {isNumeric && (
          <div className={s.minMaxGrid}>
            <div className={s.fieldRow}>
              <label className={s.fieldLabel}>Min</label>
              <Input
                type="number"
                value={block.config?.minValue ?? ''}
                disabled={readOnly}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setConfigField(
                    'minValue',
                    e.target.value === '' ? undefined : Number(e.target.value),
                  )
                }
              />
            </div>
            <div className={s.fieldRow}>
              <label className={s.fieldLabel}>Max</label>
              <Input
                type="number"
                value={block.config?.maxValue ?? ''}
                disabled={readOnly}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setConfigField(
                    'maxValue',
                    e.target.value === '' ? undefined : Number(e.target.value),
                  )
                }
              />
            </div>
          </div>
        )}

        {isBar && (
          <div className={s.fieldRow}>
            <label className={s.fieldLabel}>Barva</label>
            <Input
              type="color"
              value={block.config?.color ?? '#a855f7'}
              disabled={readOnly}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setConfigField('color', e.target.value)
              }
            />
          </div>
        )}

        {isList && (
          <div className={s.fieldRow}>
            <label className={s.fieldLabel}>Možnosti (≥ 2)</label>
            <div className={s.optionsList}>
              {(block.config?.options ?? []).map((opt, i) => (
                <div key={i} className={s.optionRow}>
                  <Input
                    value={opt}
                    disabled={readOnly}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const next = [...(block.config?.options ?? [])];
                      next[i] = e.target.value;
                      setConfigField('options', next);
                    }}
                  />
                  <button
                    type="button"
                    className={s.removeOptionBtn}
                    disabled={readOnly}
                    aria-label="Odebrat možnost"
                    onClick={() => {
                      const next = (block.config?.options ?? []).filter(
                        (_, j) => j !== i,
                      );
                      setConfigField('options', next);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setConfigField('options', [
                      ...(block.config?.options ?? []),
                      `Možnost ${(block.config?.options?.length ?? 0) + 1}`,
                    ])
                  }
                >
                  + Přidat možnost
                </Button>
              )}
            </div>
          </div>
        )}

        {isImage && (
          <div className={s.fieldRow}>
            <label className={s.fieldLabel}>Výchozí obrázek</label>
            {block.config?.imageUrl ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <img
                  src={block.config.imageUrl}
                  alt={block.label}
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: 'cover',
                    borderRadius: 6,
                    border: '1px solid var(--border, rgba(255,255,255,0.1))',
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={readOnly}
                  onClick={() => setConfigField('imageUrl', undefined)}
                >
                  Odebrat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={readOnly || uploadMut.isPending}
                  loading={uploadMut.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  Změnit
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                disabled={readOnly || uploadMut.isPending}
                loading={uploadMut.isPending}
                onClick={() => fileRef.current?.click()}
              >
                Nahrát obrázek
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <small style={{ color: 'var(--text-muted, rgba(255,255,255,0.5))' }}>
              Defaultní obrázek pro všechny postavy. Postava ho může individuálně přepsat.
            </small>
          </div>
        )}

        {isFormula && (
          <div className={s.fieldRow}>
            <label className={s.fieldLabel}>Vzorec</label>
            <Input
              value={block.config?.expression ?? ''}
              disabled={readOnly}
              placeholder="např. hp / hp_max * 100"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setConfigField('expression', e.target.value || undefined)
              }
            />
            <small
              style={{ color: 'var(--text-muted, rgba(255,255,255,0.5))' }}
            >
              Počítá z klíčů číselných bloků (statistika / číslo / pruh).
              Operátory + − * / a závorky. Hodnota se jen zobrazuje, nedá se
              ručně přepsat.
            </small>
          </div>
        )}

        <div className={s.fieldRow}>
          <label className={s.fieldLabel}>Sekce (volitelná)</label>
          <Input
            value={block.config?.layoutArea ?? ''}
            disabled={readOnly}
            placeholder="např. statistiky"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setConfigField('layoutArea', e.target.value || undefined)
            }
          />
        </div>

        {!readOnly && (
          <button type="button" className={s.dangerBtn} onClick={onDelete}>
            Smazat blok
          </button>
        )}
      </div>
    </div>
  );
}
