import { useNavigate } from 'react-router-dom';
import { Mail, UserPlus, Shield } from 'lucide-react';
import { Button } from '@/shared/ui';
import s from './PublicProfile.module.css';

interface Props {
  /** Profil zobrazeného uživatele. */
  profileId: string;
  /** Aktuální přihlášený uživatel; když === profileId, admin tlačítko schované. */
  meId: string | undefined;
  isAdmin: boolean;
}

/**
 * Spec 1.4 — disabled placeholdery pro budoucí flow (1.8 přátele, 3.5 pošta).
 * Admin „Otevřít v administraci" linkuje do `/ikaros/uzivatele?tab=uzivatele
 * &view=table&focus=:id` (uzavírá D-027).
 *
 * Skryje admin akci pokud je profil = self (design rozhodnutí §12.3).
 */
export function PublicProfileActions({ profileId, meId, isAdmin }: Props) {
  const showAdminAction = isAdmin && profileId !== meId;
  const navigate = useNavigate();

  return (
    <section className={s.section} aria-label="Akce">
      <h3 className={s.sectionTitle}>Akce</h3>
      <div className={s.actionsRow}>
        <Button
          className={s.actionBtn}
          variant="secondary"
          disabled
          title="Připravujeme — krok 3.5"
        >
          <Mail size={14} aria-hidden="true" /> Napsat zprávu
        </Button>
        <Button
          className={s.actionBtn}
          variant="secondary"
          disabled
          title="Připravujeme — krok 1.8"
        >
          <UserPlus size={14} aria-hidden="true" /> Přidat do přátel
        </Button>
        {showAdminAction && (
          <Button
            className={s.actionBtn}
            onClick={() =>
              navigate(
                `/ikaros/uzivatele?tab=uzivatele&view=table&focus=${profileId}`,
              )
            }
          >
            <Shield size={14} aria-hidden="true" /> Otevřít v administraci
          </Button>
        )}
      </div>
    </section>
  );
}
