import { useAtomValue } from 'jotai';
import { Spinner } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { useMyProfile } from '@/features/auth/api/useAuth';
import { ProfileHeader } from '../components/ProfileHeader';
import { BioSection } from '../components/BioSection';
import { CharacterSection } from '../components/CharacterSection';
import { WorldsSection } from '../components/WorldsSection';
import { MyCharactersSection } from '../components/MyCharactersSection';
import { ProfileEventsSection } from '../components/ProfileEventsSection';
import { FriendsSection } from '../components/FriendsSection';
import { CommunityPlaceholders } from '../components/CommunityPlaceholders';
import { AppearanceSection } from '../components/AppearanceSection';
import { PrivacySection } from '../components/PrivacySection';
import { SecuritySection } from '../components/SecuritySection';
import { AccountSection } from '../components/AccountSection';
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

        <FriendsSection />

        <WorldsSection />

        <MyCharactersSection />

        <ProfileEventsSection />

        <CommunityPlaceholders />

        <AppearanceSection user={user} />

        <PrivacySection
          hiddenPresence={!!user.hiddenPresence}
          hiddenInDirectory={!!user.hiddenInDirectory}
          profileVisibility={user.profileVisibility ?? 'public'}
        />

        <SecuritySection username={user.username} />

        <AccountSection />
      </div>
    </div>
  );
}
