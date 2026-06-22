import { useState } from 'react';
import type { ReactNode } from 'react';
import type { IkarosNews, IkarosNewsType } from '@/shared/types';
import { NewsPreviewCard, NewsDetailModal } from '@/shared/ui';
import type { NewsCardVM, NewsTone } from '@/shared/ui';
import {
  formatRelativePast,
  formatAbsoluteDate,
} from '@/features/ikaros/lib/formatRelativePast';
import s from './NewsCard.module.css';

const TYPE_LABEL: Record<IkarosNewsType, string> = {
  info: 'Informace',
  warning: 'Upozornění',
  system: 'Systémová',
};

const TYPE_TONE: Record<IkarosNewsType, NewsTone> = {
  info: 'info',
  warning: 'warning',
  system: 'system',
};

interface NewsCardProps {
  news: IkarosNews;
  /** Spec 3.1b — admin akce (edit/archiv/smazat). Render nad médiem karty. */
  adminSlot?: ReactNode;
}

/**
 * Spec 3.1b → sjednocení (2026-06-22): adaptér globální novinky na sdílenou
 * preview-kartu + detail-modal. Klik na kartu otevře okno s plným obsahem.
 */
export function NewsCard({ news, adminSlot }: NewsCardProps) {
  const [open, setOpen] = useState(false);
  // Legacy fallback — starší novinky bez `type` se chovají jako 'info'.
  const type: IkarosNewsType = news.type ?? 'info';

  const vm: NewsCardVM = {
    id: news.id,
    title: news.title,
    contentHtml: news.content,
    tone: TYPE_TONE[type],
    typeLabel: TYPE_LABEL[type],
    image: news.imageUrl ? { url: news.imageUrl } : null,
    dateChipLabel: formatRelativePast(news.createdAtUtc),
    fullDateLabel: formatAbsoluteDate(news.createdAtUtc),
    footer: (
      <p className={s.author}>
        — {news.authorName} · {formatAbsoluteDate(news.createdAtUtc)}
      </p>
    ),
  };

  return (
    <>
      <NewsPreviewCard
        vm={vm}
        onOpen={() => setOpen(true)}
        adminSlot={adminSlot}
      />
      <NewsDetailModal vm={vm} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
