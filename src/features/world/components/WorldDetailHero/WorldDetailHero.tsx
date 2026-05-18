import type { World } from '@/shared/types';
import { accessModeLabel } from '@/features/world/lib/accessMode';
import s from './WorldDetailHero.module.css';

interface Props {
  world: World;
}

/**
 * Spec 2.4 + 5.4 — banner detailu světa. Nízký pruh (~220 px) s hero image
 * nebo placeholder gradientem; název + accessMode badge + žánr jako overlay
 * v horní části. Reuse skin tokenů (žádné hardcoded barvy).
 */
export function WorldDetailHero({ world }: Props) {
  const accessLabel = accessModeLabel(world.accessMode);
  const heroStyle: React.CSSProperties | undefined = world.imageUrl
    ? { backgroundImage: `url(${world.imageUrl})` }
    : undefined;

  return (
    <header
      className={world.imageUrl ? s.heroWithImage : s.heroPlaceholder}
      style={heroStyle}
    >
      <div className={s.overlay} />
      <div className={s.content}>
        <div className={s.badges}>
          <span
            className={s.accessBadge}
            data-mode={world.accessMode}
            aria-label={`Přístupový režim: ${accessLabel}`}
          >
            {accessLabel}
          </span>
          {world.genre && (
            <span className={s.genreBadge}>{world.genre}</span>
          )}
        </div>
        <h1 className={s.title}>{world.name}</h1>
      </div>
    </header>
  );
}
