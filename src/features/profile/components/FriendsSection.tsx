import { Link } from 'react-router-dom';
import { UserAvatar, EmptyState, ErrorState } from '@/shared/ui';
import { useFriends } from '@/features/friendships/api/useFriends';
import styles from './ProfileSections.module.css';

/**
 * Sekce „Přátelé" v profilu (osobní karta) — kompaktní výpis přijatých přátel:
 * malý avatar + jméno, klik vede na veřejný profil. Data z `useFriends` (GET
 * /friends), stejný zdroj jako tab Přátelé. Plná správa (žádosti, blokace)
 * zůstává na stránce Uživatelé → Přátelé.
 */
export function FriendsSection() {
  const { data, isLoading, isError, refetch } = useFriends();
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
      ) : isError ? (
        <ErrorState
          size="panel"
          title="Přátele se nepodařilo načíst"
          description="Neznamená to, že žádné nemáš. Zkus to prosím znovu."
          onRetry={() => void refetch()}
        />
      ) : friends.length === 0 ? (
        <EmptyState
          size="panel"
          illustration="generic-empty"
          title="Tvá družina se teprve sejde"
          description="Najdi přátele v adresáři a pošli jim žádost o přátelství."
          action={{
            label: 'Najdi přátele v adresáři',
            to: '/ikaros/uzivatele?tab=uzivatele',
          }}
        />
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
