import { Link } from 'react-router-dom';
import s from './WorldDetailNotFound.module.css';

/**
 * Spec 2.4 — error state pro Detail (404 z BE / private nečlen → 404).
 */
export function WorldDetailNotFound() {
  return (
    <section className={s.empty} aria-live="polite">
      <p className={s.indicia}>Hledali jsme svět</p>
      <h1 className={s.title}>Bohužel jsme ho nenašli.</h1>
      <p className={s.subtitle}>
        Možná byl smazán, nebo k němu nemáš přístup. Zkus to zpátky do Vesmírů.
      </p>
      <Link to="/ikaros/vesmiry" className={s.cta}>
        ← Zpět na Vesmíry
      </Link>
    </section>
  );
}
