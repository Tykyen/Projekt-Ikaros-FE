import { PendingActionType } from '@/shared/types';

/**
 * Spec 3.8 — pomocné funkce pro badge počtu pending akcí u nav položek
 * (Diskuze/Články/Galerie). Odděleno z `IkarosLayout.tsx` kvůli
 * `react-refresh/only-export-components` (komponentový soubor smí exportovat
 * jen komponenty).
 */

/** Skloňování názvu obsahu pro tooltip badge (1 / 2–4 / 5+). */
const PENDING_NOUNS: Partial<
  Record<PendingActionType, [string, string, string]>
> = {
  [PendingActionType.DiscussionPendingReview]: [
    'diskuze',
    'diskuze',
    'diskuzí',
  ],
  [PendingActionType.ArticlePendingReview]: ['článek', 'články', 'článků'],
  [PendingActionType.GalleryPendingReview]: ['obrázek', 'obrázky', 'obrázků'],
};

/** Text tooltipu badge — „{n} článků čeká na schválení" apod. */
export function pendingTooltip(type: PendingActionType, n: number): string {
  const nouns = PENDING_NOUNS[type];
  if (!nouns) return `${n} čeká na schválení`;
  const idx = n === 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2;
  const verb = n >= 2 && n <= 4 ? 'čekají' : 'čeká';
  return `${n} ${nouns[idx]} ${verb} na schválení`;
}
