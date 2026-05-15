import { useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import type { IkarosNews, IkarosNewsType } from '@/shared/types';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
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

interface NewsCardProps {
  news: IkarosNews;
  /** Volitelně rozbalená hned po mountu (např. deep-link na stránce Novinky). */
  defaultExpanded?: boolean;
  /** Spec 3.1b — admin akce (edit/archiv/smazat). Render mimo klikací hlavičku. */
  adminSlot?: ReactNode;
}

/**
 * Spec 3.1b — rozbalovací karta novinky. Sbaleno = nadpis (obarvený dle typu)
 * + štítek typu + relativní datum. Po kliknutí se rozbalí obrázek, plný
 * rich-text obsah a autor za absolutním datem. Sdílená dashboardem i
 * stránkou `/ikaros/novinky`.
 */
export function NewsCard({
  news,
  defaultExpanded = false,
  adminSlot,
}: NewsCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  // Legacy fallback — starší novinky bez `type` se chovají jako 'info'.
  const type: IkarosNewsType = news.type ?? 'info';

  function toggle() {
    setExpanded((v) => !v);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  }

  return (
    <article className={s.card} data-type={type} data-expanded={expanded}>
      <button
        type="button"
        className={s.header}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span className={s.titleRow}>
          <span className={s.title}>{news.title}</span>
          <span className={s.badge}>{TYPE_LABEL[type]}</span>
        </span>
        <span className={s.date}>
          {formatRelativePast(news.createdAtUtc)}
        </span>
      </button>

      {adminSlot && <div className={s.adminBar}>{adminSlot}</div>}

      {expanded && (
        <div className={s.body}>
          {news.imageUrl && (
            <img
              className={s.image}
              src={news.imageUrl}
              alt=""
              loading="lazy"
            />
          )}
          <RichTextEditor
            value={news.content}
            readOnly
            className={s.content}
            ariaLabel={`Obsah novinky ${news.title}`}
          />
          <p className={s.author}>
            — {news.authorName} · {formatAbsoluteDate(news.createdAtUtc)}
          </p>
        </div>
      )}
    </article>
  );
}
