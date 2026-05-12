import { UserAvatar } from '@/shared/ui';
import type { PublicUserProfile } from '@/shared/types';
import s from './PublicProfile.module.css';

interface Props {
  profile: PublicUserProfile;
}

export function PublicCharacterSection({ profile }: Props) {
  if (!profile.characterName && !profile.characterBio) return null;
  return (
    <section className={s.section} aria-label="Postava v Rozcestí">
      <h3 className={s.sectionTitle}>Postava v Rozcestí</h3>
      <div className={s.character}>
        {(profile.characterAvatarUrl || profile.defaultAvatarType) && (
          <UserAvatar
            src={profile.characterAvatarUrl}
            defaultType={profile.defaultAvatarType}
            size="md"
            alt={`Postava ${profile.characterName ?? profile.username}`}
            className={s.characterAvatar}
          />
        )}
        <div className={s.characterMain}>
          {profile.characterName && (
            <h4 className={s.characterName}>{profile.characterName}</h4>
          )}
          {profile.characterBio && (
            <p className={s.sectionBody}>{profile.characterBio}</p>
          )}
        </div>
      </div>
    </section>
  );
}
