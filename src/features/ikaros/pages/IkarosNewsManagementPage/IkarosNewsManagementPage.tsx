import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Archive,
  ArchiveRestore,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button, ConfirmDialog } from '@/shared/ui';
import { NewsFormModal } from '@/features/ikaros/components/NewsFormModal';
import {
  useArchiveIkarosNews,
  useDeleteIkarosNews,
  useIkarosNewsCount,
  useIkarosNewsList,
  useUnarchiveIkarosNews,
} from '@/features/ikaros/api/useIkarosNews';
import type { IkarosNews } from '@/shared/types';
import s from './IkarosNewsManagementPage.module.css';

type Tab = 'active' | 'archived';
const LIMIT = 20;

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

function mapAxiosError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401 || status === 403) return 'Nemáš oprávnění.';
    if (status === 404) return 'Novinka nenalezena.';
  }
  return fallback;
}

export default function IkarosNewsManagementPage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'archived' ? 'archived' : 'active';
  const [page, setPage] = useState(1);

  const listQuery = useIkarosNewsList({
    scope: tab,
    limit: LIMIT,
    offset: (page - 1) * LIMIT,
  });
  const activeCount = useIkarosNewsCount('active');
  const archivedCount = useIkarosNewsCount('archived');

  const archiveMutation = useArchiveIkarosNews();
  const unarchiveMutation = useUnarchiveIkarosNews();
  const deleteMutation = useDeleteIkarosNews();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IkarosNews | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IkarosNews | null>(null);

  const items = listQuery.data ?? [];
  const total = (tab === 'active' ? activeCount : archivedCount).data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function changeTab(next: Tab) {
    const newParams = new URLSearchParams(params);
    if (next === 'active') newParams.delete('tab');
    else newParams.set('tab', next);
    setParams(newParams, { replace: true });
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

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Správa novinek</h1>
        <Button
          variant="primary"
          size="md"
          onClick={() => setCreateOpen(true)}
          aria-label="Nová novinka"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Nová novinka</span>
        </Button>
      </div>

      <div className={s.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'active'}
          className={`${s.tab} ${tab === 'active' ? s.tabActive : ''}`}
          onClick={() => changeTab('active')}
        >
          Aktivní
          {activeCount.data && (
            <span className={s.tabBadge}>{activeCount.data.total}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'archived'}
          className={`${s.tab} ${tab === 'archived' ? s.tabActive : ''}`}
          onClick={() => changeTab('archived')}
        >
          Archiv
          {archivedCount.data && (
            <span className={s.tabBadge}>{archivedCount.data.total}</span>
          )}
        </button>
      </div>

      <div className={s.tableWrap}>
        {listQuery.isLoading ? (
          <p className={s.empty}>Načítám…</p>
        ) : items.length === 0 ? (
          <p className={s.empty}>
            {tab === 'active'
              ? 'Žádné aktivní novinky.'
              : 'Archiv je prázdný.'}
          </p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Nadpis</th>
                <th>Autor</th>
                <th>Vytvořeno</th>
                <th style={{ textAlign: 'right' }}>Akce</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className={s.titleCell} title={item.title}>
                    {item.title}
                  </td>
                  <td className={s.metaCell}>{item.authorName || '—'}</td>
                  <td className={s.metaCell}>
                    {formatDate(item.createdAtUtc)}
                  </td>
                  <td className={s.actionsCell}>
                    <button
                      type="button"
                      className={s.iconBtn}
                      aria-label="Upravit"
                      title="Upravit"
                      onClick={() => setEditTarget(item)}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    {tab === 'active' ? (
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
              Tato akce je <strong>nevratná</strong>. Novinka bude odstraněna
              z databáze.
            </p>
          </>
        }
        confirmLabel="Smazat"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
