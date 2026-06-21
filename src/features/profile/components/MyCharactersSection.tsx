import { Link } from 'react-router-dom';
import { Bot, MapPin, User as UserIcon } from 'lucide-react';
import { Spinner, Badge, EmptyState, ErrorState } from '@/shared/ui';
import { useMyCharactersGlobal } from '../api/useMyCharactersGlobal';
import type { MyCharacterEntry } from '@/shared/types';
import styles from './ProfileSections.module.css';

/**
 * 8.3 / D-075 — cross-world přehled „mých postav" na profilu.
 * Agregát přes všechny memberships uživatele kde má přiřazenou postavu.
 * Klik → detail postavy ve světě.
 */
export function MyCharactersSection() {
  const { data, isPending, isError, refetch } = useMyCharactersGlobal();

  return (
    <section className={styles.card} aria-label="Moje postavy">
      <header className={styles.headerRow}>
        <h2 className={styles.sectionTitle}>Moje postavy</h2>
        {data && <Badge variant="accent">{data.length}</Badge>}
      </header>

      {isPending && (
        <div className={styles.empty}>
          <Spinner /> Načítám…
        </div>
      )}
      {isError && (
        <ErrorState
          size="panel"
          title="Nepodařilo se načíst postavy"
          onRetry={() => void refetch()}
        />
      )}
      {data && data.length === 0 && (
        <EmptyState
          size="panel"
          illustration="characters"
          title="Zatím ti v žádném světě nebyla přidělena postava"
          description="Až tě vypravěč pasuje do role, tvá postava se objeví tady."
        />
      )}
      {data && data.length > 0 && (
        <ul className={styles.characterList}>
          {data.map((entry) => (
            <li key={`${entry.worldId}:${entry.characterSlug}`}>
              <Link
                to={`/svet/${entry.worldSlug}/postava/${entry.characterSlug}`}
                className={styles.characterLink}
              >
                <div className={styles.characterAvatar}>
                  {entry.characterImageUrl ? (
                    <img
                      src={entry.characterImageUrl}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <CharacterIcon entry={entry} />
                  )}
                </div>
                <div className={styles.characterMeta}>
                  <span className={styles.characterName}>
                    {entry.characterName}
                  </span>
                  <span className={styles.characterWorld}>
                    {entry.worldName}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CharacterIcon({ entry }: { entry: MyCharacterEntry }) {
  // Spec 9.2 — kind je nový primary discriminator (nahradil isLocation).
  if (entry.kind === 'location') return <MapPin size={24} aria-hidden />;
  if (entry.isNpc) return <Bot size={24} aria-hidden />;
  return <UserIcon size={24} aria-hidden />;
}
