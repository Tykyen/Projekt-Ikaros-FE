import { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { fromAbsDay, toAbsDay } from '@/shared/lib/calendarEngine';
import type { CalendarConfig } from '@/shared/lib/calendarEngine';
import { formatFantasyDate } from '../lib/formatFantasyDate';
import s from './DateConversionPopup.module.css';

interface Props {
  /** Aktivní timeline kalendář (zdroj data). */
  primaryConfig: CalendarConfig;
  /** Všechny kalendáře světa — popup zobrazí každý kromě primárního. */
  allConfigs: CalendarConfig[];
  /** Datum v primárním kalendáři (1-based month, mirror BE shape). */
  date: { year: number; month: number; day: number; hour?: number | null };
  /** Pozice tlačítka pro popover anchor. */
  anchorRect: DOMRect | null;
  onClose: () => void;
}

/**
 * 9.3-F-I — Inline konvertor datumu mezi kalendáři světa (Q3).
 *
 * Klient-side klikací popup nad timeline kartou. Konverze přes
 * `globalAbsDay = primaryConfig.epochOffset + toAbsDay(date, primaryConfig)`
 * → `fromAbsDay(globalAbsDay - other.epochOffset, other)` pro každý jiný
 * config světa.
 *
 * Žádná BE změna — engine + presety epochOffsety stačí.
 */
export function DateConversionPopup({
  primaryConfig,
  allConfigs,
  date,
  anchorRect,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Globální absDay = primary epoch + local absDay
  const globalAbsDay = useMemo(() => {
    const localAbs = toAbsDay(
      { year: date.year, monthIndex: date.month - 1, day: date.day },
      primaryConfig,
    );
    return primaryConfig.epochOffset + localAbs;
  }, [date, primaryConfig]);

  const conversions = useMemo(() => {
    return allConfigs
      .filter((c) => c.slug !== primaryConfig.slug)
      .map((other) => {
        const localAbs = globalAbsDay - other.epochOffset;
        const fantasy = fromAbsDay(localAbs, other);
        return {
          slug: other.slug,
          name: other.name,
          label: formatFantasyDate(
            {
              year: fantasy.year,
              month: fantasy.monthIndex + 1,
              day: fantasy.day,
              hour: date.hour, // čas se nemění napříč kalendáři (jen rok/měsíc/den)
            },
            other,
          ),
        };
      });
  }, [allConfigs, primaryConfig.slug, globalAbsDay, date.hour]);

  // Klik mimo + Esc zavírání
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', handleKey);
    // Delay click listener, ať se klik na trigger button nezachytí.
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
      clearTimeout(t);
    };
  }, [onClose]);

  // Pozice popoveru — pod anchorem nebo center fallback
  const style: React.CSSProperties = anchorRect
    ? {
        top: anchorRect.bottom + 8,
        left: Math.max(
          8,
          Math.min(
            anchorRect.left,
            window.innerWidth - 360 - 8,
          ),
        ),
      }
    : {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };

  const primaryLabel = formatFantasyDate(date, primaryConfig);

  return (
    <div
      ref={ref}
      className={s.popup}
      style={style}
      role="dialog"
      aria-label="Převody datumu mezi kalendáři"
    >
      <header className={s.header}>
        <span className={s.title}>Převod datumu</span>
        <button
          type="button"
          className={s.closeBtn}
          onClick={onClose}
          aria-label="Zavřít"
        >
          <X size={16} aria-hidden />
        </button>
      </header>
      <div className={s.primary}>
        <span className={s.primaryLabel}>{primaryConfig.name}:</span>
        <span className={s.primaryValue}>{primaryLabel}</span>
      </div>
      {conversions.length === 0 ? (
        <p className={s.empty}>
          Svět nemá žádný další kalendář pro převod.
        </p>
      ) : (
        <ul className={s.list}>
          {conversions.map((c) => (
            <li key={c.slug} className={s.row}>
              <span className={s.rowName}>{c.name}</span>
              <span className={s.rowValue}>{c.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
