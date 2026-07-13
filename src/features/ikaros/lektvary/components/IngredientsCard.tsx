/**
 * 21.5b — read-only karta surovin lektvaru (recept: surovina + množství).
 */
import type { PotionIngredient } from '../types';
import s from './IngredientsCard.module.css';

export function IngredientsCard({
  ingredients,
}: {
  ingredients: PotionIngredient[];
}) {
  if (!ingredients.length) return null;
  return (
    <div className={s.card} data-potion-ingredients="">
      <p className={s.title}>Suroviny</p>
      <ul className={s.list}>
        {ingredients.map((ing, i) => (
          <li className={s.row} key={`${ing.name}-${i}`}>
            <span className={s.name}>{ing.name}</span>
            {ing.amount ? <span className={s.amount}>{ing.amount}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
