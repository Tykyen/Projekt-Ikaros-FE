import { useAtomValue } from 'jotai';
import { Spinner } from '../../components/ui';
import { currentUserAtom } from '../../store/authStore';
import { useMyProfile } from '../../api/hooks/useAuth';
import { ProfileHeader } from './profile/ProfileHeader';
import { BioSection } from './profile/BioSection';
import { CharacterSection } from './profile/CharacterSection';
import { WorldsSection } from './profile/WorldsSection';
import { CommunityPlaceholders } from './profile/CommunityPlaceholders';
import { AppearanceSection } from './profile/AppearanceSection';
import { SecuritySection } from './profile/SecuritySection';
import { AccountSection } from './profile/AccountSection';
import styles from './ProfilePage.module.css';

/**
 * 1.3a — Profil uživatele (`/ikaros/profil`).
 * Self-edit: hlavička (avatar, displayName, město…), bio, postava v Rozcestí,
 * světy, komunita placeholders, vzhled, bezpečnost, účet.
 *
 * Username change a smazání účtu jsou disabled (přijdou v 1.3b/c).
 * Změna emailu vyžaduje verifikaci (přijde v 1.7).
 */
export default function ProfilePage() {
  // Cached optimistic state (z JWT decode v useAuthBootstrap)
  const cached = useAtomValue(currentUserAtom);
  // Plnohodnotná hydratace z /users/me (1.3a — D-005 vyřešen)
  const { data, isPending, isError } = useMyProfile();

  const user = data ?? cached;

  if (!user) {
    if (isPending) {
      return (
        <div className={styles.loading}>
          <Spinner /> Načítám profil…
        </div>
      );
    }
    if (isError) {
      return (
        <div className={styles.error}>
          Profil se nepodařilo načíst. Zkus stránku obnovit.
        </div>
      );
    }
    return null;
  }

  return (
    <div className={styles.page}>
      <ProfileHeader user={user} />

      <div className={styles.sections}>
        <BioSection bio={user.bio} />

        <CharacterSection
          characterName={user.characterName}
          characterBio={user.characterBio}
          characterAvatarUrl={user.characterAvatarUrl}
        />

        <WorldsSection />

        <CommunityPlaceholders />

        <AppearanceSection user={user} />

        <SecuritySection username={user.username} />

        <AccountSection />
      </div>
    </div>
  );
}
