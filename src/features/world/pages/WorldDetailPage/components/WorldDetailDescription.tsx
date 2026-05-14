import s from './WorldDetailDescription.module.css';

interface Props {
  description?: string;
}

/**
 * Spec 2.4 — popis světa. Drop cap na první písmeno na desktopu (≥ 1024px).
 * White-space pre-wrap zachovává PJ formátování (řádky).
 */
export function WorldDetailDescription({ description }: Props) {
  if (!description?.trim()) {
    return (
      <section className={s.empty} aria-label="Popis světa">
        <p className={s.metaLabel}>Popis</p>
        <p className={s.emptyText}>PJ zatím nepřidal popis světa.</p>
      </section>
    );
  }

  return (
    <section className={s.body} aria-label="Popis světa">
      <p className={s.metaLabel}>Popis</p>
      <div className={s.text}>
        {description.split(/\n{2,}/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </section>
  );
}
