import { Navigate, Link } from 'react-router-dom';
import { Plus, UserSquare, BookUser } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { Spinner } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { useWorldStatus } from '@/features/world/api/useWorldStatus';
import { useCharacterDirectory } from './api/useCharacterDirectory';
import s from './MyCharacterPage.module.css';

/**
 * 8.3 — `/svet/:worldSlug/moje-postava`. Rychlá zkratka člena k jeho postavě.
 *
 * 1. Pokud má slot postavy (`character != null`) → redirect na detail.
 * 2. Loading shellu (`loading === true`) → spinner.
 * 3. Stale `characterPath` (membership ho má, ale directory entry chybí — PJ
 *    smazal postavu) → fallback se zprávou „postava neexistuje".
 * 4. Žádná postava — fallback s CTA „Zobrazit adresář" (PJ navíc dostane
 *    „Vytvořit postavu" → `/postavy?create=1`, adresář otevře CreateModal).
 */
export default function MyCharacterPage() {
  const { worldId, worldSlug, character, userRole, loading } = useWorldContext();
  const { membership } = useWorldStatus(worldId);
  const { data: directory, isLoading: dirLoading } = useCharacterDirectory(worldId);

  // 1) Šťastná cesta — postava existuje a je dohledatelná.
  if (character) {
    return (
      <Navigate
        to={`/svet/${worldSlug}/postava/${character.characterPath}`}
        replace
      />
    );
  }

  // 2) Loading světového shellu nebo directory ještě nedoběhlo.
  if (loading || dirLoading) {
    return <Spinner center />;
  }

  // 3) `characterPath` byl nastaven, ale directory ho nenašel = postava smazána.
  const staleSlug = membership?.characterPath ?? null;
  const isStale = staleSlug != null && !directory?.some((e) => e.slug === staleSlug);
  const canCreate = userRole !== null && userRole >= WorldRole.PJ;

  return (
    <div className={s.page}>
      <div className={s.card} role="status">
        <UserSquare size={48} aria-hidden className={s.icon} />
        {isStale ? (
          <>
            <h1 className={s.title}>Postava neexistuje</h1>
            <p className={s.body}>
              Postava <code className={s.slug}>{staleSlug}</code> už ve světě
              není dostupná. Požádej PJ o přidělení nové.
            </p>
          </>
        ) : (
          <>
            <h1 className={s.title}>Zatím nemáš postavu</h1>
            <p className={s.body}>
              V tomto světě ti ještě nikdo nepřidělil postavu. Prohlédni si
              adresář{canCreate ? ' nebo vytvoř novou.' : ' a poprosí PJ o přidělení.'}
            </p>
          </>
        )}
        <div className={s.actions}>
          <Link to={`/svet/${worldSlug}/postavy`} className={s.btnPrimary}>
            <BookUser size={16} aria-hidden /> Zobrazit adresář
          </Link>
          {canCreate && (
            <Link
              to={`/svet/${worldSlug}/nova-stranka?type=PostavaHrace`}
              className={s.btnSecondary}
            >
              <Plus size={16} aria-hidden /> Vytvořit postavu
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
