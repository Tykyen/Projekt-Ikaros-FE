/**
 * 22.5 — detail katalogové scény: velký náhled mapy + autor + naklonování do
 * světa + nahlášení. Katalog vrací jen schválené scény (kurace jde přes
 * Zpracovat tab), takže detail je čistě „prohlédni a naklonuj".
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumbs, Button, Spinner, ErrorState } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { ReportButton } from '@/shared/moderation';
import { useSceneCatalogEntry } from './hooks/useSceneCatalog';
import { CloneToWorldModal } from './components/CloneToWorldModal';
import s from './KomunitniScenaDetail.module.css';

export default function KomunitniScenaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: entry, isLoading, isError } = useSceneCatalogEntry(id);
  const [cloneOpen, setCloneOpen] = useState(false);

  if (isLoading) return <Spinner center />;
  if (isError || !entry) {
    return (
      <article className={s.page}>
        <ErrorState
          size="panel"
          status={404}
          title="Scéna nenalezena"
          description="Možná už není v katalogu, nebo byla odebrána."
          action={{ label: 'Zpět do katalogu scén', to: '/ikaros/sceny' }}
        />
      </article>
    );
  }

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Scény', href: '/ikaros/sceny' },
    { label: entry.name },
  ];

  return (
    <article className={s.page}>
      <Seo
        title={`${entry.name} — sdílená scéna`}
        description={`Bojová scéna „${entry.name}" od ${entry.publicAuthorName} — naklonuj si ji na taktickou mapu svého světa.`}
        canonicalPath={`/ikaros/sceny/${entry.id}`}
      />
      <Breadcrumbs items={crumbs} />

      <div className={s.topNav}>
        <Link to="/ikaros/sceny" className={s.backLink}>
          ← Zpět do katalogu scén
        </Link>
      </div>

      <div className={s.preview}>
        {entry.imageUrl ? (
          <img src={entry.imageUrl} alt={entry.name} />
        ) : (
          <div className={s.previewEmpty} aria-hidden="true">
            🗺
          </div>
        )}
      </div>

      <header className={s.head}>
        <h1 className={s.title}>{entry.name}</h1>
        <p className={s.meta}>
          od <strong>{entry.publicAuthorName}</strong>
          {entry.npcCount > 0 && <> · {entry.npcCount} NPC</>}
          {entry.hasFog && <> · mlha války</>}
        </p>
      </header>

      <div className={s.actions}>
        <Button variant="primary" onClick={() => setCloneOpen(true)}>
          Naklonovat do světa
        </Button>
        <ReportButton
          targetType="scene_template"
          targetId={entry.id}
          targetSnapshot={entry.name}
          targetAuthorName={entry.publicAuthorName}
        />
      </div>

      <p className={s.note}>
        Klon vytvoří novou scénu na taktické mapě vybraného světa (jsi-li tam Pán
        jeskyně). Přenese se pozadí, NPC, efekty a mlha — bez hráčských postav a
        zvuků.
      </p>

      {cloneOpen && (
        <CloneToWorldModal
          templateId={entry.id}
          sceneName={entry.name}
          onClose={() => setCloneOpen(false)}
        />
      )}
    </article>
  );
}
