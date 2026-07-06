import { Link, useNavigate } from 'react-router-dom';
import { FileX2, ArrowLeft, FilePlus2 } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { WorldRole } from '@/shared/types';
import s from './AccessDenied.module.css';

interface Props {
  slug: string;
}

/**
 * 7.1 — 404 screen. Stránka v tomto světě neexistuje. Pokud user je PomocnyPJ+,
 * nabídneme „Vytvořit" shortcut (vede do 7.2 editoru se slug-prefillem).
 *
 * Reusuje stylesheet `AccessDenied.module.css` — vizuálně identický layout.
 */
export function PageNotFound({ slug }: Props) {
  const navigate = useNavigate();
  const { worldSlug, userRole, world } = useWorldContext();
  // Elevation — admin má world bypass jen když je v tomto světě „nahozený".
  const canCreate =
    world?.elevated === true || (userRole ?? -1) >= WorldRole.PomocnyPJ;

  return (
    <div className={s.wrap} role="alert">
      <div className={s.icon} style={{ color: 'var(--text-muted, #888)' }}>
        <FileX2 size={48} aria-hidden />
      </div>
      <h1 className={s.title}>Stránka nenalezena</h1>
      <p className={s.text}>
        Stránka <code>{slug}</code> v tomto světě neexistuje. Možná byla
        smazána nebo přesunuta.
      </p>

      <div className={s.actions}>
        <button
          type="button"
          className={s.btnSecondary}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={14} aria-hidden /> Zpět
        </button>
        <Link to={`/svet/${worldSlug}/stranky`} className={s.btnSecondary}>
          Seznam stránek
        </Link>
        {canCreate && (
          <Link
            to={`/svet/${worldSlug}/nova-stranka?slug=${encodeURIComponent(slug)}`}
            className={s.btnPrimary}
            title="Vytvořit novou stránku s tímto slugem"
          >
            <FilePlus2 size={14} aria-hidden /> Vytvořit
          </Link>
        )}
      </div>
    </div>
  );
}
