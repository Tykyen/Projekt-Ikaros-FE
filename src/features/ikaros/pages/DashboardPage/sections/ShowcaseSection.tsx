import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CornerOrnament } from '@/shared/ui/CornerOrnament/CornerOrnament';
import { SHOWCASE_SLIDES } from './showcaseSlides';
import s from './ShowcaseSection.module.css';

const ROTATE_MS = 5000;

// Vzor projektu (EffectsLayer/MatrixRain): matchMedia s optional chain.
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const update = () => setReduced(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/**
 * Spec 15.7 — rotující banner „Co tě čeká" nad hero kartou. Renderuje se JEN
 * anonimovi (gate v DashboardPage). Crossfade rotace á 5 s, pauza při hoveru,
 * `prefers-reduced-motion` vypne autorotaci (ovládání zůstane ruční).
 * Data v `showcaseSlides.ts` — přidání snímku nemění tuto komponentu.
 */
export function ShowcaseSection() {
  const count = SHOWCASE_SLIDES.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();

  const go = useCallback(
    (i: number) => setActive(((i % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused || reduced || count <= 1) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % count), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused, reduced, count]);

  if (count === 0) return null;

  return (
    <section
      className={s.showcase}
      aria-roledescription="carousel"
      aria-label="Ukázky z aplikace"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <CornerOrnament position="tl" />
      <CornerOrnament position="tr" />
      <CornerOrnament position="bl" />
      <CornerOrnament position="br" />

      <div className={s.viewport}>
        {SHOWCASE_SLIDES.map((slide, i) => (
          <figure
            key={slide.slug}
            className={clsx(
              s.slide,
              i === active && s.slideActive,
              i === active && !reduced && s.kenburns,
            )}
            aria-hidden={i !== active}
          >
            <img
              src={slide.src}
              alt=""
              className={s.image}
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
            <figcaption className={s.caption}>
              <span className={s.eyebrow}>Co tě čeká</span>
              <span className={s.captionText}>{slide.caption}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            className={clsx(s.arrow, s.arrowPrev)}
            onClick={() => go(active - 1)}
            aria-label="Předchozí ukázka"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={clsx(s.arrow, s.arrowNext)}
            onClick={() => go(active + 1)}
            aria-label="Další ukázka"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>

          <div className={s.dots}>
            {SHOWCASE_SLIDES.map((slide, i) => (
              <button
                key={slide.slug}
                type="button"
                className={clsx(s.dot, i === active && s.dotActive)}
                onClick={() => go(i)}
                aria-label={`Ukázka ${i + 1}: ${slide.caption}`}
                aria-current={i === active}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
