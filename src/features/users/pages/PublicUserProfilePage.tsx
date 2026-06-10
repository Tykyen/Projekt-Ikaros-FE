import { useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { currentUserAtom } from '@/shared/store/authStore';
import { Spinner } from '@/shared/ui';
import { UserRole } from '@/shared/types';
import { usePublicUserProfile } from '../api/usePublicUserProfile';
import { PublicProfileHeader } from '../components/PublicProfile/PublicProfileHeader';
import { PublicProfileCard } from '../components/PublicProfile/PublicProfileCard';
import { PublicBioSection } from '../components/PublicProfile/PublicBioSection';
import { PublicCharacterSection } from '../components/PublicProfile/PublicCharacterSection';
import { PublicProfileActions } from '../components/PublicProfile/PublicProfileActions';
import { SelfProfileBanner } from '../components/PublicProfile/SelfProfileBanner';
import { TombstoneBanner } from '../components/PublicProfile/TombstoneBanner';
import s from '../components/PublicProfile/PublicProfile.module.css';

/**
 * Spec 1.4 — veřejný profil `/ikaros/uzivatel/:id`. Dostupný každému
 * přihlášenému. 404 pro tombstone/pending-deletion (běžný), admin výjimka
 * vidí s overlay banneru. Self-banner pokud id === me.id.
 */
export default function PublicUserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const me = useAtomValue(currentUserAtom);
  const role = me?.role ?? UserRole.Ikarus;
  const isAdmin = role === UserRole.Superadmin || role === UserRole.Admin;
  const isSelf = id === me?.id;

  const { data: profile, isLoading, isError, error } = usePublicUserProfile(id);

  if (isLoading) {
    return (
      <div className={s.page}>
        <Spinner center />
      </div>
    );
  }

  if (isError || !profile) {
    const status = (error as { status?: number } | undefined)?.status;
    return (
      <div className={s.page}>
        <div className={s.notFound}>
          {status === 404
            ? 'Tento uživatel neexistuje nebo byl odstraněn.'
            : status === 403
              ? 'Tento profil je viditelný jen přátelům.'
              : 'Profil se nepodařilo načíst.'}
        </div>
      </div>
    );
  }

  const tombstoneVariant: 'pending' | 'deleted' | null = profile.deleted
    ? 'deleted'
    : profile.pendingDeletion
      ? 'pending'
      : null;

  return (
    <div className={s.page}>
      {isSelf && <SelfProfileBanner />}
      {tombstoneVariant && isAdmin && (
        <TombstoneBanner variant={tombstoneVariant} />
      )}
      <PublicProfileHeader profile={profile} />
      <PublicProfileCard profile={profile} />
      <PublicBioSection bio={profile.bio} />
      <PublicCharacterSection profile={profile} />
      <PublicProfileActions
        profileId={profile.id}
        meId={me?.id}
        isAdmin={isAdmin}
        username={profile.username}
      />
    </div>
  );
}
