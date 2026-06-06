import { useState } from 'react';
import { Plus, Map as MapIcon } from 'lucide-react';
import { Spinner, Button, ConfirmDialog, ImageLightbox } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMaps } from './api/useWorldMaps';
import {
  useDeleteWorldMap,
  useReorderWorldMaps,
} from './api/useWorldMapMutations';
import { MapCard } from './components/MapCard';
import { MapEditorModal } from './components/MapEditorModal';
import type { WorldMapEntry } from './types';
import s from './WorldMapsPage.module.css';

/**
 * 13.4 — Mapy: obrázkový atlas světa. Mřížka karet + lightbox. PJ má edit
 * mód (přidat / upravit / smazat / přesun) a per-mapa viditelnost. Hráč vidí
 * jen mapy, na které má přístup (BE filtr).
 */
export default function WorldMapsPage() {
  const { worldId, isPJ, loading } = useWorldContext();
  const { data: maps = [], isLoading } = useWorldMaps(worldId);
  const del = useDeleteWorldMap(worldId);
  const reorder = useReorderWorldMaps(worldId);

  const [editMode, setEditMode] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<WorldMapEntry | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorldMapEntry | null>(null);

  if (loading || isLoading) return <Spinner center />;

  const lightboxImages = maps.map((m) => ({ url: m.imageUrl, alt: m.title }));

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }
  function openEdit(m: WorldMapEntry) {
    setEditing(m);
    setEditorOpen(true);
  }

  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= maps.length) return;
    const next = [...maps];
    [next[idx], next[target]] = [next[target], next[idx]];
    reorder.mutate(next.map((m) => m.id));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.id);
    } finally {
      setDeleteTarget(null);
    }
  }

  const empty = maps.length === 0;

  return (
    <article className={s.page}>
      <header className={s.head}>
        <h1 className={s.title}>Mapy</h1>
        {isPJ && (
          <div className={s.headActions}>
            {editMode && (
              <Button variant="ghost" onClick={openCreate}>
                <Plus size={16} aria-hidden /> Přidat mapu
              </Button>
            )}
            <Button
              variant={editMode ? 'primary' : 'ghost'}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? 'Hotovo' : 'Upravit'}
            </Button>
          </div>
        )}
      </header>

      {empty && !editMode ? (
        <div className={s.empty}>
          <MapIcon size={40} aria-hidden />
          <p>
            {isPJ
              ? 'Atlas je prázdný. Zapni „Upravit" a přidej první mapu.'
              : 'Zatím tu nejsou žádné mapy pro tebe.'}
          </p>
        </div>
      ) : (
        <div className={s.grid}>
          {maps.map((m, i) => (
            <MapCard
              key={m.id}
              map={m}
              isPJ={isPJ}
              editMode={editMode}
              onOpen={() => setLightboxIndex(i)}
              onEdit={() => openEdit(m)}
              onDelete={() => setDeleteTarget(m)}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
              canMoveUp={i > 0}
              canMoveDown={i < maps.length - 1}
            />
          ))}
          {isPJ && editMode && (
            <button type="button" className={s.addTile} onClick={openCreate}>
              <Plus size={28} aria-hidden />
              <span>Přidat mapu</span>
            </button>
          )}
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}

      {editorOpen && (
        <MapEditorModal
          open={editorOpen}
          worldId={worldId}
          editing={editing}
          onClose={() => setEditorOpen(false)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Smazat mapu?"
        message={`Opravdu smazat mapu „${deleteTarget?.title ?? ''}"? Tuto akci nelze vrátit.`}
        confirmLabel="Smazat"
        cancelLabel="Zrušit"
        confirmVariant="danger"
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
        isPending={del.isPending}
      />
    </article>
  );
}
