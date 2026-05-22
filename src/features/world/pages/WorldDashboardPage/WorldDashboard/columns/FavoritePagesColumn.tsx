import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { World } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePagesDirectory } from '../../../api/usePagesDirectory';
import { DashColumn } from '../components/DashColumn';
import column from './column.module.css';
import s from './FavoritePagesColumn.module.css';

interface Props {
  world: World;
}

/**
 * 5.2 → 7.3 — pravý sloupec: oblíbené stránky světa (max 10). Zobrazuje
 * titulky stránek (lookup z `usePagesDirectory`) a prokliky na viewer.
 */
export function FavoritePagesColumn({ world }: Props) {
  const { worldSlug } = useWorldContext();
  const { data: directory = [] } = usePagesDirectory(world.id);
  const slugs = (world.favoritePageSlugs ?? []).slice(0, 10);
  const titleBySlug = new Map(directory.map((d) => [d.slug, d.title]));

  return (
    <DashColumn
      icon={<Star size={18} />}
      title="Oblíbené stránky"
      footer={
        <Link className={column.moreLink} to={`/svet/${worldSlug}/stranky`}>
          Všechny stránky →
        </Link>
      }
    >
      {slugs.length === 0 ? (
        <p className={s.empty}>
          Zatím žádné oblíbené stránky.
          <br />
          <span className={s.hint}>
            Označíš je hvězdičkou u stránek světa.
          </span>
        </p>
      ) : (
        <ul className={s.list}>
          {slugs.map((slug) => (
            <li key={slug} className={s.item}>
              <Link to={`/svet/${worldSlug}/${slug}`} className={s.itemLink}>
                {titleBySlug.get(slug) ?? slug}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashColumn>
  );
}
