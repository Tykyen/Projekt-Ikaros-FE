import { Star } from 'lucide-react';
import type { World } from '@/shared/types';
import { DashColumn } from '../components/DashColumn';
import s from './FavoritePagesColumn.module.css';

interface Props {
  world: World;
}

/**
 * 5.2 — pravý sloupec: oblíbené stránky světa. Placeholder — wiki/stránky
 * modul přijde s krokem 7; zatím se zobrazí jen slugy z `favoritePageSlugs`.
 */
export function FavoritePagesColumn({ world }: Props) {
  const slugs = world.favoritePageSlugs ?? [];

  return (
    <DashColumn icon={<Star size={18} />} title="Oblíbené stránky">
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
