import { Link } from 'react-router-dom';
import { UserAvatar } from '@/shared/ui';
import { useFriends } from '@/features/friendships/api/useFriends';
import styles from './ProfileSections.module.css';

/**
 * Sekce „Přátelé" v profilu (osobní karta) — kompaktní výpis přijatých přátel:
 * malý avatar + jméno, klik vede na veřejný profil. Data z `useFriends` (GET
 * /friends), stejný zdroj jako tab Přátelé. Plná správa (žádosti, blokace)
 * zůstává na stránce Uživatelé → Přátelé.
 */
export function FriendsSection() {
  const { data, isLoading } = useFriends();
  // Pojistka proti záznamu bez protějšku (viz FriendsTab).
  const friends = (data?.items ?? []).filter((f) => f.friend);

  return (
    <section id="pratele" className={styles.card} aria-label="Přátelé">
      <header className={styles.headerRow}>
        <h2 className={styles.sectionTitle}>
          Přátelé{friends.length > 0 && ` (${friends.length})`}
        </h2>
        {friends.length > 0 && (
          <Link to="/ikaros/uzivatele?tab=pratele" className={styles.headerLink}>
            Spravovat →
          </Link>
        )}
      </header>

      {isLoading ? (
        <p className={styles.empty}>Načítám přátele…</p>
      ) : friends.length === 0 ? (
        <div className={styles.empty}>
          <p>Zatím nemáš žádné přátele.</p>
          <p className={styles.placeholderHint}>
            Najdi je v adresáři uživatelů a pošli žádost o přátelství.
          </p>
        </div>
      ) : (
        <ul className={styles.friendList}>
          {friends.map((f) => (
            <li key={f.friendshipId}>
              <Link
                to={`/ikaros/uzivatel/${f.friend.id}`}
                className={styles.friendChip}
                title={`Otevřít profil ${f.friend.username}`}
              >
                <UserAvatar
                  src={f.friend.avatarUrl}
                  defaultType={f.friend.defaultAvatarType}
                  size="sm"
                  alt={f.friend.username}
                  deleted={f.friend.deleted}
                />
                <span className={styles.friendName}>
                  {f.friend.displayName ?? f.friend.username}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
