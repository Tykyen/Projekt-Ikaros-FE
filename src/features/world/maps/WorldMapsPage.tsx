import { useState } from 'react';
import {
  Plus,
  Map as MapIcon,
  FolderPlus,
  Search,
  ChevronRight,
} from 'lucide-react';
import { Spinner, Button, ConfirmDialog, ImageLightbox } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMaps } from './api/useWorldMaps';
import { useWorldMapFolders } from './api/useWorldMapFolders';
import { useDeleteWorldMap } from './api/useWorldMapMutations';
import { useDeleteWorldMapFolder } from './api/useWorldMapFolderMutations';
import { MapCard } from './components/MapCard';
import { MapEditorModal } from './components/MapEditorModal';
import { FolderCard } from './components/FolderCard';
import { FolderEditorModal } from './components/FolderEditorModal';
import type { WorldMapEntry, WorldMapFolder } from './types';
import s from './WorldMapsPage.module.css';

/**
 * 13.4 / 13.4b — Mapy: atlas se složkami (vnořený strom). Navigace do hloubky
 * přes breadcrumb, hledání napříč. PJ má edit mód (složky/mapy CRUD) a
 * viditelnost per mapa i složka. Hráč vidí jen to, na co má přístup (BE filtr,
 * kaskáda složek).
 */
