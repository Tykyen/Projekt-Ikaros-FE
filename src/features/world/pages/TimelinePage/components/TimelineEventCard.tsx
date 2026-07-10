import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  FileText,
  MoreVertical,
  Pencil,
  Repeat,
  Trash2,
} from 'lucide-react';
import { KebabMenu } from '@/shared/ui';
import type { KebabMenuItem } from '@/shared/ui';
import { usePagesDirectory } from '@/features/world/pages/api/usePagesDirectory';
import type { CalendarConfig } from '@/shared/lib/calendarEngine';
import { formatFantasyDate } from '../lib/formatFantasyDate';
import { CelestialChip } from './CelestialChip';
import { DateConversionPopup } from './DateConversionPopup';
import type { TimelineEventResponse } from '../api/types';
import s from './TimelineEventCard.module.css';

interface Props {
  event: TimelineEventResponse;
  config: CalendarConfig | null;
  /** 9.3-F-I — všechny calendar configs světa pro DateConversionPopup. */
  allConfigs: CalendarConfig[];
  worldId: string;
  worldSlug: string;
  canManage: boolean;
  side?: 'left' | 'right';
  onEdit: () => void;
  onDelete: () => void;
  onLightbox: () => void;
}

const MAX_VISIBLE_CHIPS = 3;

export function TimelineEventCard({
  event,
  config,
  allConfigs,
  worldId,
  worldSlug,
  canManage,
  side,
  onEdit,
  onDelete,
  onLightbox,
}: Props) {
  const { data: pages } = usePagesDirectory(worldId);
  const [imgError, setImgError] = useState(false);
  const [kebabOpen, setKebabOpen] = useState(false);
  const [kebabAnchor, setKebabAnchor] = useState<HTMLElement | null>(null);
  // 9.3-F-I — DateConversionPopup state
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertAnchorRect, setConvertAnchorRect] = useState<DOMRect | null>(
    null,
  );
  const showConvertBtn = allConfigs.length > 1 && !!config;

  const dateLabel = formatFantasyDate(
    {
      year: event.year,
      month: event.month,
      day: event.day,
      hour: event.hour,
    },
    config,
  );

  const linkedPage = event.pageSlug
    ? pages?.find((p) => p.slug === event.pageSlug)
    : undefined;
  const pageBroken = event.pageSlug !== null && pages !== undefined && !linkedPage;

  const visibleChips = event.celestialStates.slice(0, MAX_VISIBLE_CHIPS);
  const hiddenCount = event.celestialStates.length - visibleChips.length;

  const kebabItems: KebabMenuItem[] = [
    {
      key: 'edit',
      label: 'Upravit',
      icon: <Pencil size={14} aria-hidden />,
      onClick: () => {
        setKebabOpen(false);
        onEdit();
      },
    },
    {
      key: 'delete',
      label: 'Smazat',
      variant: 'danger',
      icon: <Trash2 size={14} aria-hidden />,
      onClick: () => {
        setKebabOpen(false);
        onDelete();
      },
    },
  ];

  const focalX = event.imageFocalX ?? 50;
  const focalY = event.imageFocalY ?? 50;
  const showImage = !!event.imageUrl && !imgError;

  return (
    <article
      className={s.card}
      data-side={side ?? 'right'}
      aria-labelledby={`tle-${event.id}`}
    >
      <header className={s.header}>
        <div className={s.meta}>
          <span className={s.dateChip}>{dateLabel}</span>
          {showConvertBtn && (
            <button
              type="button"
              className={s.convertBtn}
              onClick={(e) => {
                setConvertAnchorRect(
                  (e.currentTarget as HTMLElement).getBoundingClientRect(),
                );
                setConvertOpen(true);
              }}
              aria-label="Převést datum do jiného kalendáře"
              title="Převést datum do jiného kalendáře"
            >
              <Repeat size={12} aria-hidden />
            </button>
          )}
          {visibleChips.length > 0 && (
            <div className={s.celestials}>
              {visibleChips.map((state) => (
                <CelestialChip key={state.bodyId} state={state} />
              ))}
              {hiddenCount > 0 && (
                <span
                  className={s.moreCount}
                  title={`+${hiddenCount} dalších těles`}
                >
                  +{hiddenCount}
                </span>
              )}
            </div>
          )}
        </div>
        {canManage && (
          <button
            ref={setKebabAnchor}
            type="button"
            className={s.kebabBtn}
            aria-label="Akce s událostí"
            aria-haspopup="menu"
            aria-expanded={kebabOpen}
            onClick={() => setKebabOpen((v) => !v)}
          >
            <MoreVertical size={18} aria-hidden />
          </button>
        )}
      </header>

      <h3 id={`tle-${event.id}`} className={s.title}>
        {event.title}
      </h3>

      {showImage && (
        <button
          type="button"
          className={s.imageWrap}
          onClick={onLightbox}
          aria-label="Zvětšit obrázek"
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onError = fallback při selhání načtení obrázku, ne uživatelská interakce */}
          <img
            src={event.imageUrl ?? undefined}
            alt={event.title}
            style={{ objectPosition: `${focalX}% ${focalY}%` }}
            className={s.image}
            onError={() => setImgError(true)}
          />
        </button>
      )}

      {event.text && (
        <div
          className={s.text}
          dangerouslySetInnerHTML={{ __html: event.text }}
        />
      )}

      {(event.link || event.pageSlug) && (
        <footer className={s.links}>
          {event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noreferrer noopener"
              className={s.linkChip}
            >
              <ExternalLink size={14} aria-hidden /> Externí odkaz
            </a>
          )}
          {event.pageSlug && linkedPage && (
            <Link
              to={`/svet/${worldSlug}/${event.pageSlug}`}
              className={s.linkChip}
            >
              <FileText size={14} aria-hidden /> {linkedPage.title}
            </Link>
          )}
          {pageBroken && (
            <span
              className={`${s.linkChip} ${s.linkBroken}`}
              title="Stránka neexistuje (možná smazána)"
            >
              <FileText size={14} aria-hidden />{' '}
              <s>{event.pageSlug}</s>
            </span>
          )}
        </footer>
      )}

      {canManage && (
        <KebabMenu
          anchor={kebabAnchor}
          open={kebabOpen}
          onClose={() => setKebabOpen(false)}
          items={kebabItems}
          ariaLabel="Akce s touto událostí"
        />
      )}

      {convertOpen && config && (
        <DateConversionPopup
          primaryConfig={config}
          allConfigs={allConfigs}
          date={{
            year: event.year,
            month: event.month,
            day: event.day,
            hour: event.hour,
          }}
          anchorRect={convertAnchorRect}
          onClose={() => setConvertOpen(false)}
        />
      )}
    </article>
  );
}
