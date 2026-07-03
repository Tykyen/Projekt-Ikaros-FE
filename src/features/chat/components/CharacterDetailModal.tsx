import { Modal, Spinner, UserAvatar } from '@/shared/ui';
import { usePublicUserProfile } from '@/features/users/api/usePublicUserProfile';
import s from './CharacterDetailModal.module.css';

interface Props {
  /** ID vybrané osoby; `null` → modal zavřený. */
  userId: string | null;
  onClose: () => void;
}

/**
 * Detail postavy po kliknutí na osobu v `PŘÍTOMNÍ` (Camp).
 * Ukazuje jen kartu postavy (avatar, jméno, popis) — žádné údaje o účtu,
 * aby zůstal zachován roleplay. Data on-demand z veřejného profilu.
 */
export function CharacterDetailModal({ userId, onClose }: Props) {
  const { data, isLoading, isError, error } = usePublicUserProfile(
    userId ?? undefined,
  );
  const status = (error as { status?: number } | undefined)?.status;

  return (
    <Modal open={!!userId} onClose={onClose} size="sm" title="Detail postavy">
      {isLoading && <Spinner center />}

      {isError && (
        <p className={s.message}>
          {status === 403
            ? 'Profil této postavy je skrytý.'
            : 'Postavu se nepodařilo načíst.'}
        </p>
      )}

      {data && (
        <div className={s.card}>
          <UserAvatar
            src={data.characterAvatarUrl}
            defaultType={data.defaultAvatarType}
            size="lg"
            alt={`Postava ${data.characterName ?? ''}`.trim()}
          />
          <h2 className={s.name}>
            {data.characterName || 'Bezejmenná postava'}
          </h2>
          <p className={s.bio}>
            {data.characterBio || (
              <span className={s.empty}>Tato postava zatím nemá popis.</span>
            )}
          </p>
        </div>
      )}
    </Modal>
  );
}
