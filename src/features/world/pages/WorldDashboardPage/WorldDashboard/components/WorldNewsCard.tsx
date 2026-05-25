import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Archive,
  ArchiveRestore,
  Bell,
  AlertTriangle,
  Settings,
  ExternalLink,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { WorldNewsItem } from '@/shared/types';
import { KebabMenu } from '@/shared/ui';
import type { KebabMenuItem } from '@/shared/ui';
import { relativeEventDate } from '@/features/world/utils/relativeEventDate';
import { usePagesDirectory } from '@/features/world/pages/api/usePagesDirectory';
import { useCalendarConfigs } from '@/features/world/api/useCalendarConfigs';
import { TypeChip } from '@/features/world/components/TypeChip/TypeChip';
import { getImageStyle } from '@/shared/lib/imageStyle';
import { formatFantasyDate } from '@/shared/lib/calendarEngine';
import s from './WorldNewsCard.module.css';

interface Props {
  news: WorldNewsItem;
  /** Smí uživatel novinku editovat/smazat (PomocnyPJ+ / globální admin). */
  canManage: boolean;
  /** Pro link na interní stránku (`/svet/<worldSlug>/<slug>`). */
  worldSlug: string;
  /** Pro page-link resolution (název stránky z slugu). */
  worldId: string;
  onEdit: () => void;
  onDelete: () => void;
  /** 5.5d — archivace/obnova; jen na stránce novinek. */
  onArchive?: () => void;
}

/** HTML obsah → plain text excerpt (3 řádky truncate v CSS). */
function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const FALLBACK_ICON = {
  info: Bell,
  alert: AlertTriangle,
  system: Settings,
} as const;

/**
 * 5.2 / 9.5 — karta oznámení světa.
 *
 * 9.5 refactor (2026-05-25): plnohodnotná karta (parita s GameEventCard).
 * 16:9 hero obrázek s focal point + TypeChip + interní link na stránku
 * (přes `linkPageSlug` resolved přes `usePagesDirectory`) nebo externí URL
 * (legacy `link`).
 */
export function WorldNewsCard({
  news,
  canManage,
  worldSlug,
  worldId,
  onEdit,
  onDelete,
  onArchive,
}: Props) {
  const [imageError, setImageError] = useState(false);
  const [kebabAnchor, setKebabAnchor] = useState<HTMLButtonElement | null>(
    null,
  );
  const [kebabOpen, setKebabOpen] = useState(false);

  const validDate = !Number.isNaN(new Date(news.date).getTime());
  const isArchived = !!news.archived;
  const showImage = news.imageUrl && !imageError;
  const FallbackIcon = FALLBACK_ICON[news.type];

  // Resolution page-link slug → title (cache sdílená napříč kartami)
  const pagesQ = usePagesDirectory(worldId);
  const linkedPage = news.linkPageSlug
    ? (pagesQ.data ?? []).find((p) => p.slug === news.linkPageSlug)
    : null;

  // 9.2e — fantasy datum preferováno před real-world. Resolve config přes slug.
  const calendarConfigsQ = useCalendarConfigs(worldId);
  const fantasyConfig = news.calendarConfigId
    ? (calendarConfigsQ.data ?? []).find(
        (c) => c.slug === news.calendarConfigId,
      )
    : null;
  const fantasyLabel =
    news.calendarDate && fantasyConfig
      ? formatFantasyDate(news.calendarDate, fantasyConfig)
      : null;

  const kebabItems: KebabMenuItem[] = [
    {
      key: 'edit',
      label: 'Upravit',
      icon: <Pencil size={16} aria-hidden="true" />,
      onClick: () => {
        setKebabOpen(false);
        onEdit();
      },
    },
    ...(onArchive
      ? [
          {
            key: 'archive',
            label: isArchived ? 'Obnovit z archivu' : 'Archivovat',
            icon: isArchived ? (
              <ArchiveRestore size={16} aria-hidden="true" />
            ) : (
              <Archive size={16} aria-hidden="true" />
            ),
            onClick: () => {
              setKebabOpen(false);
              onArchive();
            },
          },
        ]
      : []),
    {
      key: 'delete',
      label: 'Smazat',
      variant: 'danger' as const,
      icon: <Trash2 size={16} aria-hidden="true" />,
      onClick: () => {
        setKebabOpen(false);
        onDelete();
      },
    },
  ];

  return (
    <article
      className={clsx(s.card, isArchived && s.cardArchived)}
      data-elev="card"
      data-archived={isArchived ? 'true' : 'false'}
    >
      <div className={s.media}>
        {showImage ? (
          <img
            src={news.imageUrl!}
            alt=""
            className={s.image}
            style={getImageStyle(
              news.imageFocalX,
              news.imageFocalY,
              news.imageZoom,
              news.imageFit,
            )}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={s.imageFallback} aria-hidden="true">
            <FallbackIcon size={36} />
          </div>
        )}

        {canManage && (
          <button
            ref={setKebabAnchor}
            type="button"
            className={s.kebabBtn}
            aria-label="Akce"
            aria-haspopup="menu"
            aria-expanded={kebabOpen}
            onClick={() => setKebabOpen((v) => !v)}
          >
            <MoreVertical size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className={s.body}>
        <div className={s.meta}>
          <TypeChip type={news.type} size="sm" />
          {fantasyLabel ? (
            <span
              className={s.dateChip}
              title={
                validDate
                  ? `Reálné: ${new Date(news.date).toLocaleString('cs-CZ')}`
                  : undefined
              }
            >
              {fantasyLabel}
            </span>
          ) : (
            validDate && (
              <span className={s.dateChip}>
                {relativeEventDate(news.date)}
              </span>
            )
          )}
          {isArchived && (
            <span className={s.archivedChip} aria-label="Archivováno">
              archivováno
            </span>
          )}
        </div>

        <h3 className={s.title}>{news.title}</h3>

        <p className={s.excerpt}>{plainText(news.content)}</p>

        {linkedPage && (
          <Link
            to={`/svet/${worldSlug}/${linkedPage.slug}`}
            className={s.linkRow}
          >
            <FileText size={14} aria-hidden="true" />
            <span>{linkedPage.title} →</span>
          </Link>
        )}
        {!linkedPage && news.link && (
          <a
            href={news.link}
            className={s.linkRow}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={14} aria-hidden="true" />
            <span>Externí odkaz →</span>
          </a>
        )}
      </div>

      {canManage && (
        <KebabMenu
          anchor={kebabAnchor}
          open={kebabOpen}
          onClose={() => setKebabOpen(false)}
          items={kebabItems}
          ariaLabel="Akce s touto novinkou"
        />
      )}
    </article>
  );
}
