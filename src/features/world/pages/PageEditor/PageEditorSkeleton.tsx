import s from './PageEditorSkeleton.module.css';

/**
 * 7.2 — Loading state pro edit mode (hydratace existující page).
 * V new mode se neukáže — form je hned ready.
 */
export function PageEditorSkeleton() {
  return (
    <div className={s.wrap} aria-busy="true" aria-live="polite">
      <div className={s.topBar} />
      <div className={s.body}>
        <div className={s.panel}>
          <div className={s.panelHeader} />
        </div>
        <div className={s.panel}>
          <div className={s.panelHeader} />
          <div className={s.editor} />
        </div>
      </div>
      <div className={s.stickyBar} />
      <span className={s.srOnly}>Načítám stránku…</span>
    </div>
  );
}
