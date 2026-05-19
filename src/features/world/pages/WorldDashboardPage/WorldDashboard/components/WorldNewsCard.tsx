import clsx from 'clsx';
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react';
import type { WorldNewsItem } from '@/shared/types';
import { relativeEventDate } from '@/features/world/utils/relativeEventDate';
import s from './WorldNewsCard.module.css';

interface Props {
  news: WorldNewsItem;
  /** Smí uživatel novinku editovat/smazat (PomocnyPJ+ / globální admin). */
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  /** 5.5d — archivace/obnova; jen na stránce novinek. Bez něj se akce neukáže. */
  onArchive?: () => void;
}

/** Převede HTML obsah na zkrácený plain text (bezpečný render). */
function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 5.2 — karta oznámení světa. Barevný type-proužek vlevo; PJ+ vidí akce.
 */
export function WorldNewsCard({
  news,
  canManage,
  onEdit,
  onDelete,
  onArchive,
}: Props) {
  const validDate = !Number.isNaN(new Date(news.date).getTime());
  const isArchived = !!news.archived;

  return (
    <article className={clsx(s.card, s[news.type])} data-elev="card">
      <div className={s.head}>
        <h3 className={s.title}>{news.title}</h3>
        {canManage && (
          <div className={s.actions}>
            <button
              type="button"
              className={s.iconBtn}
              title="Upravit oznámení"
              onClick={onEdit}
            >
              <Pencil size={14} />
            </button>
            {onArchive && (
              <button
                type="button"
                className={s.iconBtn}
                title={isArchived ? 'Obnovit z archivu' : 'Archivovat oznámení'}
                onClick={onArchive}
              >
                {isArchived ? (
                  <ArchiveRestore size={14} />
                ) : (
                  <Archive size={14} />
                )}
              </button>
            )}
            <button
              type="button"
              className={s.iconBtn}
              title="Smazat oznámení"
              onClick={onDelete}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <p className={s.date}>
        {validDate ? relativeEventDate(news.date) : ''}
      </p>
      <p className={s.excerpt}>{plainText(news.content)}</p>
      {news.link && (
        <a
          className={s.link}
          href={news.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          Více →
        </a>
      )}
    </article>
  );
}
