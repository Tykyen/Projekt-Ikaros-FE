import { useMemo, useState } from 'react';
import { Search, X, EyeOff } from 'lucide-react';
import type { WorldMapPin } from '../types';
import { pinIcon, pinColor, DEAD_PIN_COLOR } from '../constants/pinAppearance';
import s from './viewer.module.css';

interface Props {
  pins: WorldMapPin[];
  deadIds: Set<string>;
  onSelect: (pin: WorldMapPin) => void;
  onClose: () => void;
}

/**
 * 16.5 — panel „Vlaječky": jediná cesta jak najít pin mezi ~100. Hledá podle
 * popisku, klik doskočí a zvýrazní pin na mapě.
 */
export function PinListPanel({ pins, deadIds, onSelect, onClose }: Props) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = query
      ? pins.filter((p) => p.label.toLowerCase().includes(query))
      : pins;
    return [...list].sort((a, b) => a.label.localeCompare(b.label, 'cs'));
  }, [pins, q]);

  return (
    <aside className={s.listPanel}>
      <div className={s.listHead}>
        <Search size={15} aria-hidden style={{ opacity: 0.6 }} />
        <input
          className={s.listSearch}
          type="search"
          value={q}
          placeholder={`Hledat vlaječku (${pins.length})…`}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          className={s.btn}
          style={{ padding: '6px 7px' }}
          onClick={onClose}
          aria-label="Zavřít seznam"
        >
          <X size={15} aria-hidden />
        </button>
      </div>
      <div className={s.listItems}>
        {filtered.length === 0 ? (
          <p className={s.listEmpty}>Žádná vlaječka neodpovídá.</p>
        ) : (
          filtered.map((p) => {
            const Icon = pinIcon(p.icon);
            const dead = deadIds.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                className={s.listItem}
                onClick={() => onSelect(p)}
              >
                <span
                  className={s.listMini}
                  style={
                    {
                      '--pin-c': dead ? DEAD_PIN_COLOR : pinColor(p.color),
                    } as React.CSSProperties
                  }
                >
                  <Icon size={12} aria-hidden />
                </span>
                <span className={s.listItemLabel}>{p.label}</span>
                {!p.isPublic && (
                  <EyeOff
                    size={13}
                    aria-hidden
                    className={s.listSecret}
                    style={{ flex: 'none' }}
                  />
                )}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
