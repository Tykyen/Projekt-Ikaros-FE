import s from './WorldDetailSkeleton.module.css';

/**
 * Spec 2.4 — loading skeleton pro Detail. Hero placeholder + 3 text lines.
 */
export function WorldDetailSkeleton() {
  return (
    <div className={s.skeleton} aria-busy="true" aria-label="Načítám svět…">
      <div className={s.heroBar} />
      <div className={s.heroTitle} />
      <div className={s.metaLine} />
      <div className={s.body}>
        <div className={s.line} />
        <div className={s.line} />
        <div className={s.line} style={{ width: '70%' }} />
      </div>
    </div>
  );
}
