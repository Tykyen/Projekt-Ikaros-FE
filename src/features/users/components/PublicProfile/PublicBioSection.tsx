import s from './PublicProfile.module.css';

interface Props {
  bio: string | null;
}

export function PublicBioSection({ bio }: Props) {
  if (!bio) return null;
  return (
    <section className={s.section} aria-label="Něco o mně">
      <h3 className={s.sectionTitle}>Něco o mně</h3>
      <p className={s.sectionBody}>{bio}</p>
    </section>
  );
}
