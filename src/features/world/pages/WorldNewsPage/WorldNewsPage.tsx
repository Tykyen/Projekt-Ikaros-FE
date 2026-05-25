import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button, ConfirmDialog, Spinner } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import {
  UserRole,
  WorldRole,
  type WorldNewsItem,
  type WorldNewsScope,
} from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import {
  useWorldNewsList,
  useWorldNewsCount,
  useDeleteWorldNews,
  useArchiveWorldNews,
  useUnarchiveWorldNews,
} from '@/features/world/api/useWorldNews';
import { WorldNewsCard } from '../WorldDashboardPage/WorldDashboard/components/WorldNewsCard';
import { WorldNewsEditorModal } from '../WorldDashboardPage/WorldDashboard/components/WorldNewsEditorModal';
import s from './WorldNewsPage.module.css';

const LIMIT = 10;

/**
 * 5.5d — plná stránka novinek světa (`/svet/:worldSlug/novinky`). Veřejně
 * zobrazuje aktivní oznámení; PomocnyPJ+/Admin navíc archiv, tvorbu, editaci,
 * archivaci a mazání. Předloha: globální `NovinkyPage`.
 */
export default function WorldNewsPage() {
  const { worldId, worldSlug, userRole, loading } = useWorldContext();
  const currentUser = useAtomValue(currentUserAtom);

  const isGlobalAdmin =
    currentUser?.role !== undefined && currentUser.role <= UserRole.Admin;
  const canManage =
    isGlobalAdmin || (userRole ?? WorldRole.Zadatel) >= WorldRole.PomocnyPJ;

  const [params, setParams] = useSearchParams();
  const scope: WorldNewsScope =
    canManage && params.get('scope') === 'archived' ? 'archived' : 'active';
  const [page, setPage] = useState(1);

  const listQuery = useWorldNewsList({
    worldId,
    scope,
    limit: LIMIT,
    offset: (page - 1) * LIMIT,
  });
  const activeCount = useWorldNewsCount(worldId, 'active');
  const archivedCount = useWorldNewsCount(worldId, 'archived', canManage);

  const deleteMut = useDeleteWorldNews(worldId);
  const archiveMut = useArchiveWorldNews(worldId);
  const unarchiveMut = useUnarchiveWorldNews(worldId);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<WorldNewsItem | undefined>(undefined);
  const [toDelete, setToDelete] = useState<WorldNewsItem | null>(null);

  const items = listQuery.data ?? [];
  const total =
    (scope === 'archived' ? archivedCount : activeCount).data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function changeScope(next: WorldNewsScope) {
    const np = new URLSearchParams(params);
    if (next === 'active') np.delete('scope');
    else np.set('scope', next);
    setParams(np, { replace: true });
    setPage(1);
  }

  async function handleArchiveToggle(news: WorldNewsItem) {
    const mut = news.archived ? unarchiveMut : archiveMut;
    try {
      await mut.mutateAsync(news.id);
      toast.success(news.archived ? 'Oznámení obnoveno.' : 'Oznámení archivováno.');
    } catch {
      toast.error('Akce se nezdařila.');
    }
  }

  if (loading) {
    return <Spinner center />;
  }

  return (
    <article className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Novinky</h1>
        {canManage && (
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditing(undefined);
              setEditorOpen(true);
            }}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Nové oznámení</span>
          </Button>
        )}
      </header>

      {canManage && (
        <div className={s.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={scope === 'active'}
            className={`${s.tab} ${scope === 'active' ? s.tabActive : ''}`}
            onClick={() => changeScope('active')}
          >
            Aktivní
            {activeCount.data && (
              <span className={s.tabBadge}>{activeCount.data.total}</span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === 'archived'}
            className={`${s.tab} ${scope === 'archived' ? s.tabActive : ''}`}
            onClick={() => changeScope('archived')}
          >
            Archiv
            {archivedCount.data && (
              <span className={s.tabBadge}>{archivedCount.data.total}</span>
            )}
          </button>
        </div>
      )}

      {listQuery.isError ? (
        <p className={s.empty}>Nepodařilo se načíst novinky.</p>
      ) : listQuery.isLoading ? (
        <Spinner center />
      ) : items.length === 0 ? (
        <p className={s.empty}>
          {scope === 'archived' ? 'Archiv je prázdný.' : 'Zatím žádná oznámení.'}
        </p>
      ) : (
        <div className={s.list}>
          {items.map((news) => (
            <WorldNewsCard
              key={news.id}
              news={news}
              worldId={worldId}
              worldSlug={worldSlug}
              /* Globální novinky (worldId null) needituje PJ světa. */
              canManage={canManage && (isGlobalAdmin || news.worldId !== null)}
              onEdit={() => {
                setEditing(news);
                setEditorOpen(true);
              }}
              onArchive={() => void handleArchiveToggle(news)}
              onDelete={() => setToDelete(news)}
            />
          ))}
        </div>
      )}

      {total > LIMIT && (
        <div className={s.pagination}>
          <span className={s.pageInfo}>
            Strana {page} / {totalPages} · {total} oznámení
          </span>
          <div className={s.paginationButtons}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ← Předchozí
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Další →
            </Button>
          </div>
        </div>
      )}

      {editorOpen && (
        <WorldNewsEditorModal
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          worldId={worldId}
          editing={editing}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Smazat oznámení?"
        message={`Oznámení „${toDelete?.title}" bude trvale smazáno.`}
        confirmLabel="Smazat"
        confirmVariant="danger"
        isPending={deleteMut.isPending}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteMut.mutateAsync(toDelete.id);
            toast.success('Oznámení smazáno.');
          } catch {
            toast.error('Smazání selhalo.');
          }
          setToDelete(null);
        }}
      />
    </article>
  );
}
