import { Link } from 'react-router-dom';
import {
  Spinner,
  Badge,
  EmptyState,
  ErrorState,
  type StateIllustration,
} from '@/shared/ui';
import { useMyArticles } from '@/features/ikaros/api/useArticles';
import { useMyGalleryImages } from '@/features/ikaros/api/useGallery';
import { useMyDiscussions } from '@/features/ikaros/api/useDiscussions';
import { formatDateCs } from '@/features/ikaros/lib/articles';
import styles from './ProfileSections.module.css';

/** Max položek v profilu; zbytek přes „Zobrazit vše →". */
const LIMIT = 5;

/**
 * D-NEW-INV-PROFILE — komunitní sekce profilu (dřív placeholder „fáze 3").
 * Moje diskuze / Moje články / Moje galerie: jednoduchý seznam
 * (název · datum · odkaz na detail) nad existujícími hooky modulů 3.x.
 *
 * Diskuze: nativní `GET /ikaros-discussions/my` (`useMyDiscussions`) — BE vrací
 * vše tvůrce vč. pending/uzamčených, řazené createdAtUtc desc.
 */
export function CommunitySections() {
  const discussionsQuery = useMyDiscussions();
  const articlesQuery = useMyArticles();
  const galleryQuery = useMyGalleryImages();

  const myDiscussions = discussionsQuery.data ?? [];
  const myArticles = [...(articlesQuery.data ?? [])].sort(
    (a, b) =>
      new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime(),
  );
  const myGallery = [...(galleryQuery.data ?? [])].sort(
    (a, b) =>
      new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime(),
  );

  return (
    <>
      <CommunitySection
        title="Moje diskuze"
        query={discussionsQuery}
        items={myDiscussions.map((d) => ({
          id: d.id,
          name: d.title,
          date: d.createdAtUtc,
          to: `/ikaros/diskuze/${d.id}`,
        }))}
        allLink="/ikaros/diskuze"
        illustration="generic-empty"
        emptyTitle="Zatím žádná diskuze"
        emptyDesc="Až založíš diskuzi, objeví se tady."
      />
      <CommunitySection
        title="Moje články"
        query={articlesQuery}
        items={myArticles.map((a) => ({
          id: a.id,
          name: a.title,
          date: a.createdAtUtc,
          to: `/ikaros/clanky/${a.id}`,
        }))}
        allLink="/ikaros/clanky?tab=moje"
        illustration="pages"
        emptyTitle="Zatím žádný článek"
        emptyDesc="Až napíšeš článek, najdeš ho tady."
      />
      <CommunitySection
        title="Moje galerie"
        query={galleryQuery}
        items={myGallery.map((g) => ({
          id: g.id,
          name: g.title,
          date: g.createdAtUtc,
          to: `/ikaros/galerie/${g.id}`,
        }))}
        allLink="/ikaros/galerie?tab=moje"
        illustration="gallery"
        emptyTitle="Zatím žádný obrázek"
        emptyDesc="Až nahraješ obrázek do galerie, objeví se tady."
      />
    </>
  );
}

interface ListItem {
  id: string;
  name: string;
  date: string;
  to: string;
}

interface SectionProps {
  title: string;
  query: {
    isPending: boolean;
    isError: boolean;
    refetch: () => Promise<unknown>;
  };
  items: ListItem[];
  allLink: string;
  illustration: StateIllustration;
  emptyTitle: string;
  emptyDesc: string;
}

/** Jedna karta sekce — stejné primitivy jako WorldsSection (list) a
 *  ProfileEventsSection (headerLink, stavové placeholdery). */
function CommunitySection({
  title,
  query,
  items,
  allLink,
  illustration,
  emptyTitle,
  emptyDesc,
}: SectionProps) {
  const shown = items.slice(0, LIMIT);

  return (
    <section className={styles.card} aria-label={title}>
      <header className={styles.headerRow}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {!query.isPending && !query.isError && (
          <Badge variant="accent">{items.length}</Badge>
        )}
      </header>

      {query.isPending && (
        <div className={styles.empty}>
          <Spinner /> Načítám…
        </div>
      )}
      {query.isError && (
        <ErrorState
          size="panel"
          title={`Nepodařilo se načíst sekci ${title}`}
          onRetry={() => void query.refetch()}
        />
      )}
      {!query.isPending && !query.isError && items.length === 0 && (
        <EmptyState
          size="panel"
          illustration={illustration}
          title={emptyTitle}
          description={emptyDesc}
        />
      )}
      {!query.isPending && !query.isError && shown.length > 0 && (
        <>
          <ul className={styles.worldList}>
            {shown.map((item) => (
              <li key={item.id}>
                <Link to={item.to} className={styles.worldLink}>
                  <span className={styles.worldName}>{item.name}</span>
                  <span className={styles.worldGenre}>
                    {formatDateCs(item.date)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {items.length > LIMIT && (
            <p className={styles.moreLinkRow}>
              <Link to={allLink} className={styles.headerLink}>
                Zobrazit vše ({items.length}) →
              </Link>
            </p>
          )}
        </>
      )}
    </section>
  );
}
