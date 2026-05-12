import clsx from 'clsx';
import type { UsersPageTab } from './usersPageTabs.helpers';
import s from './UsersPageTabs.module.css';

const TAB_LABELS: Record<UsersPageTab, string> = {
  pratele: 'Přátelé',
  uzivatele: 'Uživatelé',
  zpracovat: 'Zpracovat',
  audit: 'Audit',
};

interface UsersPageTabsProps {
  active: UsersPageTab;
  visible: UsersPageTab[];
  /** Badge counts per tab (zatím jen Zpracovat). */
  badges?: Partial<Record<UsersPageTab, number>>;
  onChange: (next: UsersPageTab) => void;
}

export function UsersPageTabs({
  active,
  visible,
  badges,
  onChange,
}: UsersPageTabsProps) {
  return (
    <div className={s.tabs} role="tablist" aria-label="Sekce stránky Uživatelé">
      {visible.map((tab) => {
        const isActive = active === tab;
        const badge = badges?.[tab] ?? 0;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={clsx(s.tab, isActive && s.tabActive)}
            onClick={() => onChange(tab)}
          >
            {TAB_LABELS[tab]}
            {badge > 0 && (
              <span className={s.tabBadge} aria-label={`${badge} čekajících`}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