export default function WorldMapsPage() {
  const { worldId, isPJ, loading } = useWorldContext();
  const { data: maps = [], isLoading: mapsLoading } = useWorldMaps(worldId);
  const { data: folders = [], isLoading: foldersLoading } =
    useWorldMapFolders(worldId);
  const del = useDeleteWorldMap(worldId);
  const delFolder = useDeleteWorldMapFolder(worldId);

  const [editMode, setEditMode] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mapEditorOpen, setMapEditorOpen] = useState(false);
  const [editingMap, setEditingMap] = useState<WorldMapEntry | null>(null);
  const [folderEditorOpen, setFolderEditorOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<WorldMapFolder | null>(
    null,
  );
  const [deleteMapTarget, setDeleteMapTarget] = useState<WorldMapEntry | null>(
    null,
  );
  const [deleteFolderTarget, setDeleteFolderTarget] =
    useState<WorldMapFolder | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (loading || mapsLoading || foldersLoading) return <Spinner center />;

  const searching = search.trim().length > 0;
  const q = search.trim().toLowerCase();

  // Hledání = ploché napříč všemi mapami; jinak obsah aktuální složky.
  // Řazení vždy abecedně (locale `cs` kvůli diakritice).
  const visibleMaps = (
    searching
      ? maps.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q),
        )
      : maps.filter((m) => (m.folderId ?? null) === currentFolderId)
  ).sort((a, b) => a.title.localeCompare(b.title, 'cs'));
  const subfolders = (
    searching
      ? []
      : folders.filter((f) => (f.parentId ?? null) === currentFolderId)
  ).sort((a, b) => a.name.localeCompare(b.name, 'cs'));

  // Breadcrumb cesta od kořene k aktuální složce.
  const byId = new Map(folders.map((f) => [f.id, f]));
  const crumbs: WorldMapFolder[] = [];
  let cursor = currentFolderId ? byId.get(currentFolderId) : undefined;
  while (cursor) {
    crumbs.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }

  const lightboxImages = visibleMaps.map((m) => ({
    url: m.imageUrl,
    alt: m.title,
  }));

  async function confirmDeleteMap() {
    if (!deleteMapTarget) return;
    try {
      await del.mutateAsync(deleteMapTarget.id);
    } finally {
      setDeleteMapTarget(null);
    }
  }
  async function confirmDeleteFolder() {
    if (!deleteFolderTarget) return;
    try {
      await delFolder.mutateAsync(deleteFolderTarget.id);
    } finally {
      setDeleteFolderTarget(null);
    }
  }

  const nothing = subfolders.length === 0 && visibleMaps.length === 0;

  return (
    <article className={s.page}>
      <header className={s.head}>
        <h1 className={s.title}>Mapy</h1>
        <div className={s.headActions}>
          <div className={s.searchBox}>
            <Search size={16} aria-hidden />
            <input
              className={s.searchInput}
              type="search"
              placeholder="Hledat mapu…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isPJ && (
            <>
              {editMode && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingFolder(null);
                      setFolderEditorOpen(true);
                    }}
                  >
                    <FolderPlus size={16} aria-hidden /> Složka
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingMap(null);
                      setMapEditorOpen(true);
                    }}
                  >
                    <Plus size={16} aria-hidden /> Mapa
                  </Button>
                </>
              )}
              <Button
                variant={editMode ? 'primary' : 'ghost'}
                onClick={() => setEditMode((v) => !v)}
              >
                {editMode ? 'Hotovo' : 'Upravit'}
              </Button>
            </>
          )}
        </div>
      </header>

      {!searching && (
        <nav className={s.breadcrumb} aria-label="Cesta ve složkách">
          <button
            type="button"
            className={s.crumb}
            onClick={() => setCurrentFolderId(null)}
          >
            Atlas
          </button>
          {crumbs.map((f) => (
            <span key={f.id} className={s.crumbItem}>
              <ChevronRight size={14} aria-hidden />
              <button
                type="button"
                className={s.crumb}
                onClick={() => setCurrentFolderId(f.id)}
              >
                {f.name}
              </button>
            </span>
          ))}
        </nav>
      )}

      {nothing ? (
        <div className={s.empty}>
          <MapIcon size={40} aria-hidden />
          <p>
            {searching
              ? 'Nic nenalezeno.'
              : isPJ
                ? 'Tady zatím nic není. Zapni „Upravit" a přidej složku nebo mapu.'
                : 'Zatím tu pro tebe nic není.'}
          </p>
        </div>
      ) : (
        <>
          {subfolders.length > 0 && (
            <div className={s.folderGrid}>
              {subfolders.map((f) => (
                <FolderCard
                  key={f.id}
                  folder={f}
                  isPJ={isPJ}
                  editMode={editMode}
                  onOpen={() => setCurrentFolderId(f.id)}
                  onEdit={() => {
                    setEditingFolder(f);
                    setFolderEditorOpen(true);
                  }}
                  onDelete={() => setDeleteFolderTarget(f)}
                />
              ))}
            </div>
          )}
          {visibleMaps.length > 0 && (
            <div className={s.grid}>
              {visibleMaps.map((m, i) => (
                <MapCard
                  key={m.id}
                  map={m}
                  isPJ={isPJ}
                  editMode={editMode}
                  onOpen={() => setLightboxIndex(i)}
                  onEdit={() => {
                    setEditingMap(m);
                    setMapEditorOpen(true);
                  }}
                  onDelete={() => setDeleteMapTarget(m)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}

      {mapEditorOpen && (
        <MapEditorModal
          open={mapEditorOpen}
          worldId={worldId}
          editing={editingMap}
          folders={folders}
          defaultFolderId={currentFolderId}
          onClose={() => setMapEditorOpen(false)}
        />
      )}
      {folderEditorOpen && (
        <FolderEditorModal
          open={folderEditorOpen}
          worldId={worldId}
          editing={editingFolder}
          folders={folders}
          defaultParentId={currentFolderId}
          onClose={() => setFolderEditorOpen(false)}
        />
      )}

      <ConfirmDialog
        open={!!deleteMapTarget}
        title="Smazat mapu?"
        message={`Opravdu smazat mapu „${deleteMapTarget?.title ?? ''}"? Tuto akci nelze vrátit.`}
        confirmLabel="Smazat"
        cancelLabel="Zrušit"
        confirmVariant="danger"
        onConfirm={() => void confirmDeleteMap()}
        onClose={() => setDeleteMapTarget(null)}
        isPending={del.isPending}
      />
      <ConfirmDialog
        open={!!deleteFolderTarget}
        title="Smazat složku?"
        message={`Smazat složku „${deleteFolderTarget?.name ?? ''}"? Mapy a podsložky se přesunou o úroveň výš, nesmažou se.`}
        confirmLabel="Smazat"
        cancelLabel="Zrušit"
        confirmVariant="danger"
        onConfirm={() => void confirmDeleteFolder()}
        onClose={() => setDeleteFolderTarget(null)}
        isPending={delFolder.isPending}
      />
    </article>
  );
}
