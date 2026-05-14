import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui';
import s from './WorldNotFound.module.css';

/**
 * Spec 2.4 — fallback při 404 z `GET /worlds/:id` (svět neexistuje **nebo**
 * je private a uživatel nemá přístup). 404 nerozlišuje, ať se neprozradí
 * existence soukromého světa.
 */
export function WorldNotFound() {
  return (
    <section className={s.card}>
      <div className={s.icon} aria-hidden="true">
        🌌
      </div>
      <h2 className={s.title}>Tento svět nenajdeme</h2>
      <p className={s.description}>
        Buď neexistuje, nebo k němu nemáš přístup. Pokud jsi sem dostal
        odkaz, požádej PJ o nové pozvání.
      </p>
      <Link to="/" className={s.linkWrap}>
        <Button variant="primary" size="md" className={s.cta}>
          Zpět na úvod
        </Button>
      </Link>
    </section>
  );
}
