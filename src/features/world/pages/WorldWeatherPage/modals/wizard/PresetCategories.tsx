/**
 * 9.4-I — Stage 2 wizardu: kategorie dlaždice.
 *
 * Pro realm='real' renderuje 4 dlaždice (countries / koppen / sea / extremes).
 * Pro fantasy/scifi není volaná (Stage 1 locked).
 */
import s from './PresetCategories.module.css';
import type { RealCategory } from './types';

interface CategoryTile {
  id: RealCategory;
  glyph: string;
  name: string;
  count: number;
  description: string;
  examples: string;
}

interface Props {
  tiles: CategoryTile[];
  onPick: (category: RealCategory) => void;
}

export function PresetCategories({ tiles, onPick }: Props) {
  return (
    <div className={s.grid}>
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          className={s.tile}
          onClick={() => onPick(tile.id)}
        >
          <div className={s.head}>
            <span className={s.glyph} aria-hidden>
              {tile.glyph}
            </span>
            <span className={s.name}>{tile.name}</span>
            <span className={s.count}>{tile.count}</span>
          </div>
          <p className={s.desc}>{tile.description}</p>
          <span className={s.examples}>{tile.examples}</span>
        </button>
      ))}
    </div>
  );
}

export type { CategoryTile };
