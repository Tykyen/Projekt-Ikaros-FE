import s from './PageViewerSkeleton.module.css';

/**
 * 7.1 — Loading state pro PageViewer. Shimmer animace 1.5s; struktura
 * odpovídá outline default layoutu (breadcrumbs + title + obsah + sidebar).
 */
export function PageViewerSkeleton() {
  return (
    <div className={s.wrap} aria-busy="true" aria-live="polite">
      <div className={s.breadcrumbs} />
      <div className={s.title} />
      <div className={s.body}>
        <div className={s.content}>
          <div className={s.line} style={{ width: '92%' }} />
          <div className={s.line} style={{ width: '85%' }} />
          <div className={s.line} style={{ width: '78%' }} />
          <div className={s.line} style={{ width: '88%' }} />
          <div className={s.line} style={{ width: '60%' }} />
          <div className={s.line} style={{ width: '90%' }} />
        </div>
        <div className={s.sidebar}>
          <div className={s.hero} />
          <div className={s.tableRow} />
          <div className={s.tableRow} />
          <div className={s.tableRow} />
          <div className={s.tableRow} />
        </div>
      </div>
      <span className={s.srOnly}>Načítám stránku…</span>
    </div>
  );
}
