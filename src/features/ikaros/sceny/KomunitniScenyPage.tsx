/**
 * 22.5 — Veřejný katalog sdílených scén ve Společné tvorbě. Mřížka náhledů
 * publikovaných šablon taktických map; klik → detail → naklonování do světa.
 * Login-required (BE `GET /map-templates/catalog` je za JwtAuthGuard).
 */
import { Link } from 'react-router-dom';
import { Breadcrumbs, ErrorState } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { useSceneCatalog } from './hooks/useSceneCatalog';
import type { SceneCatalogEntry } from './api/sceneCatalogApi';
import s from './KomunitniSceny.module.css';

export default function KomunitniScenyPage() {
  const { data, isLoading, isError, refetch } = useSceneCatalog();
  const items = data?.items ?? [];

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Scény' },
  ];

  return (
    <article className={s.page}>
      <Seo
        title="Sdílené scény"
        description="Katalog hotových bojových scén pro taktickou mapu — publikované komunitou, připravené k naklonování do tvého světa."
        canonicalPath="/ikaros/sceny"
      />
      <Breadcrumbs items={crumbs} />

      <div className={s.topNav}>
        <Link to="/ikaros/tvorba" className={s.backLink}>
          ← Zpět do Společné tvorby
        </Link>
      </div>

      <header className={s.head}>
        <h1 className={s.title}>Sdílené scény</h1>
        <p className={s.lead}>
          Hotové bojové scény pro taktickou mapu — pozadí, NPC a nastavení mřížky
          v jednom balíku. Naklonuj si je do svého světa jedním kliknutím. Scény
          publikuješ ze své knihovny map přímo na taktické mapě.
        </p>
      </header>

      {isLoading ? (
        <p className={s.state}>Načítám…</p>
      ) : isError ? (
        <ErrorState
          size="panel"
          title="Katalog se nepodařilo načíst"
          description="Zkus to prosím znovu."
          onRetry={() => void refetch()}
        />
      ) : items.length === 0 ? (
        <p className={s.state}>
          V katalogu zatím žádná scéna není. Buď první — publikuj scénu ze své
          knihovny map na taktické mapě.
        </p>
      ) : (
        <ul className={s.grid}>
          {items.map((e) => (
            <SceneCard key={e.id} entry={e} />
          ))}
        </ul>
      )}
    </article>
  );
}

function SceneCard({ entry }: { entry: SceneCatalogEntry }) {
  return (
    <li className={s.card}>
      <Link to={`/ikaros/sceny/${entry.id}`} className={s.cardLink}>
        <span className={s.thumb}>
          {entry.imageUrl ? (
            <img src={entry.imageUrl} alt="" loading="lazy" />
          ) : (
            <span className={s.thumbFallback} aria-hidden="true">
              🗺
            </span>
          )}
        </span>
        <span className={s.cardBody}>
          <span className={s.cardName}>{entry.name}</span>
          <span className={s.cardMeta}>
            <span>od {entry.publicAuthorName}</span>
            {entry.npcCount > 0 && <span>· {entry.npcCount} NPC</span>}
            {entry.hasFog && <span>· mlha</span>}
          </span>
        </span>
      </Link>
    </li>
  );
}
