import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { World } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { DashColumn } from '../components/DashColumn';
import column from './column.module.css';
import s from './FavoritePagesColumn.module.css';

interface Props {
  world: World;
}

/**
 * 5.2 — pravý sloupec: oblíbené stránky světa (max 10). Placeholder —
 * wiki/stránky modul přijde s krokem 7; zatím se zobrazí jen slugy.
 */
export function FavoritePagesColumn({ world }: Props) {
  const { worldSlug } = useWorldContext();
  const slugs = (world.favoritePageSlugs ?? []).slice(0, 10);

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
              {slug}
            </li>
          ))}
        </ul>
      )}
      <p className={s.note}>
        Stránky světa (wiki, encyklopedie, deníky) budou dostupné s krokem 7.
      </p>
    </DashColumn>
  );
}
