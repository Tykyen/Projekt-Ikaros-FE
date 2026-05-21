import { Link } from 'react-router-dom';
import { Link2, FileText } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePageBacklinks } from '../../api/usePageBacklinks';
import s from './BacklinksPanel.module.css';

interface Props {
  pageSlug: string;
}

/**
 * 7.1l — Panel „Odkazuje sem". Seznam stránek, které odkazují na aktuální.
 * Skrytý pokud N=0 nebo error. Lehký loading skeleton 3 karty.
 *
 * Pattern z Roam/Logseq/Obsidian — pro lore wiki klíčová feature.
 */
export function BacklinksPanel({ pageSlug }: Props) {
  const { worldSlug, worldId } = useWorldContext();
  const { data, isLoading } = usePageBacklinks(worldId, pageSlug);

  if (isLoading) {
    return (
      <section className={s.wrap} aria-busy="true">
        <header className={s.header}>
          <Link2 size={16} aria-hidden />
          <h2>Načítám odkazy…</h2>
        </header>
        <ul className={s.list}>
          {[0, 1, 2].map((i) => (
            <li key={i} className={s.skeleton} />
          ))}
        </ul>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section className={s.wrap} aria-label="Odkazuje sem">
      <header className={s.header}>
        <Link2 size={16} aria-hidden />
        <h2>
          Odkazuje sem <span className={s.count}>({data.length})</span>
        </h2>
      </header>
      <ul className={s.list}>
        {data.map((b) => (
          <li key={b.slug}>
            <Link to={`/svet/${worldSlug}/${b.slug}`} className={s.card}>
              <FileText size={14} aria-hidden className={s.cardIcon} />
              <span className={s.cardTitle}>{b.title}</span>
              <span className={s.cardType}>{b.type}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
