import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { SettingsPanel } from '@/features/world/pages/WorldSettingsPage/components/SettingsPanel';
import type { LastInfoDraft } from '../WorldHeadlineAdminPage';
import s from './LastInfoSection.module.css';

const MAX = 280;

interface Props {
  value: LastInfoDraft | null;
  onChange: (next: LastInfoDraft | null) => void;
}

/**
 * 12.2 — „Last info" box: krátké oznámení PJ (max 280 znaků). Zobrazí se členům
 * jako proužek pod hlavičkou světa. `null` = nenastaveno.
 */
export function LastInfoSection({ value, onChange }: Props) {
  return (
    <SettingsPanel
      title={'„Last info" box'}
      description="Krátké oznámení pro členy světa (např. termín sezení). Zobrazí se jako proužek pod hlavičkou; člen ho může zavřít, ale po změně textu se objeví znovu."
      action={
        value === null ? (
          <button
            type="button"
            className={s.addBtn}
            onClick={() => onChange({ text: '', visible: true })}
          >
            <Plus size={14} /> Přidat oznámení
          </button>
        ) : (
          <button
            type="button"
            className={s.deleteBtn}
            onClick={() => onChange(null)}
            title="Odebrat oznámení"
          >
            <Trash2 size={14} /> Odebrat
          </button>
        )
      }
    >
      {value === null ? (
        <p className={s.empty}>Žádné oznámení není nastaveno.</p>
      ) : (
        <div className={s.body}>
          <label className={s.toggle}>
            <input
              type="checkbox"
              checked={value.visible}
              onChange={(e) =>
                onChange({ ...value, visible: e.target.checked })
              }
            />
            <span className={s.toggleIcon} aria-hidden>
              {value.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </span>
            <span>{value.visible ? 'Zobrazeno členům' : 'Skryto'}</span>
          </label>
          <textarea
            className={s.textarea}
            value={value.text}
            maxLength={MAX}
            rows={3}
            placeholder="Např. Příští sezení v pátek 20:00."
            onChange={(e) =>
              onChange({ ...value, text: e.target.value })
            }
            aria-label="Text oznámení"
          />
          <div className={s.counter}>
            {value.text.length} / {MAX}
          </div>
        </div>
      )}
    </SettingsPanel>
  );
}
