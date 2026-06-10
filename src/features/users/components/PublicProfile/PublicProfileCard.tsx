import type { PublicUserProfile } from '@/shared/types';
import { relativeTimeCs } from '@/shared/lib/relativeTime';
import { RoleChip } from '../shared/RoleChip';
import s from './PublicProfile.module.css';

const DATE_FMT = new Intl.DateTimeFormat('cs-CZ', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const DATETIME_FMT = new Intl.DateTimeFormat('cs-CZ', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

interface Props {
  profile: PublicUserProfile;
}

/**
 * 1.4 §15 — datová karta cizího profilu (grid label/value, read-only).
 * Veřejná pole vidí každý; „Poslední přihlášení" pošle BE jen platformovému
 * Adminovi (`lastLoginAt` je u ne-admina `undefined` → řádek se nevykreslí).
 * E-mail se zde záměrně NEzobrazuje (soukromé pole).
 */
export function PublicProfileCard({ profile }: Props) {
  const since = profile.createdAt
    ? DATE_FMT.format(new Date(profile.createdAt))
    : '—';
  const lastSeen = profile.lastSeenAt
    ? relativeTimeCs(profile.lastSeenAt)
    : '—';
  const worlds =
    profile.worldsCount === 1 ? '1 svět' : `${profile.worldsCount} světů`;

  return (
    <section className={s.section} aria-label="Karta uživatele">
      <h3 className={s.sectionTitle}>Karta uživatele</h3>
      <dl className={s.cardGrid}>
        <Field label="Uživatelské jméno" value={profile.username} />
        {profile.displayName && (
          <Field label="Přezdívka" value={profile.displayName} />
        )}
        <Field label="Město" value={profile.city || '—'} />
        <Field label="Role" value={<RoleChip role={profile.role} />} />
        <Field label="Počet světů" value={worlds} />
        <Field label="Člen od" value={since} />
        <Field label="Naposledy online" value={lastSeen} />
        {profile.lastLoginAt !== undefined && (
          <Field
            label="Poslední přihlášení"
            value={
              profile.lastLoginAt
                ? DATETIME_FMT.format(new Date(profile.lastLoginAt))
                : '—'
            }
          />
        )}
      </dl>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={s.cardField}>
      <dt className={s.cardFieldLabel}>{label}</dt>
      <dd className={s.cardFieldValue}>{value}</dd>
    </div>
  );
}
