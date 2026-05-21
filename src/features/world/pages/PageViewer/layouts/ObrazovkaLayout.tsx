import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Edit3 } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { WorldRole } from '@/shared/types';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { AkjBanner } from '../components/AkjBanner';
import type { Page } from '../../api/pages.types';
import s from './ObrazovkaLayout.module.css';

interface Props {
  page: Page;
}

/**
 * 7.1b — Layout pro typ Obrazovka. Tutorial / instruktážní videa.
 *   ┌──────────┬─────────────────────────────────────┐
 *   │ Videa    │   ▶ Aktivní video (YouTube iframe)  │
 *   │ ──────── │   16:9                              │
 *   │ ▶ Vid1   │   Title aktivního videa             │
 *   │   Vid2   │   TipTap popis                      │
 *   │   Vid3   │                                     │
 *   └──────────┴─────────────────────────────────────┘
 *
 * Sidebar (table) je v tomto layoutu skrytý — místo zabírá list videí.
 * Empty state: pokud `page.videos` = [], placeholder + (PomocnyPJ+) edit shortcut.
 */
export function ObrazovkaLayout({ page }: Props) {
  const { worldSlug, userRole } = useWorldContext();
  const sortedVideos = useMemo(() => page.videos, [page.videos]);
  const [activeId, setActiveId] = useState<string | null>(
    sortedVideos[0]?.id ?? null,
  );
  const active = sortedVideos.find((v) => v.id === activeId) ?? sortedVideos[0];
  const canEdit = (userRole ?? -1) >= WorldRole.PomocnyPJ;

  if (sortedVideos.length === 0) {
    return (
      <div className={s.empty}>
        <PlayCircle size={48} aria-hidden className={s.emptyIcon} />
        <p>V této obrazovce ještě nejsou žádná videa.</p>
        {canEdit && (
          <Link
            to={`/svet/${worldSlug}/edit/${page.slug}`}
            className={s.emptyAction}
          >
            <Edit3 size={14} aria-hidden /> Přejít do editoru
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={s.layout}>
      <nav className={s.menu} aria-label="Seznam videí">
        <h2 className={s.menuTitle}>Videa ({sortedVideos.length})</h2>
        <ul className={s.menuList}>
          {sortedVideos.map((v) => {
            const isActive = v.id === active?.id;
            return (
              <li key={v.id}>
                <button
                  type="button"
                  className={`${s.menuItem} ${isActive ? s.menuItemActive : ''}`}
                  onClick={() => setActiveId(v.id)}
                  aria-pressed={isActive}
                >
                  <PlayCircle
                    size={14}
                    aria-hidden
                    className={s.menuIcon}
                  />
                  <span className={s.menuLabel}>{v.title || 'Video'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className={s.main}>
        <AkjBanner accessRequirements={page.accessRequirements} />

        {active && (
          <div className={s.player}>
            <iframe
              key={active.id}
              src={`https://www.youtube.com/embed/${active.youtubeVideoId}?rel=0`}
              title={active.title}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className={s.iframe}
            />
          </div>
        )}

        {active?.title && <h2 className={s.activeTitle}>{active.title}</h2>}

        {page.content.trim().length > 0 && (
          <div className={s.proseWrap} data-article-content>
            <RichTextEditor
              value={page.content}
              readOnly
              className={s.prose}
            />
          </div>
        )}
      </main>
    </div>
  );
}
