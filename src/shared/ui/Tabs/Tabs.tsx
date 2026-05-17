import { type KeyboardEvent, type ReactNode, useRef } from 'react';
import clsx from 'clsx';
import s from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Panel aktivního tabu. */
  children: ReactNode;
  /** `vertical` (default) — rejstřík vlevo; `horizontal` — lišta nad obsahem. */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * 5.3 — generická tabová komponenta. ARIA `tablist`/`tab`/`tabpanel`,
 * roving tabindex + klávesová navigace (šipky dle orientace).
 * Na mobilu (≤ 768) se vertikální rejstřík mění na scrollovatelnou lištu.
 */
export function Tabs({
  items,
  activeId,
  onChange,
  children,
  orientation = 'vertical',
}: TabsProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function handleKey(e: KeyboardEvent, idx: number) {
    const next = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const prev = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    let targetIdx: number | null = null;
    if (e.key === next) targetIdx = (idx + 1) % items.length;
    else if (e.key === prev)
      targetIdx = (idx - 1 + items.length) % items.length;
    if (targetIdx !== null) {
      e.preventDefault();
      const target = items[targetIdx];
      onChange(target.id);
      tabRefs.current[target.id]?.focus();
    }
  }

  return (
    <div className={clsx(s.wrap, s[orientation])}>
      <div
        role="tablist"
        aria-orientation={orientation}
        className={s.tablist}
      >
        {items.map((item, idx) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[item.id] = el;
              }}
              role="tab"
              type="button"
              id={`tab-${item.id}`}
              aria-selected={active}
              aria-controls={`panel-${item.id}`}
              tabIndex={active ? 0 : -1}
              className={clsx(s.tab, active && s.active)}
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => handleKey(e, idx)}
            >
              {item.icon && (
                <span className={s.icon} aria-hidden>
                  {item.icon}
                </span>
              )}
              <span className={s.label}>{item.label}</span>
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`panel-${activeId}`}
        aria-labelledby={`tab-${activeId}`}
        className={s.panel}
      >
        {children}
      </div>
    </div>
  );
}
