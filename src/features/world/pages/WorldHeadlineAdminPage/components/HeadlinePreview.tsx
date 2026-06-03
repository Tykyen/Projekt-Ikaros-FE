import { buildFullWorldNav } from '@/features/world/lib/worldNavConfig';
import type { HeadlineNode } from '@/shared/types';
import type { LastInfoDraft } from '../WorldHeadlineAdminPage';
import s from './HeadlinePreview.module.css';

interface Props {
  worldName: string;
  hidden: string[];
  headline: HeadlineNode[];
  isPJ: boolean;
  lastInfo: LastInfoDraft | null;
}

/**
 * 12.2 — živý náhled horní lišty. Sdílí `buildFullWorldNav` s `WorldLayout`,
 * takže výsledek odpovídá realitě (systémová nav po skrytí + vlastní za ní).
 * Skupiny rozbalené napevno (statický náhled), externí odkazy s ↗.
 */
export function HeadlinePreview({
  worldName,
  hidden,
  headline,
  isPJ,
  lastInfo,
}: Props) {
  // worldSlug v náhledu nehraje roli (cesty se neklikají) — placeholder.
  const nav = buildFullWorldNav('nahled', isPJ, hidden, headline);

  return (
    <div className={s.wrap}>
      <p className={s.caption}>Náhled horní lišty</p>
      <div className={s.bar}>
        <span className={s.worldName}>{worldName}</span>
        <nav className={s.nav}>
          {nav.map((group) =>
            group.items ? (
              <div key={group.label} className={s.group}>
                <span className={s.groupLabel}>
                  {group.label} <span className={s.chevron}>▾</span>
                </span>
                <ul className={s.groupItems}>
                  {group.items.map((item) => (
                    <li key={`${item.label}-${item.to}`} className={s.item}>
                      {item.label}
                      {item.external && <span className={s.ext}>↗</span>}
                      {!item.to && <span className={s.missing}>(bez cíle)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <span key={group.id} className={s.topLink}>
                {group.label}
              </span>
            ),
          )}
        </nav>
      </div>

      {lastInfo && lastInfo.visible && lastInfo.text.trim() && (
        <div className={s.lastInfo}>
          <span className={s.lastInfoBadge}>Info</span>
          <span className={s.lastInfoText}>{lastInfo.text}</span>
        </div>
      )}
    </div>
  );
}
