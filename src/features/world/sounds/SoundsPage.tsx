/**
 * 13.3 — Zvuková databáze (`/svet/:worldSlug/zvuky`).
 *
 * Taby Svět / Globální (+ Nominace pro Admin). Náhled přes sdílené YT jádro
 * (lokální, nepřenáší). PJ+ smí create/edit/delete/nominate; import z globálu
 * do světa. Layout sjednocen s BestiarPage.
 */
import { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Button, ConfirmDialog } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, WorldRole } from '@/shared/types';
import { useWorldSounds, useGlobalSounds } from './hooks/useSounds';
import { useSoundMutations } from './hooks/useSoundMutations';
import { useYoutubePlayer } from './player/useYoutubePlayer';
import { useSoundVolume } from './player/soundActivation';
import { extractYoutubeId } from './player/youtubeId';
import { SoundCard } from './components/SoundCard';
import {
  SoundFiltersBar,
  EMPTY_FILTERS,
  type SoundFilters,
} from './components/SoundFiltersBar';
import { applyFilters, hasActiveFilters } from './lib/applyFilters';
import { SoundFormModal } from './components/SoundFormModal';
import { SoundPreviewBar } from './components/SoundPreviewBar';
import { NominationPanel } from './components/NominationPanel';
import type { Sound } from './types';
import styles from './SoundsPage.module.css';

type Tab = 'world' | 'global' | 'nominations';

export default function SoundsPage(): React.ReactElement {
  const { worldId, userRole } = useWorldContext();
  const currentUser = useAtomValue(currentUserAtom);

  const isGlobalAdmin =
    currentUser?.role === UserRole.Superadmin ||
    currentUser?.role === UserRole.Admin;
  const isPjInWorld =
    isGlobalAdmin || (userRole !== null && userRole >= WorldRole.PomocnyPJ);

  const [tab, setTab] = useState<Tab>('world');
  const [filters, setFilters] = useState<SoundFilters>(EMPTY_FILTERS);
  const [editing, setEditing] = useState<Sound | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Sound | null>(null);
  const [previewSound, setPreviewSound] = useState<Sound | null>(null);

  const worldQuery = useWorldSounds(worldId);
  const globalQuery = useGlobalSounds(tab === 'global');
  const mutations = useSoundMutations(worldId);

  const player = useYoutubePlayer();
  const { effectiveVolume } = useSoundVolume();

  // Drž hlasitost přehrávače v souladu s uživatelským nastavením.
  useEffect(() => {
    player.setVolume(effectiveVolume);
  }, [effectiveVolume, player]);

  const sourceList = tab === 'global' ? globalQuery.data : worldQuery.data;
  const isLoading =
    tab === 'global' ? globalQuery.isLoading : worldQuery.isLoading;

  const visible = useMemo(
    () => applyFilters(sourceList ?? [], filters),
    [sourceList, filters],
  );

  const handlePreview = (sound: Sound) => {
    if (previewSound?.id === sound.id) {
      player.stop();
      setPreviewSound(null);
      return;
    }
    const id = extractYoutubeId(sound.youtubeUrl);
    if (!id) return;
    player.setVolume(effectiveVolume);
    player.play([id], { loop: sound.loop });
    setPreviewSound(sound);
  };

  const stopPreview = () => {
    player.stop();
    setPreviewSound(null);
  };

  const handleImport = async (globalId: string) => {
    await mutations.importGlobal.mutateAsync(globalId);
    setTab('world');
  };

  if (!worldId) {
    return (
      <div className={styles.page}>
        <p className={styles.empty}>Načítání světa…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>🎵 Zvuková databáze</h1>
        {tab === 'world' && isPjInWorld && (
          <Button variant="primary" onClick={() => setEditing('new')}>
            + Přidat zvuk
          </Button>
        )}
      </header>

      <div className={styles.tabs}>
        <TabButton active={tab === 'world'} onClick={() => setTab('world')}>
          Svět ({worldQuery.data?.length ?? 0})
        </TabButton>
        <TabButton active={tab === 'global'} onClick={() => setTab('global')}>
          Globální
        </TabButton>
        {isGlobalAdmin && (
          <TabButton
            active={tab === 'nominations'}
            onClick={() => setTab('nominations')}
          >
            Nominace
          </TabButton>
        )}
      </div>

      <SoundPreviewBar sound={previewSound} onStop={stopPreview} />

      {tab === 'nominations' ? (
        <NominationPanel worldId={worldId} />
      ) : (
        <>
          <SoundFiltersBar value={filters} onChange={setFilters} />

          {isLoading && <p className={styles.empty}>Načítání zvuků…</p>}
          {!isLoading && visible.length === 0 && (
            <p className={styles.empty}>
              {filters.search || hasActiveFilters(filters)
                ? 'Žádný zvuk neodpovídá filtru.'
                : tab === 'global'
                  ? 'Globální databáze je zatím prázdná.'
                  : 'Knihovna světa je prázdná. Přidej první zvuk.'}
            </p>
          )}

          <div className={styles.list}>
            {visible.map((s) => (
              <SoundCard
                key={s.id}
                sound={s}
                context={tab === 'global' ? 'global' : 'world'}
                isPlaying={previewSound?.id === s.id}
                canEdit={isPjInWorld}
                onPreview={() => handlePreview(s)}
                onEdit={() => setEditing(s)}
                onDelete={() => setDeleting(s)}
                onNominate={() => mutations.nominate.mutate(s.id)}
                onImport={isPjInWorld ? () => handleImport(s.id) : undefined}
              />
            ))}
          </div>
        </>
      )}

      {editing && (
        <SoundFormModal
          worldId={worldId}
          existing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          open
          confirmVariant="danger"
          title="Smazat zvuk"
          message={`Opravdu smazat „${deleting.name}"?`}
          confirmLabel="Smazat"
          onConfirm={() => {
            mutations.remove.mutate(deleting.id);
            setDeleting(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      className={`${styles.tab} ${active ? styles.tabActive : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

