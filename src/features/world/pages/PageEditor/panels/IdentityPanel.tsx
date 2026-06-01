import { FileText, AlertTriangle } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { HeroUploadCard } from '../components/HeroUploadCard';
import { ALL_PAGE_TYPES, type PageType } from '../../api/pages.types';
import s from './IdentityPanel.module.css';

interface Props {
  isEdit: boolean;
  title: string;
  type: PageType;
  imageUrl: string;
  bigImage: boolean;
  isWoodWide: boolean;
  order: number;
  /** Název existující stránky se stejným slugem (režim tvorby, kolize). */
  existingPageTitle?: string | null;
  onChange: (patch: Partial<{
    title: string;
    type: PageType;
    imageUrl: string;
    bigImage: boolean;
    isWoodWide: boolean;
    order: number;
  }>) => void;
  /** Volá se před `setField('type', …)` — parent rozhodne, zda otevřít TypeSwitchWarning. */
  onTypeChangeRequest: (next: PageType) => void;
}

/**
 * 7.2b → 8.5 — Identita stránky. Title, type, hero+bigImage, isWoodWide,
 * order.
 *
 * Slug (URL) se generuje automaticky z názvu (`useSlugAutoGen` v parentu)
 * a v UI se nezobrazuje — uživatel myslí v názvech, ne v URL.
 */
export function IdentityPanel({
  isEdit,
  title,
  type,
  imageUrl,
  bigImage,
  isWoodWide,
  existingPageTitle,
  onChange,
  onTypeChangeRequest,
}: Props) {
  return (
    <CollapsiblePanel
      title="Identita stránky"
      icon={<FileText size={18} aria-hidden />}
      defaultOpen
    >
      <div className={s.layout}>
        <div className={s.fields}>
          <div className={s.grid}>
            <label className={s.field}>
              <span className={s.label}>
                Název *
                {!isEdit && existingPageTitle && (
                  <span className={s.warning}>
                    <AlertTriangle size={12} aria-hidden /> Stránka „
                    {existingPageTitle}" už existuje
                  </span>
                )}
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Např. Hlavní město Aralion"
                maxLength={200}
                className={s.input}
                required
              />
            </label>

            <label className={s.field}>
              <span className={s.label}>Typ stránky *</span>
              <select
                value={type}
                onChange={(e) =>
                  onTypeChangeRequest(e.target.value as PageType)
                }
                className={s.select}
              >
                {ALL_PAGE_TYPES.map((t) => (
                  <option
                    key={t}
                    value={t}
                    title={
                      t === 'Lokace'
                        ? 'Místo (hospoda, město). NE postava — pro tokenu na taktické mapě vyber „Postava hráče" nebo „NPC".'
                        : undefined
                    }
                  >
                    {t}
                  </option>
                ))}
              </select>
              {type === 'Lokace' && (
                <small className={s.hint}>
                  ⚠ Lokace = místo, ne postava. Lokace se{' '}
                  <strong>nezobrazí</strong> v paletě postav na taktické mapě.
                </small>
              )}
            </label>
          </div>

          <div className={s.checkboxRow}>
            <label className={s.checkbox}>
              <input
                type="checkbox"
                checked={bigImage}
                onChange={(e) => onChange({ bigImage: e.target.checked })}
              />
              <span>
                <strong>Velký hero nahoře</strong>
                <small className={s.hint}>
                  Obrázek bude full-width nad obsahem místo malého v sidebaru.
                </small>
              </span>
            </label>

            <label className={s.checkbox}>
              <input
                type="checkbox"
                checked={isWoodWide}
                onChange={(e) => onChange({ isWoodWide: e.target.checked })}
              />
              <span>
                <strong>Wood-Wide</strong>
                <small className={s.hint}>
                  Označí stránku jako součást celosvětového lore (badge ve
                  vieweru).
                </small>
              </span>
            </label>
          </div>
        </div>

        <div className={s.heroCol}>
          <HeroUploadCard
            value={imageUrl}
            onChange={(url) => onChange({ imageUrl: url })}
          />
        </div>
      </div>
    </CollapsiblePanel>
  );
}
