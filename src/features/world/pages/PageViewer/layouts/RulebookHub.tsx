import { Link } from 'react-router-dom';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import type { Page } from '../../api/pages.types';
import s from './RulebookHub.module.css';

interface Props {
  page: Page;
}

/**
 * Pravidlová kniha — „kodex" index hubu Pravidla (svět se systémem matrix).
 * Renderuje úvod + kapitoly z `page.menu` jako číslované karty. Vzhled dle
 * prototypu (ikaros synthwave). Pro ostatní typy/světy se nepoužívá — dispatch
 * řeší PageViewer.
 */
export function RulebookHub({ page }: Props) {
  const { worldSlug } = useWorldContext();
  const items = [...page.menu].sort((a, b) => a.order - b.order);

  return (
    <div className={s.hub}>
      {page.content && (
        <div className={s.intro} data-article-content>
          <RichTextEditor value={page.content} readOnly className={s.prose} />
        </div>
      )}
      <div className={s.grid}>
        {items.map((it, i) => (
          <Link
            key={it.href}
            to={`/svet/${worldSlug}/${it.href}`}
            className={`${s.card} ${it.imageUrl ? s.hasMedia : ''}`}
          >
            {it.imageUrl && (
              <span className={s.media} aria-hidden>
                <img src={it.imageUrl} alt="" loading="lazy" />
              </span>
            )}
            <span className={s.num}>{String(i + 1).padStart(2, '0')}</span>
            <span className={s.arrow} aria-hidden>
              →
            </span>
            <span className={s.cardTitle}>{it.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
