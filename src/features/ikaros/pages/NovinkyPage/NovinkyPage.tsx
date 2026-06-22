import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import axios from 'axios';
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, ConfirmDialog, EmptyState, ErrorState } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { NewsCard } from '@/features/ikaros/components/NewsCard';
import { NewsFormModal } from '@/features/ikaros/components/NewsFormModal';
import {
  useArchiveIkarosNews,
  useDeleteIkarosNews,
  useIkarosNewsCount,
  useIkarosNewsList,
  useUnarchiveIkarosNews,
} from '@/features/ikaros/api/useIkarosNews';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, type IkarosNews } from '@/shared/types';
import s from './NovinkyPage.module.css';

type Scope = 'active' | 'archived';
const LIMIT = 10;

function mapAxiosError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401 || status === 403) return 'Nemáš oprávnění.';
    if (status === 404) return 'Novinka nenalezena.';
  }
  return fallback;
}

/**
 * Spec 3.1b — veřejná stránka Novinky + jediný hub pro správu. Anon/hráč vidí
 * archiv aktivních novinek (rozbalovací karty). Admin/Superadmin navíc:
 * přepínač Aktivní/Archiv, „Nová novinka", inline edit/archiv/smazat.
 * Nahrazuje dřívější redirect i tab v `/ikaros/uzivatele`.
 */
export function NovinkyPage() {
  const currentUser = useAtomValue(currentUserAtom);
  const isAdmin =
    currentUser?.role === UserRole.Admin ||
    currentUser?.role === UserRole.Superadmin;

  const [params, setParams] = useSearchParams();
  const scope: Scope =
    isAdmin && params.get('novinky') === 'archived' ? 'archived' : 'active';
  const [page, setPage] = useState(1);

  const listQuery = useIkarosNewsList({
    scope,
    limit: LIMIT,
    offset: (page - 1) * LIMIT,
  });
  const activeCount = useIkarosNewsCount('active');
  // Archiv count je Admin-only endpoint — pro běžné uživatele nespouštět.
  const archivedCount = useIkarosNewsCount('archived', isAdmin);

  const archiveMutation = useArchiveIkarosNews();
  const unarchiveMutation = useUnarchiveIkarosNews();
  const deleteMutation = useDeleteIkarosNews();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IkarosNews | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IkarosNews | null>(null);

  const items = listQuery.data ?? [];
  const total =
    (scope === 'active' ? activeCount : archivedCount).data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function changeScope(next: Scope) {
    const np = new URLSearchParams(params);
    if (next === 'active') np.delete('novinky');
    else np.set('novinky', next);
    setParams(np, { replace: true });
    setPage(1);
  }

  function handleArchive(item: IkarosNews) {
    archiveMutation.mutate(item.id, {
      onSuccess: () => toast.success('Novinka archivována.'),
      onError: (err) =>
        toast.error(mapAxiosError(err, 'Nepodařilo se archivovat novinku.')),
    });
  }

  function handleUnarchive(item: IkarosNews) {
    unarchiveMutation.mutate(item.id, {
      onSuccess: () => toast.success('Novinka obnovena.'),
      onError: (err) =>
        toast.error(mapAxiosError(err, 'Nepodařilo se obnovit novinku.')),
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Novinka smazána.');
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(mapAxiosError(err, 'Nepodařilo se smazat novinku.'));
        setDeleteTarget(null);
      },
    });
  }

  function adminActions(item: IkarosNews) {
    return (
      <div className={s.adminActions}>
        <button
          type="button"
          className={s.iconBtn}
          aria-label="Upravit"
          title="Upravit"
          onClick={() => setEditTarget(item)}
        >
          <Pencil size={16} aria-hidden="true" />
        </button>
        {scope === 'active' ? (
          <button
            type="button"
            className={s.iconBtn}
            aria-label="Archivovat"
            title="Archivovat"
            onClick={() => handleArchive(item)}
            disabled={archiveMutation.isPending}
          >
            <Archive size={16} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className={s.iconBtn}
            aria-label="Obnovit"
            title="Obnovit"
            onClick={() => handleUnarchive(item)}
            disabled={unarchiveMutation.isPending}
          >
            <ArchiveRestore size={16} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className={`${s.iconBtn} ${s.iconBtnDanger}`}
          aria-label="Smazat"
          title="Smazat (nevratné)"
          onClick={() => setDeleteTarget(item)}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <article className={s.page}>
      <Seo
        title="Novinky"
        description="Co je nového na platformě Ikaros — oznámení, nové funkce a dění v komunitě."
      />
      <header className={s.header}>
        <h1 className={s.title}>Novinky</h1>
        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setCreateOpen(true)}
            aria-label="Nová novinka"
          >
            <Plus size={16} aria-hidden="true" />
            <span>Nová novinka</span>
          </Button>
        )}
      </header>

      {isAdmin && (
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
        <ErrorState
          size="panel"
          title="Nepodařilo se načíst novinky."
          onRetry={() => void listQuery.refetch()}
        />
      ) : listQuery.isLoading ? (
        <p className={s.empty}>Načítám…</p>
      ) : items.length === 0 ? (
        scope === 'archived' ? (
          <EmptyState
            size="panel"
            illustration="messages"
            title="Archiv je prázdný."
          />
        ) : (
          <EmptyState
            size="hero"
            illustration="messages"
            title="Zatím žádné novinky."
            description="Až se něco semele, dáme ti vědět tady."
          />
        )
      ) : (
        <div className={s.list}>
          {items.map((news) => (
            <NewsCard
              key={news.id}
              news={news}
              adminSlot={isAdmin ? adminActions(news) : undefined}
            />
          ))}
        </div>
      )}

      {total > LIMIT && (
        <div className={s.pagination}>
          <span className={s.pageInfo}>
            Strana {page} / {totalPages} · {total} novinek
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

      {isAdmin && (
        <>
          <NewsFormModal
            mode="create"
            open={createOpen}
            onClose={() => setCreateOpen(false)}
          />
          <NewsFormModal
            mode="edit"
            open={!!editTarget}
            onClose={() => setEditTarget(null)}
            initialData={
              editTarget
                ? {
                    id: editTarget.id,
                    title: editTarget.title,
                    content: editTarget.content,
                    type: editTarget.type,
                    imageUrl: editTarget.imageUrl,
                  }
                : undefined
            }
          />
          <ConfirmDialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            title="Smazat novinku?"
            message={
              <>
                <p>
                  Opravdu chceš trvale smazat novinku
                  <strong> „{deleteTarget?.title}"</strong>?
                </p>
                <p>
                  Tato akce je <strong>nevratná</strong>. Novinka bude
                  odstraněna z databáze.
                </p>
              </>
            }
            confirmLabel="Smazat"
            confirmVariant="danger"
            onConfirm={confirmDelete}
            isPending={deleteMutation.isPending}
          />
        </>
      )}
    </article>
  );
}
