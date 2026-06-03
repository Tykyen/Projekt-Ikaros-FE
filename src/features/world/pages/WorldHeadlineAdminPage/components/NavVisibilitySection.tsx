import { Eye, EyeOff } from 'lucide-react';
import { SettingsPanel } from '@/features/world/pages/WorldSettingsPage/components/SettingsPanel';
import {
  HIDEABLE_NAV_ITEMS,
  type HideableNavItem,
} from '@/features/world/lib/worldNavConfig';
import s from './NavVisibilitySection.module.css';

const GROUP_LABELS: Record<HideableNavItem['group'], string> = {
  svet: 'Skupina „Svět"',
  hra: 'Skupina „Hra"',
  top: 'Hlavní lišta',
};

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

/**
 * 12.2 — controlled verze viditelnosti modulů (přesun z `NavVisibilityTab`).
 * Esenciální položky (Přehled/Stránky/Novinky/Pravidla) nejsou ve whitelistu,
 * takže je skrýt nelze.
 */
export function NavVisibilitySection({ value, onChange }: Props) {
  const hiddenSet = new Set(value);
  const groups: HideableNavItem['group'][] = ['svet', 'hra', 'top'];

  function toggle(id: string) {
    onChange(
      value.includes(id) ? value.filter((x) => x !== id) : [...value, id],
    );
  }

  return (
    <SettingsPanel
      title="Viditelnost modulů"
      description="Skryj v horní liště moduly, které tvůj svět nepoužívá. Esenciální položky (Přehled, Stránky, Novinky, Pravidla) zůstávají vždy. Skrytí se týká jen navigace — přes URL je stránka stále dostupná."
      action={
        value.length > 0 ? (
          <button
            type="button"
            className={s.resetBtn}
            onClick={() => onChange([])}
          >
            Zobrazit vše
          </button>
        ) : undefined
      }
    >
      <div className={s.container}>
        {groups.map((group) => {
          const items = HIDEABLE_NAV_ITEMS.filter((i) => i.group === group);
          if (items.length === 0) return null;
          return (
            <fieldset key={group} className={s.group}>
              <legend className={s.groupLabel}>{GROUP_LABELS[group]}</legend>
              <ul className={s.list}>
                {items.map((item) => {
                  const isHidden = hiddenSet.has(item.id);
                  return (
                    <li key={item.id}>
                      <label
                        className={`${s.row} ${isHidden ? s.rowHidden : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={!isHidden}
                          onChange={() => toggle(item.id)}
                          aria-label={`${item.label} — ${isHidden ? 'zobrazit' : 'skrýt'}`}
                        />
                        <span className={s.icon} aria-hidden>
                          {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        </span>
                        <span className={s.label}>{item.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          );
        })}
      </div>
    </SettingsPanel>
  );
}
