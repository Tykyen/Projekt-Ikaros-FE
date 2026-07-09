import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { WorldNewsItem, WorldNewsType } from '@/shared/types';
import {
  KebabMenu,
  NewsPreviewCard,
  NewsDetailModal,
} from '@/shared/ui';
import type { KebabMenuItem, NewsCardVM, NewsTone } from '@/shared/ui';
import { ReportButton } from '@/shared/moderation';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { relativeEventDate } from '@/features/world/utils/relativeEventDate';
import { usePagesDirectory } from '@/features/world/pages/api/usePagesDirectory';
import { useCalendarConfigs } from '@/features/world/api/useCalendarConfigs';
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

const TYPE_LABEL: Record<WorldNewsType, string> = {
  info: 'Informace',
  alert: 'Důležité',
  system: 'Systém',
};

const TYPE_TONE: Record<WorldNewsType, NewsTone> = {
  info: 'info',
  alert: 'warning',
  system: 'system',
};

/**
 * 5.2 / 9.5 → sjednocení (2026-06-22): adaptér oznámení světa na sdílenou
 * preview-kartu + detail-modal. Drží doménové hooky (resolve interního odkazu
 * a fantasy data), složí `NewsCardVM` a předá ho prezentační vrstvě. Klik na
 * kartu otevře okno s plným obsahem; kebab akce sedí nad médiem.
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
  const { world } = useWorldContext();
  const [open, setOpen] = useState(false);
  const [kebabAnchor, setKebabAnchor] = useState<HTMLButtonElement | null>(
    null,
  );
  const [kebabOpen, setKebabOpen] = useState(false);

  const validDate = !Number.isNaN(new Date(news.date).getTime());
  const isArchived = !!news.archived;

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

  const realDateLabel = validDate
    ? new Date(news.date).toLocaleString('cs-CZ')
    : '';

  const footer = linkedPage ? (
    <Link to={`/svet/${worldSlug}/${linkedPage.slug}`} className={s.linkRow}>
      <FileText size={14} aria-hidden="true" />
      <span>{linkedPage.title} →</span>
    </Link>
  ) : news.link ? (
    <a
      href={news.link}
      className={s.linkRow}
      target="_blank"
      rel="noopener noreferrer"
    >
      <ExternalLink size={14} aria-hidden="true" />
      <span>Externí odkaz →</span>
    </a>
  ) : undefined;

  const vm: NewsCardVM = {
    id: news.id,
    title: news.title,
    contentHtml: news.content,
    tone: TYPE_TONE[news.type],
    typeLabel: TYPE_LABEL[news.type],
    image: news.imageUrl
      ? {
          url: news.imageUrl,
          focalX: news.imageFocalX,
          focalY: news.imageFocalY,
          zoom: news.imageZoom,
          fit: news.imageFit,
        }
      : null,
    dateChipLabel: fantasyLabel ?? (validDate ? relativeEventDate(news.date) : ''),
    dateChipTitle:
      fantasyLabel && validDate ? `Reálné: ${realDateLabel}` : undefined,
    fullDateLabel: fantasyLabel
      ? `${fantasyLabel}${realDateLabel ? ` · ${realDateLabel}` : ''}`
      : realDateLabel,
    footer,
    archived: isArchived,
  };

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

  const adminSlot = canManage ? (
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
  ) : undefined;

  return (
    <>
      <NewsPreviewCard
        vm={vm}
        onOpen={() => setOpen(true)}
        adminSlot={adminSlot}
      />
      <NewsDetailModal
        vm={vm}
        open={open}
        onClose={() => setOpen(false)}
        /* 20B — novinka nemá autora, odpovědný subjekt = svět. Bez targetAuthorId
           → viditelné všem členům (i PJ, který ji vytvořil). */
        reportSlot={
          <ReportButton
            targetType="world_news"
            targetId={news.id}
            targetSnapshot={news.title}
            targetAuthorName={world?.name ?? 'Svět'}
            worldId={news.worldId ?? worldId}
            targetUrl={`/svet/${worldSlug}/novinky`}
          />
        }
      />

      {canManage && (
        <KebabMenu
          anchor={kebabAnchor}
          open={kebabOpen}
          onClose={() => setKebabOpen(false)}
          items={kebabItems}
          ariaLabel="Akce s touto novinkou"
        />
      )}
    </>
  );
}
