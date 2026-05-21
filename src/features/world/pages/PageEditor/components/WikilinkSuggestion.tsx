import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { FileText } from 'lucide-react';
import type { PageDirectoryEntry } from '../../api/pages.types';
import s from './WikilinkSuggestion.module.css';

interface Props {
  items: PageDirectoryEntry[];
  command: (item: PageDirectoryEntry) => void;
}

export interface SuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

/**
 * 7.2g — Dropdown render pro `@tiptap/suggestion`. Šipky nahoru/dolů,
 * Enter vybere; Esc zavře (řeší suggestion sám).
 */
export const WikilinkSuggestion = forwardRef<SuggestionListRef, Props>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          const item = items[selectedIndex];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className={s.dropdown}>
          <p className={s.empty}>Žádné stránky neodpovídají</p>
        </div>
      );
    }

    return (
      <div className={s.dropdown}>
        <ul className={s.list}>
          {items.map((item, idx) => (
            <li key={item.slug}>
              <button
                type="button"
                className={`${s.item} ${idx === selectedIndex ? s.itemActive : ''}`}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => command(item)}
              >
                <FileText size={14} aria-hidden className={s.itemIcon} />
                <span className={s.itemTitle}>{item.title}</span>
                <span className={s.itemType}>{item.type}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  },
);

WikilinkSuggestion.displayName = 'WikilinkSuggestion';
