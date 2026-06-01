import { typeCssVar } from '../campaignColors';
import type { CampaignSubject } from '../types';
import s from './campaign.module.css';

/** Avatar subjektu — obrázek (pokud je) nebo iniciála s barvou dle typu. */
export function SubjectAvatar({
  subject,
  size = 36,
  imageUrl,
}: {
  subject: CampaignSubject;
  size?: number;
  /** Resolvnutý obrázek z napojené stránky (viz `useSubjectImages`). */
  imageUrl?: string;
}) {
  const color = typeCssVar(subject.type);
  const letter = subject.name.charAt(0).toUpperCase() || '?';
  const src = subject.avatarUrl || imageUrl;
  return (
    <span
      className={s.avatar}
      style={{
        width: size,
        height: size,
        borderColor: color,
        color,
        fontSize: size * 0.42,
      }}
      aria-hidden
    >
      {src ? (
        <img src={src} alt="" className={s.avatarImg} loading="lazy" />
      ) : (
        letter
      )}
    </span>
  );
}
