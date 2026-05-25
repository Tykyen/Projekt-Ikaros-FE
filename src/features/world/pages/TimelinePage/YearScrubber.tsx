import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { formatYearLabel } from './lib/formatFantasyDate';
import type { TimelineFilters, TimelineYearCount } from './api/types';
import s from './YearScrubber.module.css';

interface Props {
  yearCounts: TimelineYearCount[] | undefined;
  /** Pro fallback načtení roku, který není v aktuálních pages. */
  filters: TimelineFilters;
  onFiltersChange: (next: TimelineFilters) => void;
  /** Mobile drawer mode. */
  drawerOpen?: boolean;
  onDrawerClose?: () => void;
}

/**
 * 9.3 — Sidebar list roků s counts pro skip-to-year navigaci.
 *
 * Klik na rok:
 * 1. Pokud YearMarker daného roku existuje v DOM (= rok je v načtených
 *    pages), scrollIntoView.
 * 2. Jinak nastav `fromYear=year&toYear=year` filter → infinite query
 *    refetchne jen daný rok.
 *
 * Aktivní rok (scroll-aware): IntersectionObserver na viditelné `YearMarker`
 * elementy, poslední viditelný = highlight.
 */
export function YearScrubber({
  yearCounts,
  filters,
  onFiltersChange,
  drawerOpen,
  onDrawerClose,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeYear, setActiveYear] = useState<number | null>(null);

  const totalEvents = useMemo(
    () => yearCounts?.reduce((sum, yc) => sum + yc.count, 0) ?? 0,
    [yearCounts],
  );

  // IntersectionObserver na viditelné markery → highlight nejníže viditelný.
  useEffect(() => {
    const markers = document.querySelectorAll<HTMLElement>('[data-year]');
    if (markers.length === 0) return;
    const visibleYears = new Set<number>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const year = Number(
            (entry.target as HTMLElement).dataset.year ?? '',
          );
          if (Number.isNaN(year)) continue;
          if (entry.isIntersecting) {
            visibleYears.add(year);
          } else {
            visibleYears.delete(year);
          }
        }
        if (visibleYears.size > 0) {
          setActiveYear(Math.max(...visibleYears));
        }
      },
      { rootMargin: '-30% 0px -50% 0px' },
    );
    markers.forEach((m) => obs.observe(m));
    return () => obs.disconnect();
  }, [yearCounts]);

  function jumpToYear(year: number) {
    const target = document.querySelector<HTMLElement>(
      `[data-year="${year}"]`,
    );
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Rok není v načtených pages — refetch jen daný rok.
      onFiltersChange({ ...filters, fromYear: year, toYear: year });
    }
    if (onDrawerClose) onDrawerClose();
  }

  if (!yearCounts || yearCounts.length === 0) {
    return null;
  }

  const content = (
    <div className={s.inner} ref={containerRef}>
      <header className={s.header}>
        <span className={s.headerTitle}>Skok na rok</span>
        <span className={s.headerCount}>
          {totalEvents} {totalEvents === 1 ? 'událost' : 'událostí'}
        </span>
        {onDrawerClose && (
          <button
            type="button"
            className={s.closeBtn}
            onClick={onDrawerClose}
            aria-label="Zavřít panel"
          >
            <X size={18} aria-hidden />
          </button>
        )}
      </header>
      <ul className={s.list}>
        {yearCounts.map(({ year, count }) => (
          <li key={year}>
            <button
              type="button"
              className={`${s.yearBtn} ${activeYear === year ? s.yearBtnActive : ''}`}
              onClick={() => jumpToYear(year)}
            >
              <span className={s.yearLabel}>{formatYearLabel(year)}</span>
              <span className={s.yearCount}>{count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  // Desktop = sidebar (sticky), mobil = drawer overlay
  if (drawerOpen) {
    return (
      <>
        <div className={s.scrim} onClick={onDrawerClose} aria-hidden />
        <aside className={s.drawer} role="dialog" aria-label="Skok na rok">
          {content}
        </aside>
      </>
    );
  }

  return <aside className={s.sidebar}>{content}</aside>;
}
